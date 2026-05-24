# FASTag Chain Reaction — Database Schema

PostgreSQL 15+ schema for the FASTag Chain Reaction backend. PostGIS is **optional**: geohash-prefix indexes give us proximity lookups good enough for a 38m precision tier (`geohash_8`) and ~1.2km tier (`geohash_6`). Enable PostGIS only when sub-meter routing or polygon containment becomes a product need.

---

## 1. Tables — purpose at a glance

| # | Table | Why it exists |
|---|---|---|
| 1 | `users` | Identity. Phone number is the login primitive in India — we keep a hashed lookup column and a separately-encrypted plaintext column so we can still send SMS / WhatsApp without keeping bare phone numbers indexable. |
| 2 | `vehicles` | A user can have multiple cars / trucks. FASTag is bound to a vehicle, not a person. Soft-deleted (`deleted_at`) so we can preserve historical telemetry attribution after a user removes a vehicle. |
| 3 | `toll_plazas` | Master catalog. ~1,200 active FASTag plazas in India today; small, mostly-read, replicated to every app on first install for offline lookups. |
| 4 | `fastag_status_cache` | NPCI / issuer balance look-ups are slow (300–1500ms) and rate-limited. We cache the last response per vehicle with a 5–15 minute TTL, refreshed proactively when the user enters a geofence around any plaza. |
| 5 | `geofence_events` | Append-only fact table. One row per "you are approaching plaza X" trigger fired by the client. Drives both UX (alert) and analytics (funnel). Partitioned monthly. |
| 6 | `recharge_txns` | UPI / NPCI recharge attempts. Idempotent on `npci_ref`. Linked to the geofence event that triggered the recharge so we can attribute prevented stops. |
| 7 | `toll_telemetry` | Crowdsourced ground truth: what actually happened when the vehicle arrived at the plaza. This is the loop that makes the system improve over time. Highest-volume table — partitioned monthly. |
| 8 | `alert_outcomes` | Funnel terminal state: did the user ignore / recharge / confirm-already-ok? Without this we cannot compute conversion, false-positive rate, or savings. |

---

## 2. Data flow (the chain reaction)

```
[client GPS]
    │  raw lat/lon ping (50–200 Hz batched, never written to DB)
    ▼
[edge geofence check]    ← uses geohash_8 prefix lookup on toll_plazas
    │  vehicle within R km of a known plaza?
    ▼
[fastag_status_cache.get(vehicle_id)]
    │  fresh? use it.  stale? hit NPCI/issuer, write back.
    ▼
[geofence_events INSERT]    ◀── status_at_fire snapshot stored as JSONB
    │  notification fanned out (FCM/APNs)
    ▼
[user reacts in app]
    ├── recharges → [recharge_txns INSERT, status=initiated]
    │                   │ webhook from PSP → status=success
    │                   ▼
    │              [alert_outcomes INSERT, action=recharged, recharge_txn_id=…]
    │
    ├── confirms ok  → [alert_outcomes INSERT, action=already_ok]
    └── ignores       → [alert_outcomes INSERT, action=ignored]  (or timeout sweeper)
        ▼
[vehicle passes plaza]
    ▼
[toll_telemetry INSERT]   ← arrived_at, wait_seconds, stop_reason
    │
    └─► feeds v_toll_health_24h  and  v_user_savings
```

Every step writes to exactly one table, and every event ID is traceable end-to-end: `geofence_events.event_id` → `alert_outcomes.event_id` → `recharge_txns.txn_id` → `toll_telemetry` (joined on vehicle + time window).

---

## 3. Privacy, encryption, retention

| Data class | Storage | Notes |
|---|---|---|
| Phone number | `users.phone_hash` = SHA-256(phone ‖ pepper); `users.phone_e164_enc` = AES-256-GCM under app KMS key | Hash for dedupe / login lookup, encrypted blob only decrypted in a privileged "messaging" service |
| Vehicle registration | `vehicles.registration_no` plaintext (low-sensitivity, printed on car); `registration_hash` for joins | Plaintext kept because users want to see "MH12AB1234" in the UI |
| FASTag serial | `vehicles.fastag_serial_enc` AES-GCM | High-sensitivity — issuer APIs treat it like a PAN |
| Push token | `users.push_token` plaintext | Rotates frequently; not a stable identifier |
| GPS pings | **never stored** | Only the resulting `geofence_events` row is persisted. Raw pings stay on device. |
| `geofence_events` | Retained 90 days hot, then aggregated and dropped | Older partitions are detached and archived to S3 Parquet for analytics |
| `toll_telemetry` | Retained 365 days hot | Long horizon needed for seasonal toll-jam analysis |
| `recharge_txns` | Retained 7 years | Regulatory — payment records |
| `alert_outcomes` | Retained 365 days | Funnel analytics, then aggregated |
| `fastag_status_cache` | TTL 5–15 min, swept hourly | Never archived — pure cache |

A pepper for `phone_hash` lives in a KMS-managed secret, not in code, not in the DB.

---

## 4. Scale assumptions and partitioning

Working assumption: **1M MAU**, average **100 GPS pings/day** stored as **~3 geofence events/day** (most pings never cross a plaza fence). At 1M users that is:

| Table | Daily rows | Annual rows | Strategy |
|---|---|---|---|
| `geofence_events` | 3M | ~1.1B | **Monthly RANGE partitions** on `fired_at`. Old partitions detached and dumped to Parquet after 90 days. |
| `toll_telemetry` | 1–2M (crowdsourced subset) | ~500M | **Monthly RANGE partitions** on `arrived_at`. Indexed first by `(toll_id, arrived_at DESC)` — the only hot query shape. |
| `recharge_txns` | ~50K | ~18M | Single table is fine for years; index on `(user_id, initiated_at DESC)` covers the UX query. |
| `alert_outcomes` | 1–2M | ~500M | Single table for now, partition when it crosses 100M rows. |
| `fastag_status_cache` | up to 1M rows steady state | 1M | Hot in RAM, evict on TTL via background sweeper. |

Note on raw GPS pings: **100M pings/day is the device-emitted volume**, not the DB-write volume. The architecture is intentionally edge-first — pings are processed on-device and only the small subset that crosses a geofence becomes a row.

### Partition automation
A `pg_cron` job runs nightly:
1. Create next-month partition for `geofence_events` and `toll_telemetry` if missing.
2. Detach partitions older than retention window.
3. `pg_dump` detached partition → S3 (Parquet via `pgsql-parquet-fdw` or external worker).
4. Drop the detached partition.

### Read scaling
- Single primary writer.
- 2× read replicas behind PgBouncer for the analytics views and v\_\* lookups.
- Connection-pool the cache table separately — it sees roughly 10× the traffic of every other table combined.

---

## 5. Sample queries

### Top 10 most jammed tolls in the last 24 hours
```sql
SELECT
    tp.toll_id,
    tp.name,
    tp.highway,
    tp.state,
    COUNT(*)                                   AS sample_passes,
    ROUND(AVG(tt.wait_seconds)::numeric, 1)    AS avg_wait_seconds,
    ROUND((PERCENTILE_CONT(0.95)
        WITHIN GROUP (ORDER BY tt.wait_seconds))::numeric, 1) AS p95_wait_seconds,
    COUNT(*) FILTER (WHERE tt.stop_reason <> 'normal_pass')   AS abnormal_stops
FROM toll_telemetry tt
JOIN toll_plazas tp ON tp.toll_id = tt.toll_id
WHERE tt.arrived_at > NOW() - INTERVAL '24 hours'
GROUP BY tp.toll_id, tp.name, tp.highway, tp.state
HAVING COUNT(*) >= 20            -- minimum sample to avoid noise
ORDER BY p95_wait_seconds DESC NULLS LAST
LIMIT 10;
```

This query uses the `idx_telemetry_toll_arrived` index on `(toll_id, arrived_at DESC)` for partition-pruned access and computes both mean and tail latency so a single outlier truck does not dominate the ranking.

### Active alerts a user has open right now
```sql
SELECT * FROM v_active_alerts WHERE user_id = $1;
```

### A user's lifetime "stops prevented" for the savings screen
```sql
SELECT * FROM v_user_savings WHERE user_id = $1;
```

---

## 6. Migration order

If applying piece by piece:
1. extensions → 2. enums → 3. `users` → 4. `vehicles` → 5. `toll_plazas` → 6. `fastag_status_cache` → 7. `geofence_events` + partitions → 8. `recharge_txns` → 9. `toll_telemetry` + partitions → 10. `alert_outcomes` → 11. triggers → 12. views → 13. seed data.

`schema.sql` is idempotent-safe to run on a fresh database in this exact order.

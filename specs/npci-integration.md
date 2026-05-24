# NPCI / NETC Integration Specification — FASTag Chain Reaction

**Status:** Draft v1 (hackathon-grade). Production paths flagged inline.
**Scope:** Balance + status query for a FASTag identified by VRN, and a UPI-initiated recharge when balance is insufficient for the upcoming toll plaza.

---

## 1. NPCI / NETC Ecosystem

Four layers; speak to the correct one per call:

1. **NPCI** — owns the **NETC switch** and the **NETC Mapper** (authoritative DB mapping every Tag ID to VRN, vehicle class, KYC state, `Hotlist | Lowbalance | Blacklist | Active`). Publishes the wire-protocol contract: **NETC ICD v2.5** and **Procedural Guidelines v1.9**, hosted under `ihmcl.co.in`. Both member-only, not freely indexable.
2. **IHMCL** — NHAI's commercial arm; operates NETC and publishes circulars (e.g. NETC OC 006 FY25-26: Good Faith dispute TAT cut to 90-day raise / 15-day respond, effective 01-Dec-2025).
3. **Issuer Banks** — hold the prepaid wallet. After March-2024 RBI action **Paytm Payments Bank was removed**; live issuers include ICICI, HDFC, Axis, SBI, IDFC FIRST, Airtel Payments Bank, Kotak, IndusInd, BoB, PNB and ~22 others. Each has its own API and `netc.<VRN>@<handle>` VPA.
4. **Acquirer Banks / TSPs** — sit behind the toll plaza, post `PayReq` to the switch. We are not in this path; we only consume resulting state.

We are a value-added overlay — not acquirer, issuer, or TPAP. Production paths: (a) NPCI **Value-Added Service Partner** (`npci.partners@npci.org.in`), or (b) ride a licensed aggregator (Setu / Surepass) that already integrated the banks.

## 2. Balance / Status Query APIs

NPCI exposes **no public consumer balance-enquiry API**. The ICD `BalEnq` / `NON_FIN` message types are member-only, on the inter-bank rail. Three realistic paths:

**A. Aggregator (recommended for v1).** **Surepass** `RC to FASTag Balance Check` + `FASTag Monitoring` — input `vrn`, output `{customer_name, balance, status, last_recharge_date, validity, issuer_bank}`. REST + JWT. Pricing gated behind sandbox signup. Freshness depends on bank feed: typically **5–15 min lag**, not real-time at lane. **Setu FASTag** (`docs.setu.co/payments/fastag`) — issuance, balance, recharge, suspension; "nominal yearly subscription + per-txn %"; self-serve sandbox. Setu also exposes the BBPS `customer/validate` flow — the only NPCI-sanctioned "flexible amount" path for FASTag.

**B. Per-bank direct (painful).** Each issuer has a dev portal — e.g. **ICICI** `developer.icicibank.com` (450+ APIs, sandbox `sandbox.icicibank.com`), HDFC PayZapp, IDFC FIRST etoll. None expose a public balance-by-VRN endpoint; partnership required (KYC, indemnity, security audit). **4–12 weeks per bank** × 25 issuers — the gap Setu/Surepass fill.

**C. NPCI status portal (hackathon-only).** `npci.org.in/netcfastag-status` — VRN + CAPTCHA + OTP, returns status only (no balance), ToS forbids scraping.

**Canonical request/response (aggregator pattern, normalised):**
```
POST https://kyc-api.surepass.io/api/v1/fastag/balance-check-by-vrn
Headers: Authorization: Bearer <JWT>, Content-Type: application/json
Body:    { "vrn": "MH04BB1234" }
200 OK:  { "success": true,
            "data": { "customer_name": "...",
                      "balance": "245.00",
                      "status": "ACTIVE",          // LOW_BALANCE | HOTLISTED | BLACKLISTED
                      "issuer_bank": "ICICI",
                      "last_txn_date": "2026-05-22T14:31:00+05:30",
                      "vehicle_class": "VC4" } }
```
Decision tree uses the **Feb-2025 NPCI rule (reason code 176)**: tag in `LOW_BALANCE | HOTLIST | BLACKLIST` for **>60 min before** lane read **and >10 min after** triggers a **2× penalty**. The **70-min grace window** (60 pre + 10 post) is exactly what we exploit — our 5 km geofence at ~80 km/h gives ~4 minutes, comfortably inside.

## 3. Issuer-Bank Fragmentation

We treat issuer as an opaque field returned by the balance call. For **deep-link recharge** we maintain a static table:

| Issuer            | UPI Handle    | Notes |
| ----------------- | ------------- | ----- |
| ICICI             | `@icici`      | Live |
| HDFC              | `@hdfcbank`   | Live |
| IDFC FIRST        | `@idfcnetc`   | Live |
| Airtel Payments   | `@mairtel`    | Live |
| Axis / SBI / Kotak | `@axisbank` / `@sbi` / `@kbl` | Live |
| **Paytm Payments Bank** | `@paytm` | **DEAD since 15-Mar-2024** — show migration banner |

VPA template: `netc.<VRN>@<handle>` (NPCI standardised). When a PPBL tag is detected, surface a one-tap "Switch issuer" CTA linking to the NHAI MyFASTag app rather than attempt a doomed recharge.

## 4. UPI Recharge — Intent, not Collect

**Decision: UPI Intent.** Rationale:
- Razorpay/PhonePe benchmarks: Intent ~**92–95%** success vs Collect ~75–80%. The gap is fatal at our 4-minute deadline.
- Effective **Feb 2026, NPCI restricted manual VPA entry on mobile** — Collect is being deprecated for in-app mobile flows; Intent is mandated.
- Intent requires zero typing; the user's PSP app opens pre-filled, ready to PIN.

Deep link:
```
upi://pay?pa=netc.MH04BB1234@icici&pn=ICICI%20FASTag&am=500.00
       &cu=INR&tn=FASTag%20Recharge%20MH04BB1234&tr=<our-txn-id>
```
Android: `Intent.ACTION_VIEW`; iOS: `UIApplication.open`. Poll balance every 10 s for up to 90 s; in parallel accept an aggregator webhook marking recharge complete. Collect is desktop-only fallback.

## 5. Sandbox / Onboarding & Cost

| Path | Apply | Timeline | Cost |
|---|---|---|---|
| Surepass sandbox | self-signup + sales | 1–3 d sandbox, 2–4 wk prod KYB | ~₹0.50–₹2 per balance hit (est.) |
| Setu FASTag sandbox | self-signup | same-day sandbox, 3–6 wk prod | yearly sub + % per txn |
| NPCI VAS Partner | `npci.partners@npci.org.in` | 3–6 mo (anecdotal; not published) | not public |
| Direct bank (ICICI etc.) | `developer.icicibank.com` interest form | 4–12 wk per bank | bilateral |
| Full NETC Member (issuer/acquirer) | NPCI partner portal + RBI PPI licence | 6–18 mo, requires PPI licence | crores in capital + audit |

Hackathon: Surepass sandbox + mocked UPI confirmation. Production v1: Setu (one contract, all banks).

## 6. Authentication & Security

- **Transport:** TLS 1.2+ everywhere. Aggregators accept bearer JWT over HTTPS. Direct bank integrations require **mTLS** with bank-issued client cert + **IP allowlisting** of our egress NAT.
- **Inter-bank signing:** NETC messages are XML, **PKCS#7 / XML-DSig** signed with the member's NPCI-issued cert (ICD §3). We don't touch this layer.
- **Webhook auth:** HMAC-SHA256 of raw body, key rotated quarterly; verified before processing.
- **Secrets:** JWTs rotate every 30 d, stored in AWS Secrets Manager (`ap-south-1` only — see §8).
- **PII minimisation:** persist only `vrn`, `issuer`, `last_known_balance`, `last_checked_at`. No tag ID, no KYC, no name beyond session.

## 7. Rate Limits & SLAs

Public limits unpublished. Observed/negotiable:
- Surepass sandbox ~30 req/min; prod tiers 100–1000 req/min.
- Setu enterprise-negotiated; default ~50 TPS.
- NETC backbone (informational): NPCI SLA **≥95% of online txns cleared within 2 min** of lane read; **3-day** window for acquirer to honour delayed presentments; **90-day** Good Faith dispute window (post Dec-2025).
- Internal target: balance check **p95 < 800 ms**; **≤1 call per VRN per 90 s** — cache aggressively, balances don't move unless we just recharged.

## 8. Data Residency

RBI's **Storage of Payment System Data** circular (Apr-2018, re-affirmed 2024–25) mandates Indian-payment-system data be stored only on servers **physically in India**. Foreign processing requires purge within **24 h / 1 business day**, whichever is earlier; from Jan-2025 extended fully to foreign banks. We deploy to **AWS `ap-south-1` (Mumbai)** or **`ap-south-2` (Hyderabad)** only; no replication/logs/analytics outside India. Vercel/Netlify defaults are non-compliant — use them only for the marketing site, never the API.

## 9. Webhook Architecture

Two inbound streams from the aggregator:
- `balance.updated` — issuer-pushed deduction or recharge. Payload `{vrn, balance, delta, txn_type, timestamp, signature}`; invalidates cache and re-evaluates active geofences.
- `recharge.completed | recharge.failed` — terminal state of a UPI recharge we initiated; includes our `tr` correlation ID.

Endpoints: `POST /webhooks/netc/{balance,recharge}`, Cloudflare-fronted, HMAC-verified, idempotent on `(vrn, timestamp)`, 200-ack within 3 s or aggregator retries. Append-only Postgres `events` table written before any business logic — handlers must be re-entrant.

## 10. Hackathon Mocks vs Production

| Concern | Hackathon | Production v1 |
|---|---|---|
| Balance query | Surepass sandbox (or VRN-keyed fixtures) | Setu prod + Surepass failover |
| Recharge | UPI Intent + manual confirm | Intent + webhook reconciliation |
| Issuer routing | Static handle table | Same, weekly refresh from NPCI live-members |
| Auth | JWT bearer in code | mTLS to bank + Secrets Manager rotation |
| Data residency | localhost / Mumbai dev box | `ap-south-1`, India-only logs |
| Webhooks | 10 s polling | HMAC webhooks + 90 s polling fallback |
| Geofence | Bundled NHAI toll-plaza CSV | Same + nightly delta from `tis.nhai.gov.in` |
| Compliance | None | RBI PSD localisation, CERT-In incident reporting, annual VAPT |

**Realistic critical path to a live paying user:** Surepass sandbox in days; Setu prod contract + integration **6–8 weeks**; CERT-In empanelled VAPT **2–4 weeks**; soft launch in **~3 months**. NPCI VAS Partner status is a Year-2 effort, not a launch dependency.

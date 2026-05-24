# Push Notifications Spec — FASTag Chain Reaction

The 5 km pre-warning is the product. If the notification doesn't land while the user is driving (screen off, app backgrounded, possibly DND on), the entire chain-reaction model fails. This spec defines the delivery layer.

## Why FCM (Firebase Cloud Messaging)

We use **FCM HTTP v1 API** as the single send pipeline for both Android (native FCM) and iOS (FCM relays to APNs). One backend SDK, one token registry, one analytics surface.

**Alternatives considered:**
- **OneSignal** — nicer dashboard, segmentation built-in, but adds a vendor dependency for what is essentially a thin wrapper over FCM/APNs. Free tier capped at 10k MAU.
- **AWS SNS** — fine if we were already on AWS for everything, but the mobile push abstraction is leakier than FCM and topic management is clunkier.
- **Direct APNs + FCM split** — gives the most control but doubles the integration surface (two cert/key rotations, two payload shapes, two retry policies). Not worth it for a 2-platform launch.

FCM wins on: zero cost at our scale, native Android integration, first-class iOS support via APNs bridge, topic + condition messaging, and Analytics integration if we add Firebase Analytics later.

## Notification Types

All payloads use a `type` field in `data` so the client can route. Seven launch types:

| Type | Trigger | Priority | Deep link |
|---|---|---|---|
| `LOW_BALANCE` | 5 km geofence + wallet < expected toll | high | `/recharge` |
| `BLACKLISTED` | Tag status check returns blacklisted | high | `/tag-status` |
| `KYC_EXPIRED` | KYC expiry check (daily cron) | normal | `/kyc` |
| `CLASS_MISMATCH` | Vehicle class on tag != plate class | high | `/tag-status` |
| `RECHARGE_SUCCESS` | Wallet top-up confirmed | normal | `/wallet` |
| `RECHARGE_FAILED` | Top-up failed (payment / bank) | high | `/recharge` |
| `LANE_SUGGESTION` | Plaza approach + lane congestion data | high | `/lane` |

Full payload schemas in `fcm-payload-examples.json`.

## High-Priority Delivery

**Android** — `android.priority: "HIGH"` wakes the device from doze, bypasses App Standby buckets, and delivers immediately. Without it, FCM can defer messages indefinitely on battery-saver mode. Use `notification.channel_id` pointing to a `HIGH` importance channel (created at app install) so the system shows a heads-up notification.

**iOS** — `apns-priority: 10` for immediate delivery. Crucially, **iOS 15+** requires `aps.interruption-level: "time-sensitive"` to break through Focus modes (including Driving Focus). For safety-critical alerts (`BLACKLISTED`, `CLASS_MISMATCH` at plaza), use `interruption-level: "critical"` — this requires the Critical Alerts entitlement from Apple (we must apply; turnaround ~2 weeks).

## Permission Flow

**Android 13+** — `POST_NOTIFICATIONS` runtime permission. Request **after** onboarding step 3 (tag verification), not at app launch, with rationale screen explaining "we'll warn you before plazas." Track denial rate; if >40% we move the prompt earlier with stronger copy.

**iOS** — `requestAuthorization` with `.alert`, `.sound`, `.badge`. Request post-onboarding for the same reason. For Critical Alerts, request `.criticalAlert` only on the safety-critical screen ("Get warned even on silent mode").

**Fallback for denied users** — in-app banner on home screen + SMS fallback for `LOW_BALANCE` and `BLACKLISTED` only (SMS costs money; we throttle to 1/day per user). Show a persistent "Notifications off — you may miss plaza warnings" badge.

## Background GPS → Notification Chain

```
Device (background GPS, geofence-only) 
  -> hits 5km geofence around plaza_id 
  -> POSTs {user_id, plaza_id, lat, lng} to /v1/geofence/enter
  -> backend evaluates: tag status + balance + expected toll for plaza
  -> if alert needed, calls FCM send with type + plaza context in data
  -> FCM -> device
  -> tap -> deep link via `data.deeplink` -> opens RechargeScreen with plaza pre-selected
```

Geofences are registered as **passive geofence triggers** on the device (Android `GeofencingClient`, iOS `CLCircularRegion`) so we don't drain battery with continuous GPS. Server keeps the canonical plaza list; client syncs the nearest 50 plazas on app open and on location change >25 km.

## Driving Mode Interop

- **Android Auto / Driving Mode** — our high-importance channel with `category: "CATEGORY_NAVIGATION"` shows on the car display. Audio-readout via `notification.tickerText` for accessibility.
- **iOS CarPlay + Driving Focus** — time-sensitive notifications pass through Driving Focus by default. Critical alerts (requires entitlement) bypass silent mode and DND entirely.
- **Suppression** — `RECHARGE_SUCCESS` and `KYC_EXPIRED` are **never** marked time-sensitive; they queue normally and don't interrupt driving.

## Multilingual Content

**Client-side localization** — server sends notification keys + interpolation values; client renders in user's locale. This keeps payloads small, lets us add languages without a backend deploy, and avoids stale-locale bugs.

```json
"data": {
  "type": "LOW_BALANCE",
  "i18n_key": "alert.low_balance.title",
  "i18n_args": {"amount": "120", "plaza": "Kherki Daula"}
}
```

For users on app versions without a key, server includes a fallback English `notification.title` / `notification.body`.

## Throttling + Quiet Hours

- **Per-user cooldown** — max 1 alert per `type` per 10 min. Max 3 alerts of any type per hour.
- **Quiet hours** — 23:00–05:00 local time suppress everything except `BLACKLISTED` and `CLASS_MISMATCH` (safety-critical at plaza approach).
- **Driving detection** — if geofence fired in last 30 min, allow time-sensitive alerts regardless of quiet hours.
- Server-side throttle in Redis with key `throttle:{user_id}:{type}`, TTL = cooldown window.

## Analytics

Per-notification event stream:
- `notification.sent` — server emits on FCM success
- `notification.delivered` — client confirms via `onMessageReceived` (Android) / `didReceiveRemoteNotification` (iOS)
- `notification.opened` — tap → app launch
- `notification.action_taken` — user reached the deep-linked screen
- `notification.dismissed` — swiped away
- **Key business KPI:** `alert_to_recharge_conversion_rate` = recharges within 15 min of `LOW_BALANCE` send / total `LOW_BALANCE` sent. Cohort by plaza, hour-of-day, alert distance (5km vs adjusted).

## Cost

- **FCM** — free, no per-message charge.
- **APNs** — free.
- **SMS fallback** — Twilio/MSG91 ~Rs 0.20/SMS in India; budget Rs 5,000/month at 25k SMS for denied-notification users.

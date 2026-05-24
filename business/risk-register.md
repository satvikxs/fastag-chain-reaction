# FASTag Chain Reaction — Risk Register

**Owner:** COO
**Last reviewed:** 2026-05-24
**Review cadence:** Bi-weekly until pilot launch; monthly thereafter.

This register catalogs the risks we have identified across regulatory, technical, market, operational, existential, financial, reputational, and security dimensions. Scoring uses Likelihood (L/M/H) × Impact (L/M/H), producing a composite Score on a 1-9 scale, with "Critical" reserved for any item scoring 9 or with a binary kill characteristic.

We are not in the business of pretending the risk surface is small. It is large. The MLFF transition is an existential clock on our core use case, and several technical realities (background location on iOS, OEM push delivery on Indian Android) are working actively against us.

## Risk Table

| ID | Risk | Likelihood | Impact | Score | Mitigation | Owner | Trigger |
|----|------|-----------|--------|-------|------------|-------|---------|
| R-01 | MLFF (Multi-Lane Free Flow) eliminates physical toll plazas by EOY 2026, killing the core geofenced-alert use case | H | H | Critical | Pivot path pre-defined to FASTag-as-payment-rail (parking, fuel, drive-thru). 6-month MLFF watch with NHAI quarterly readouts. Architect for use-case portability from day one. | CEO | Any NHAI announcement of MLFF rollout schedule for >30% of plazas |
| R-02 | NPCI denies partnership / production API access | H | H | Critical | Pursue parallel path via Issuer Bank sponsorship (IDFC FIRST, Axis). Build read-only MVP using public FASTag balance check endpoints. Engage NPCI early through warm intro. | CEO | NPCI rejection letter or >90 day silence post-application |
| R-03 | NHAI declares Rajmargyatra as exclusive FASTag companion app | H | H | Critical | Position as complementary (alerts + recharge UX) not competitive (toll payment). Pre-build integration story. Cultivate MoRTH relationship independent of NHAI. | CEO | Any NHAI/MoRTH circular naming Rajmargyatra as exclusive |
| R-04 | Paytm or PhonePe ships geofenced FASTag low-balance alerts | H | M | 6 | Speed to market. Build defensible data moat via crowd-sourced plaza queue intel. Focus on alert quality, not feature parity. | Head of Product | Competitor public release or job posting hint |
| R-05 | iOS background location restrictions degrade geofence reliability | H | M | 6 | Use significant-location-change API + visit monitoring rather than continuous tracking. Server-side prediction from infrequent pings. Explicit user education on "Always Allow." | CTO | <70% geofence hit rate in iOS beta |
| R-06 | Android OEM (Xiaomi/OPPO/Vivo/Realme MIUI/ColorOS) kills background service and blocks FCM | H | H | Critical | OEM-specific autostart onboarding flows (copy DontKillMyApp). Fallback to high-priority FCM + heads-up notification. SMS fallback for critical alerts. Track per-OEM delivery rate. | CTO | <60% FCM delivery on top 3 OEMs |
| R-07 | GPS accuracy collapses in urban canyons / multi-level flyovers | M | M | 4 | Sensor fusion (GPS + cell + Wi-Fi + accelerometer). Plaza-specific geofence radius tuning. Manual "I'm approaching" override. | CTO | Field test false-negative rate >15% |
| R-08 | NPCI API rate limits throttle balance checks at scale | M | M | 4 | Aggressive client-side caching with TTL aligned to user toll cadence. Negotiate quota in partnership terms. Batch balance polling. | CTO | Rate-limit errors >2% of calls |
| R-09 | NPCI sandbox is unavailable / unstable during integration | H | M | 6 | Build mock NPCI layer matching documented contract. Maintain dual-environment test harness. Allocate 2× planned integration time. | Eng Lead | Sandbox downtime >48hrs cumulative in a sprint |
| R-10 | DPDP Act enforcement on location data — consent, retention, breach reporting | M | H | 6 | DPO appointed pre-launch. Granular consent UI. Location data retention capped at 30 days, anonymized after. Data Fiduciary registration filed. Breach response runbook. | Legal | DPDP Board first enforcement action against any consumer app |
| R-11 | Google Maps adds native FASTag balance awareness | M | H | 6 | Pivot to deeper journey context (recharge UX, fuel station integration, parking). Treat Maps as distribution partner (deep links), not pure competitor. | Head of Product | Any Google I/O or Maps update announcement |
| R-12 | Low driver adoption — under 50k MAU at month 6 | H | H | Critical | Pre-launch fleet pilots (Porter, BlackBuck, Rivigo). Referral economics designed in. Hero use case must demo in <90 seconds. | Head of Growth | <10k WAU at month 3 |
| R-13 | Alert fatigue and false positives erode trust | M | H | 6 | Quiet hours by default. Confidence-thresholded alerts only. Per-user mute/snooze. Weekly accuracy dashboards reviewed by Product. | Head of Product | NPS <30 or uninstall rate >8% week-over-week |
| R-14 | Driver crashes while interacting with the app | M | H | 6 | Hands-free voice alerts as default. Auto-suppress UI when speed >20 km/h. No tap-to-recharge while moving. Explicit driver safety disclaimer. Insurance + indemnity clauses with fleet partners. | Head of Product | First user-reported incident, any severity |
| R-15 | Privacy breach — location dataset leaked or scraped | L | H | 6 | Encryption at rest + in transit. Annual third-party pentest. Bug bounty from month 3. Zero-trust internal access. Cyber insurance policy. | CTO | Any unauthorized access event |
| R-16 | UPI recharge fraud — chargebacks, stolen card recharges | M | M | 4 | PA/PG partner with built-in fraud rules. Velocity checks (max 3 recharges/day/user). KYC tier-gating on recharge ceiling. | CFO | Chargeback rate >0.5% of transaction value |
| R-17 | Account takeover via OTP interception / SIM swap | M | H | 6 | Device binding post-first-login. Step-up auth for recharge actions. SIM-swap detection via Truecaller-grade APIs. | CTO | First confirmed ATO incident |
| R-18 | GPS spoofing to inject fake telemetry / game referral system | M | L | 2 | Mock-location detection on Android. Server-side speed/path plausibility checks. Referral fraud scoring before payout. | CTO | Spoofed-event rate >1% of telemetry |
| R-19 | CAC > LTV — driver acquisition cost exceeds lifetime value | M | H | 6 | Organic-first growth (fleet B2B2C, referrals). Defer paid acquisition until unit economics proven. Monthly cohort review. | CFO | Blended CAC/LTV <1.0 at month 4 |
| R-20 | NHAI pilot extends indefinitely without revenue contract | H | M | 6 | Time-boxed pilot MoU with explicit conversion gate. Parallel B2B fleet revenue stream so we are not dependent on NHAI cashflow. | CEO | Pilot extension request beyond month 9 |
| R-21 | NPCI integration cost overruns 2× estimate | M | M | 4 | Fixed-fee SoW with integration partner where possible. Internal engineer assigned full-time, not fractional. Monthly burn review against integration milestones. | CFO | >25% budget overrun by mid-integration |

**Total risks tracked: 21** (within the 15-18 target the team set, expanded by 3 to capture security and financial completeness).

---

## Top 3 Risks — Deeper Mitigation Playbooks

### R-01: MLFF eliminates physical toll plazas

This is our existential clock. NHAI's stated ambition is to retire physical plazas, and the political will to reduce highway congestion is real. Our mitigation is not denial but architectural readiness. From day one, the data model treats "trigger event" as polymorphic — a geofenced plaza today, but extensible to any FASTag debit event (parking exit, fuel station drive-off, drive-thru). The mobile app and alert engine are designed so the trigger surface can be swapped without touching the user experience layer. We commit to a quarterly MLFF-readout from our NHAI liaison, and a board-level "pivot trigger" if any state announces MLFF deployment across more than 30% of its plazas. Pivot destinations are pre-validated: parking (Park+ partnership talks already initiated), fuel (IOC FASTag-at-pump pilot is live), and tolled urban expressways which will remain plaza-based longer than national highways.

### R-02: NPCI denies partnership / production API access

NPCI is not in the habit of saying yes quickly to third parties, and our category (consumer-facing balance intelligence) is unprecedented in their partner taxonomy. We are running three parallel tracks: (1) direct NPCI engagement via a warm intro from a former NPCI executive on our advisory board; (2) sponsor-bank route through IDFC FIRST or Axis, both of whom have indicated openness to white-label arrangements; (3) a read-only MVP that uses only publicly available endpoints, sufficient to prove demand without requiring a partnership at all. Any 90-day silence from NPCI triggers automatic escalation to the sponsor-bank track. We will not let NPCI's silence become our blocker.

### R-12: Low driver adoption

Indian commercial drivers are the hardest consumer audience in the country to acquire and retain in an app — low trust, high churn, fragmented language preferences, and most have been burned by previous apps that overpromised. Our hero use case (avoiding the queue at a toll because the alert told you to recharge 10 minutes earlier) must demonstrate within 90 seconds of install, or we lose them. We are pre-baking distribution through three fleet partnerships (Porter, BlackBuck, Rivigo) where the fleet operator pushes adoption rather than us begging individual drivers. Referral economics are designed before launch, not bolted on. Localization in 8 Indian languages from v1. If we are below 10k WAU at month 3, we trigger a product re-scoping review.

---

## Risks That Should Kill the Project (Red Lines)

We commit, in writing, to shut down or pivot under any of the following conditions. These are not soft signals — they are binary.

1. **MLFF deployment crosses 50% of national highway plazas with a confirmed sub-12-month full-rollout timeline.** Core use case dies; remaining runway gets reallocated to pivot use case only if pivot is independently funded.
2. **NPCI formally rejects partnership AND sponsor-bank route fails within the same 6-month window.** Without payment/balance integration, we are a notification app for data we cannot access.
3. **NHAI confers de jure exclusivity on Rajmargyatra for any consumer-facing FASTag use case.** Regulatory moat against us; no legal path to operate.
4. **A driver fatality is causally linked to interaction with our app, and our safety controls are found to be inadequate.** Ethical and legal kill condition. We pause new-user onboarding immediately and conduct independent review.
5. **CAC/LTV blended ratio remains below 0.7 at month 9 despite three iterations of growth strategy.** Unit economics broken; no path to profitable scale.

## What We Learn in the First 30 Days That Updates This Register Most

The single highest-information period is the first 30 days post-pilot launch. By day 30 we will have concrete data on: (a) **real-world geofence hit rate** across iOS and the top 4 Android OEMs — this directly recalibrates R-05, R-06, R-07, and tells us whether our core technical premise holds; (b) **NPCI partnership posture** as it crystallizes from initial conversations into either a path forward or a polite slow-no, which collapses R-02 into either a Medium or a Critical; (c) **driver D7 and D30 retention curves** from the first fleet cohort, which is the earliest honest read on R-12 and R-19 together. These three data points alone could rewrite half of this register. We will hold a formal risk-register revision at day 35.

---

## Risks We Are Deliberately Accepting

These are not risks we are ignoring — they are risks we have looked at, sized, and consciously chosen to carry into v1.

- **Offline / low-bandwidth recharge is not in v1.** Drivers in tier-3 cities with patchy connectivity will be unable to recharge in the critical 5-minute window before a plaza. We accept this gap; v2 will add SMS-initiated recharge fallback via a sponsor-bank gateway. Estimated impact: ~8% of addressable users underserved at launch.
- **iOS will be a second-class citizen at launch.** Background location on iOS is hostile to our use case, and the engineering effort to make it competitive with Android delays launch by an estimated 6-8 weeks. We ship Android-first, iOS in v1.1, and accept the optics of a partial launch.
- **We will not support FASTag wallets from every issuer bank at launch.** Top 6 issuers cover ~85% of FASTag stock; the long tail of 30+ smaller issuers waits for v1.2. Some users will see "issuer not supported" and churn. Acceptable.
- **No native voice assistant integration (Alexa, Google Assistant) in v1.** Useful but not on the critical path.
- **No fleet-admin web dashboard in v1.** Fleet partners receive CSV exports and a shared Looker view. A proper SaaS dashboard is a v2 deliverable. We accept that this caps the size of fleet we can onboard before v2.
- **We are accepting some alert latency (target: under 90 seconds end-to-end, not under 30).** Lower latency requires architecture we are deferring. 90 seconds is sufficient for the toll-approach use case in 95% of road conditions.

Each accepted risk has a v2 ticket already filed and a named owner. Acceptance does not mean forgetting.

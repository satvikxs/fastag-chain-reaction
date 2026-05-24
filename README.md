# FASTag Chain Reaction

**Stop the wave before it starts.**

A geofenced pre-warning system that catches FASTag failures 5 km before the toll plaza — so the car never stops, the lane never blocks, and the jam never forms.

---

## The Problem

You're driving on NH-48. Traffic is moving. Then, with no warning, it isn't. Twenty minutes later you crawl past a toll plaza where everything looks normal. There was no accident. No construction. So what happened?

Five minutes earlier, one car reached the FASTag lane with a low balance. The boom didn't lift. The driver fumbled for a phone, opened an app, tried to recharge — 90 seconds of stationary vehicle in a high-throughput lane. Behind that car, a queue formed. Behind that queue, a slower queue. The wave propagated backward at roughly walking pace while the highway kept feeding cars in at 80 km/h. Our Nagel-Schreckenberg single-lane simulator shows one 90-second stall queues ~71 vehicles with ~3.1 minutes of residual slowdown. Extrapolated to a typical 3-lane Indian toll running ~600 vph throughput, the wave-equivalent affects 200+ vehicles over 12–15 minutes (model extrapolation, not a measurement — flagged for honesty).

This is a chain reaction. The toll plaza is the trigger, the FASTag failure is the spark, and the highway's own throughput is the fuel. NHAI attributes 12–15% of highway congestion to toll plazas. Roughly 30% of those stops are low-balance — the rest are blacklisted tags, expired KYC, and vehicle-class mismatches. Every existing alert system (Paytm, ICICI, HDFC, NPCI SMS) is **time-based or threshold-based**. NHAI's own Rajmargyatra app handles balance check + recharge across 13 languages — but no documented geofenced pre-toll readiness check across issuer banks. None of them know you're about to hit a toll in 4 minutes.

## The Solution

FASTag Chain Reaction is a phone app that does one thing well: it knows where the toll plazas are, it knows where you are, and 5 km out it checks all four failure modes in parallel — balance, blacklist status, KYC expiry, and vehicle-class match. If anything is wrong, it interrupts you loudly enough that you fix it at the next 90 seconds of free road, not at the boom barrier.

The unlock is geofencing + cross-bank aggregation, not better alerts. A driver who recharges 5 km early is invisible to the queue. A driver who recharges at the boom *is* the queue. The framing is **prevention of the trigger**, not wave dissipation — the Stern 2018 MIT field experiment showed that wave-dampening requires a controlled/autonomous vehicle, not a human responding to a push notification. Sugiyama 2008's ring-road work plus our own simulator suggest **~4% pre-warning adoption is enough to keep the cascade below critical density on a single-lane approach** — you don't need to fix every car, you need to remove enough sparks that the chain reaction never starts.

Year-2 note: MLFF (Multi-Lane Free Flow) goes nationwide end-2026. Physical plazas start disappearing. The same geofence layer pivots to warning drivers before they cross a tolling gantry — where post-trip penalties, blacklisting and 2x-toll fines still apply. Same product, different copy.

---

## Repository Structure

```
fastag-chain-reaction/
├── README.md            # this file
├── pitch-script.md      # 3-minute spoken pitch with stage directions
├── judge-qa.md          # anticipated Q&A prep for judges
├── sim/                 # traffic simulator — A/B with and without the app
├── app-mockup/          # interactive HTML mockup of the driver app
├── deck/                # presentation slides
├── research/            # verified stats, sources, citations
└── diagrams/            # system architecture, geofence flow, cascade visuals
```

## How to Run the Demo

1. **Traffic simulator (A/B)** — see `sim/README.md`. Two scenarios: one stalled car at the toll without the app (jam forms), the same scenario with 4% app adoption (jam doesn't form).
2. **Driver app mockup** — open `app-mockup/index.html` in any browser. Walks through the 5 km warning, the four failure modes, and the one-tap UPI recharge flow.
3. **Pitch + slides** — `pitch-script.md` paired with `deck/`.

## Tech Stack

- **Simulator:** JavaScript + Canvas (intelligent driver model, backward wave propagation)
- **App mockup:** HTML / CSS / Vanilla JS — no build step, runs anywhere
- **Geofence logic:** GPS + offline-cached toll-plaza coordinates (NHAI publishes ~1,000 locations)
- **Payments:** UPI deep-link (no payment gateway dependency for v1)
- **Backend (planned):** Polling FASTag status APIs where available; SMS/USSD fallback where not
- **Deck:** Markdown → PDF

## Team

_TBD — add names, roles, contact._

---

Built for **[Hackathon Name]** · Theme: **Chain Reaction**

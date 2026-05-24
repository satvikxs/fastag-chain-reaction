<!-- Render brand color: #0B2545 (highway-blue) for all subheads on export -->

# FASTag Chain Reaction
**Stop the wave before it starts.** A 5km pre-toll FASTag readiness layer that prevents queue cascades at Indian toll plazas.

*Executive Summary — 24 May 2026  ·  Contact: [name] · [email] · [phone]*

---

## The Problem
A single stopped vehicle at an Indian toll plaza propagates a backward shockwave that delays 200+ vehicles per incident. NHAI's MLFF baseline alone implies **₹1,500 Cr/year of avoidable fuel waste** from toll-induced idling and stop-and-go cycles. **49% of fatal Indian highway crashes are rear-end collisions**, disproportionately clustered in the 2-km approach to toll plazas. The root cause is not the barrier — it is the small population of FASTags that are low-balance, blacklisted, KYC-incomplete, or vehicle-class-mismatched and only discover this *at the lane*.

## Our Solution
A driver-side mobile app that performs a **5km pre-toll readiness check** across **all 30+ issuer banks** — balance, blacklist (NPCI status code 176), KYC tier, and vehicle-class mapping — and resolves issues via UPI Intent recharge or in-app dispute flow before the driver reaches the plaza. The wave never forms. **Differentiator:** every existing alert is single-bank and time-based (Paytm tells Paytm users about Paytm tags). Ours is **location-triggered and cross-bank**, with a concessionaire dashboard that converts driver-side prevention into measurable plaza-side throughput.

## Why Now
**11+ crore active FASTags** and ~98% highway penetration mean the addressable user base is already in place. **NPCI's February 2025 rule (status code 176)** introduced a hard 2× penalty for blacklisted-tag transactions — drivers now have a concrete financial reason to pre-check. **UPI Intent** has collapsed recharge into a one-tap action. The **MLFF transition (2026-2028)** removes the physical barrier and makes real-time readiness the entire user experience — a market category that did not exist 18 months ago.

## Traction
Working prototype: Android app, geofencing engine, FastAPI backend, ML wait-time model trained on synthetic + scraped toll data, and a **Nagel-Schreckenberg physics simulator** that quantifies cascade dynamics under varying readiness rates. **Khalapur Toll pilot proposal** (Mumbai-Pune Expressway) drafted with NHAI-ready outcomes framework. NPCI integration specification complete. Excalidraw demo and live dashboard prepared for stakeholder walkthroughs.

## Business Model
**Free for drivers** — monetised via in-app ads and UPI recharge MDR share with PhonePe / GPay / Paytm. **Fleets:** ₹99/vehicle/month for multi-vehicle ops, compliance reporting, and driver scorecards. **Concessionaires & NHAI:** ₹15-25 lakh/year per plaza for the operator dashboard (throughput analytics, incident replay, lane-balance recommendations). **Year-3 ARR base case: ~₹32 cr** across a 3.5M MAU driver base + 2-3 concessionaire contracts + 1 NHAI pilot conversion (Conservative ₹14 cr / Aggressive ₹72 cr — see *business-model-canvas.md*).

## The Ask
**Operators:** a 90-day pilot at Khalapur Toll at **zero cost to NHAI**, instrumented with pre/post wave-formation metrics, fuel-loss estimates, and lane-throughput deltas. **Investors:** seed round of **~₹3 cr for 18 months** to harden integrations across the top 5 issuer banks, ship the concessionaire dashboard to GA, and reach Series A milestones (250K MAU, 2 signed concessionaires, NHAI MoU).

---

*Repository: github.com/[org]/fastag-chain-reaction  ·  Demo: [url]  ·  Deck: [url]  ·  Pilot proposal: business/nhai-pilot-proposal.md*

# Pilot Proposal: Pre-Toll FASTag Balance Intelligence at Khalapur Toll Plaza

**Submitted to:** National Highways Authority of India (NHAI) and the Concessionaire, Khalapur Toll Plaza, Mumbai-Pune Expressway
**Submitted by:** Team FASTag Chain Reaction
**Document version:** 1.0
**Date:** 2026-05-24

---

## 1. Executive Summary

We respectfully propose a 90-day pilot at Khalapur Toll Plaza on the Mumbai-Pune Expressway to demonstrate a measurable reduction in toll-induced traffic backups caused by FASTag declines. The pilot targets enrollment of 5,000 regular drivers on a lightweight pre-toll balance intelligence application that nudges low-balance users to recharge before they reach the plaza. The primary success metric is the percentage reduction in queue-formation incidents exceeding 50 vehicles, measured via existing CCTV infrastructure against a matched-day baseline. No modification to NHAI or concessionaire toll-lane systems is required, and the entire pilot cost of approximately Rs. 18 lakh is borne by our team. We seek the kind consideration of NHAI and the concessionaire to formalise this engagement through a Memorandum of Understanding within 30 days.

---

## 2. Problem Statement

FASTag has transformed Indian toll operations, with system-wide penetration exceeding 98%. Yet a small fraction of transactions, primarily declines caused by insufficient balance, blacklisted tags, or read failures, continues to produce disproportionate operational damage at high-volume plazas.

From the operator's perspective the costs are concrete:

- **Throughput loss.** A single decline event at a busy lane typically consumes 45 to 90 seconds of manual handling. At Khalapur's peak volumes of 1,500 to 1,800 vehicles per hour per direction, each decline cascades into a queue that can persist for 8 to 12 minutes before clearing.
- **Customer satisfaction.** Concessionaire NPS surveys consistently identify "waiting at toll" as the single largest detractor. The 2024 FICCI Mumbai-Pune commuter survey placed average toll-induced delay perception at 6 to 9 minutes, against actual clean-transaction lane time of under 8 seconds.
- **Emergency vehicle pass-through.** Backed-up plazas degrade ambulance response times. Khalapur sits on a critical Mumbai-Pune medical corridor; even a 4-minute additional delay per emergency vehicle is operationally significant.
- **Manual barrier intervention rate.** Field observations suggest 1.2 to 1.8 percent of all transactions trigger some form of manual intervention. Roughly 60 percent originate from balance or tag-status issues that are, in principle, preventable upstream of the plaza.

The chain-reaction nature of these events is the operational pain: a single declined vehicle produces a wave of stops that propagates kilometres upstream.

---

## 3. Hypothesis

We hypothesise that at 4 percent or greater adoption among drivers approaching the plaza, peak queue length falls measurably. Our agent-based simulation, on a 4-lane single-direction model calibrated to Khalapur peak-hour volumes, indicates a peak queue reduction from approximately 71 vehicles to 7, a tenfold improvement at simulated scale.

In the spirit of intellectual honesty: the simulation is conservative and does not capture every real-world variable, including driver response to nudges, network-effect adoption, and mixed-traffic lane discipline. We therefore expect real-world reduction in the range of 35 to 70 percent for queue events exceeding 50 vehicles, which remains substantial and is the basis of our primary metric.

---

## 4. Pilot Scope

- **Location.** Khalapur Toll Plaza, Mumbai-Pune Expressway, Maharashtra (both directions, all open lanes).
- **Duration.** 90 calendar days from MOU signature, structured as 14 days baseline, 60 days active pilot, 16 days analysis and reporting.
- **Target enrollments.** 5,000 unique driver accounts, weighted towards repeat commuters and commercial fleet drivers on the corridor.
- **Recruitment channels.**
  - On-corridor partnership with the HPCL fuel station located approximately 5 km before Khalapur (south-bound), with similar tie-ups on the north-bound side.
  - Existing Mumbai-Pune Expressway commuter WhatsApp and Telegram groups.
  - Co-marketing with FASTag-issuing banks (ICICI, Axis, HDFC, SBI, Paytm Payments Bank) via SMS and in-app placement, subject to their consent.
  - Limited paid social media in Mumbai, Pune, Lonavala, and Khopoli pin-codes.

---

## 5. Success Metrics

We propose the following SMART metrics, all measurable using either existing concessionaire infrastructure or our own instrumentation.

**Primary metric**
- Percentage reduction in toll-induced backups exceeding 50 vehicles, measured by CCTV-based vehicle count at fixed upstream reference points, compared against a matched-day baseline (same day of week, comparable weather, comparable upstream incident profile).

**Secondary metrics**
- Alert-to-recharge conversion rate of 35 percent or higher among users who receive a low-balance nudge within 10 km of the plaza.
- Day-30 application retention of 40 percent or higher among enrolled users.
- NHAI dashboard data freshness of 5 minutes or better for all aggregated telemetry surfaced to the concessionaire.

**Tertiary metrics**
- Average ambulance pass-through time at the plaza during pilot vs. baseline.
- Driver Net Promoter Score (NPS) among enrolled users.
- Percentage of transactions requiring manual barrier intervention.

---

## 6. Methodology

The pilot is structured in three distinct phases.

**Phase 1: Baseline, days 1 to 14.** Passive observation only. Our team and the concessionaire's existing CCTV operators record queue formation events, durations, and approximate vehicle counts. No app distribution, no nudges. The output is a baseline distribution of queue events against which the pilot phase is measured.

**Phase 2: Active pilot, days 15 to 74.** Application is live. Enrolled users receive geofence-triggered low-balance nudges. Daily monitoring of metrics, weekly written status reports to NHAI and the concessionaire.

**Phase 3: Analysis and reporting, days 75 to 90.** Statistical analysis comparing pilot-phase queue events to baseline, controlling for day-of-week, weather, and known upstream incidents. Submission of final report.

**Control plaza.** To strengthen the analysis we respectfully propose Talegaon Toll Plaza as a control site. Talegaon is comparable in volume profile and vehicle mix, and is not subject to the pilot intervention. We will request only aggregated queue-event data from Talegaon, no individual-vehicle data.

---

## 7. Roles and Responsibilities

**Provided by our team:**
- Consumer Android and iOS application, fully built and tested.
- Backend infrastructure, including geofence service, alerting engine, and the operator-facing dashboard.
- Onboarding collateral, in-language driver training material (Marathi, Hindi, English).
- On-site coordinator presence at the plaza one day per week for the duration of the pilot.
- All hosting, support, and engineering costs.

**Respectfully requested from NHAI and the concessionaire:**
- Read-only access to existing CCTV feeds at the plaza and upstream reference points, for queue counting purposes only.
- Aggregated monthly throughput, transaction-volume, and decline-rate data.
- Cooperation of lane staff in flagging manual interventions during the pilot window via a simple tablet or log sheet.
- Designation of a single point-of-contact at the concessionaire for weekly coordination.
- Designation of an NHAI observer who receives the same weekly status reports.

---

## 8. Technology Integration

The pilot is deliberately designed to require zero modification to NHAI or concessionaire toll-lane systems. We do not connect to the plaza's transaction switches, ANPR cameras, or backend at any point.

- **Balance signal.** We consume NPCI's existing, aggregated balance-availability data on behalf of the user, via standard issuer APIs, with the user's explicit consent.
- **Location signal.** Crowd-sourced GPS telemetry from the consenting user's own device, processed against pre-defined geofences around the plaza.
- **CCTV.** Read-only access to existing feeds, with all processing performed on our infrastructure. No new cameras installed.
- **ANPR data sharing.** Optional, and only if the concessionaire wishes to enrich the analysis. The pilot's success metrics do not depend on ANPR sharing.

All data flows comply with the Digital Personal Data Protection Act, 2023, and our data-handling documentation is available as part of the annexure.

---

## 9. Risk Register

| # | Risk | Likelihood | Mitigation |
|---|------|------------|------------|
| 1 | Adoption falls short of 5,000 enrollments | Medium | Fuel-station co-marketing, bank partnership channels, and a paid social budget held in reserve. Mid-pilot review at day 45 to recalibrate. |
| 2 | NHAI or concessionaire data-sharing concerns | Medium | Pre-pilot MOU with explicit data-handling clauses. DPDP-compliant pipeline. All shared data is aggregated, no individual vehicle records leave the plaza. |
| 3 | Competing concessionaire interests, particularly perceived competition with Rajmargyatra | Medium | Invite the concessionaire and NHAI as first-class users of the operator dashboard. Position the pilot as complementary to Rajmargyatra, not as a substitute. |
| 4 | Confounding events during the pilot window (monsoon flooding, festival traffic, accidents) | High | Statistical controls using matched-day baseline and Talegaon control plaza. Daily incident log to permit exclusion of clearly atypical days from analysis. |
| 5 | Privacy or media controversy around location tracking | Low | Explicit opt-in, plain-language privacy disclosure, no tracking outside the configured geofence corridor, independent legal review prior to launch. |

---

## 10. Cost

- **To NHAI and the concessionaire: Rs. 0.** No capital expenditure, no operating expenditure, no staff secondment.
- **To our team: approximately Rs. 18 lakh,** allocated as follows:
  - Engineering and product (3 months): Rs. 7.5 lakh
  - On-site coordinator and field operations: Rs. 2.5 lakh
  - Dashboard and backend hosting: Rs. 1.5 lakh
  - Driver recruitment and marketing: Rs. 4.5 lakh
  - Reporting, legal, and contingency: Rs. 2.0 lakh

---

## 11. Deliverables

- Weekly written status reports, every Monday, to designated NHAI and concessionaire contacts.
- Mid-pilot review meeting at day 45, in person or virtual.
- Final report at day 90, approximately 30 pages, including raw anonymised data sets and the statistical methodology used.
- Optional public webinar to share findings with the wider expressway-operations community, conducted only with NHAI's and the concessionaire's prior approval.

---

## 12. Decision Timeline

We respectfully request the following timeline, subject to NHAI's and the concessionaire's convenience:

- **Day 0 to 30:** Review of this proposal, clarification meetings, MOU drafting and signature.
- **Day 30 to 44:** Pilot mobilisation, baseline data collection begins on day 30.
- **Day 44 to 104:** Active pilot phase.
- **Day 104 to 120:** Analysis and final report.

---

## 13. Next Steps After a Successful Pilot

Subject to a successful outcome at Khalapur, we propose the following phased expansion, again at our cost and without operational burden on NHAI:

1. **Phase A:** Scale to three additional Maharashtra plazas (proposed: Talegaon, Vadape, Karad), within 6 months of pilot completion.
2. **Phase B:** Scale to ten further plazas across high-volume corridors (Mumbai-Pune, Mumbai-Nashik, Pune-Bengaluru), within 12 months.
3. **Phase C:** National rollout, designed from the outset as a collaboration with NHAI's Rajmargyatra ecosystem rather than as a parallel product. We would welcome a working group with NHAI's digital team to explore deeper integration where it adds value.

---

## 14. Annexure

The following supporting documents are available on request and will accompany the MOU package:

- A1. Product specification and application screenshots.
- A2. Privacy notice and DPDP-compliant data-handling document.
- A3. Agent-based simulation methodology and result set.
- A4. Team profiles and prior work.
- A5. Draft MOU template.
- A6. Sample weekly status report format.
- A7. Indicative dashboard mock-ups for the operator view.

---

We submit this proposal for the kind consideration of NHAI and the Khalapur concessionaire. We are available at the convenience of the reviewing officers for clarifications, a site visit, or a working session at any of NHAI's offices.

Respectfully submitted,
**Team FASTag Chain Reaction**

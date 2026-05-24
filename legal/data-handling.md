# Data Handling Standard — FASTag Chain Reaction (Internal)

**Audience:** Engineering, Security, Legal, Compliance, DevOps
**Status:** Pre-launch draft — gaps flagged at end
**Owner:** [DPO / Security Lead]
**Last reviewed:** [DATE]

This document is the source of truth for how the team processes personal data inside FASTag Chain Reaction. It is written to be audit-ready against the DPDP Act 2023, RBI Master Direction on Card Transactions, and NPCI's FASTag/UPI scheme rules. Treat any deviation as a P1 incident.

## 1. DPDP Act 2023 compliance checklist

- [ ] **Consent Manager integration** — All data collection prompts must route through a DPB-registered Consent Manager once notified. Until notified, use granular in-app consent screens with explicit, separate toggles per data category (GPS, transactions, push, telemetry).
- [ ] **Notice format** — Each consent screen must (a) be available in English plus the user's selected Indian language at minimum: Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, Punjabi; (b) state purpose in itemized form; (c) link to grievance officer.
- [ ] **Significant Data Fiduciary (SDF) thresholds** — We are likely to be designated an SDF given the volume of financial + location data. Pre-designation, voluntarily comply: appoint a Data Protection Officer based in India, conduct annual Data Protection Impact Assessment (DPIA), publish independent audit summary.
- [ ] **Data Protection Officer** — Must be appointed before crossing ~50,000 active users **or** at launch, whichever comes first. Officer must be India-based, report directly to the board, and be publishable in privacy policy.
- [ ] **DPIA** — Required before launch given the combination of continuous location + financial data + scale. Document residual risks and mitigations.
- [ ] **Withdrawal of consent** — Must be technically as easy as giving it. One-tap toggle in Settings, propagated to all downstream systems within 24 hours.
- [ ] **Children's data** — Hard age gate at signup (18+, license verification). No behavioral profiling regardless of age.

## 2. RBI Master Direction — Card Transactions

We do **not** process card payments directly. All recharges flow through UPI. Nonetheless, the following hard rules apply because we touch the rails:

- **Never store** full PAN (16-digit card number), CVV, card expiry, or magnetic stripe data. There is no legitimate reason for any service in our stack to receive these.
- **PIN handling** — UPI PIN must never traverse our app or servers. All PIN entry happens in the user's PSP app via the official UPI intent flow.
- **Tokenization** — Where any card token surfaces (e.g., for future "card-to-FASTag" flows), use only RBI-CoF tokens issued by the card network. No raw PANs in logs, databases, message queues, or analytics events.
- **Audit logging** — Every access to payment-adjacent data must produce a tamper-evident log entry retained for 10 years.

## 3. NPCI / UPI handling

- **UPI VPA storage** — Store as a hashed lookup (SHA-256 with a per-tenant salt) for de-dup; keep the cleartext VPA only in the encrypted user profile column accessible by the payments service alone.
- **Tokenization** — Use NPCI's UPI Lite + token-based recurring flows where available; do not roll our own.
- **NETC FASTag** — Read-only balance lookups via NPCI NETC APIs. Never cache balances longer than 60 seconds in any user-visible surface; never cache them server-side beyond the request lifetime.
- **Recharge intents** — Use the official UPI deep-link / intent SDK. Do not screen-scrape PSP apps.

## 4. Data residency

All of the following must be stored on servers physically located in India and operated by entities registered in India:

- All financial data — transactions, balances, VPAs, recharge records.
- All raw GPS pings and derived location traces.
- All KYC-equivalent data — phone number, vehicle registration, license details.
- All consent records and audit logs.

Disaster recovery replicas must also remain inside India. Cross-border transfers are blocked at the network layer until the central government issues its restricted-country list under DPDP §16; thereafter, transfers are only allowed to countries on the permitted list, with documented contractual safeguards.

## 5. Encryption and key management

- **In transit:** TLS 1.3 only, HSTS preload, certificate pinning in the mobile clients for our own APIs.
- **At rest:** AES-256-GCM for all databases, object stores, and backups.
- **PII envelope encryption:** A dedicated KMS (AWS KMS Mumbai region or equivalent India-based HSM) holds the master key. PII columns (phone, VPA, vehicle reg, location traces) use per-record data keys wrapped by the master key. Rotate master key annually; data keys per write.
- **Separation of duties:** The KMS used for PII must be administratively separate from the KMS used for application secrets. No single engineer holds both sets of credentials.
- **Secrets management:** No secrets in source control. Use Vault or AWS Secrets Manager with short-lived dynamic credentials.

## 6. Logging and observability

- **Never log:** raw GPS coordinates, full phone numbers, full VPAs, transaction reference IDs paired with user IDs, push tokens, OTPs, or any payload that could re-identify a user.
- **Always mask:** phone numbers as `+91-XXXXX-NN89` (last two digits only), VPAs as `xxxx@psp`, vehicle reg as `XX##XX####` with state code preserved for debugging.
- **Structured logging only.** Reject any log line that fails the PII linter in CI.
- **Log retention:** application logs 30 days; security/audit logs 10 years (RBI alignment); access logs 1 year.
- **Access:** logs are read-only to engineers via a break-glass workflow that itself is logged and reviewed weekly by the security lead.

## 7. Breach response

- **Detection-to-triage:** within 1 hour, 24/7 on-call.
- **DPB notification:** within **72 hours** of confirming a breach affecting personal data, per DPDP §8(6). Use the prescribed format once published; until then, use the draft template in `legal/breach-template.md` (to be authored).
- **User notification:** without undue delay if there is a likely risk of harm (financial loss, identity exposure, location exposure). Notify in-app + SMS + email; explain what happened, what data, what we are doing, what they should do.
- **Post-incident review:** blameless post-mortem within 14 days, executive summary published to users for any breach affecting >10,000 accounts.
- **Tabletop drills:** quarterly.

## 8. Vendor / third-party risk

| Vendor | Data shared | Contractual controls |
|--------|-------------|----------------------|
| NPCI NETC | Vehicle reg, tag ID | NPCI scheme rules; mandatory |
| NPCI UPI / PSPs | Payment request payloads (no PIN) | UPI scheme rules + DPA |
| Cloud provider (India region) | All encrypted data | DPA, SOC 2 Type II, ISO 27001, India residency clause, no sub-processing outside India |
| Push provider (FCM / APNS) | Push token + notification body (no PII in body) | Notification bodies must not contain amounts, balances, plaza names, or VPAs |
| Crash reporting (e.g., Sentry self-hosted India) | Stack traces only, PII scrubbed at SDK | Self-host or use India-region tenant; PII scrubbers configured + tested |
| Analytics | Aggregated counters only, no user IDs | Self-host (PostHog or equivalent) in India region |
| NHAI / state authorities | Anonymized telemetry only | MoU specifying anonymization spec (§9) and prohibited re-identification |

All vendors must sign a Data Processing Agreement aligned with DPDP §8 (data fiduciary obligations) before going live.

## 9. Anonymization spec for NHAI telemetry export

The export pipeline runs nightly and produces aggregated traffic intelligence with **zero** user-level fields. Hard requirements:

- **k-anonymity ≥ 50** on every released record: each row must represent at least 50 distinct vehicles in the same (plaza, 15-minute bucket, vehicle-class) cell. Cells below threshold are suppressed.
- **No identifiers:** strip user ID, vehicle reg, phone, device ID, IP, push token, VPA. Use a per-export random salt that is destroyed after the export — no consistent pseudonym across exports.
- **GPS rounding:** coordinates rounded to plaza centroid; no raw lat/lon in the export.
- **Time bucketing:** 15-minute windows minimum; no per-trip records.
- **Differential privacy noise:** add Laplace noise (ε ≤ 1.0 per release) to all counts.
- **Vehicle class only:** car / SUV / LCV / HCV — never specific make-model.
- **Re-identification audit:** quarterly red-team test attempting to re-identify a known test user from released exports. Document and fix any success.
- **Export contract:** every consumer signs an MoU forbidding linking the export to any other dataset.

---

## Top compliance gaps to close before launch

1. **No appointed Data Protection Officer and no DPIA on file.** Both are effectively mandatory given continuous-GPS + financial-data scale. Block launch until DPO is named and DPIA is signed off.
2. **Consent flow is not yet granular per data category, and consent withdrawal does not propagate to backend systems.** Today a user can toggle off GPS in the OS but our servers keep ingesting the last cached pings. Need per-category in-app toggles wired end-to-end with a sub-24-hour propagation SLA, plus Consent Manager hooks ready for the DPB notification.
3. **NHAI telemetry export pipeline lacks k-anonymity enforcement and differential privacy noise.** Current dev build releases plaza-level counts without suppression thresholds — high re-identification risk for low-traffic plazas at night. Implement the §9 spec and run a re-identification red-team before any data leaves our environment.

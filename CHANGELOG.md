# CHANGELOG — Batch-2 Consistency Reconciliation

## Rationale

Batch-1 agents produced a working pitch, deck, simulator, and research dossier, but left three classes of inconsistency between the documents:

1. **Number drift.** The deck and pitch-script asserted "220 vehicles backed up / 14 minutes residual slowdown" as if they were measured facts. The actual `sim/` simulator (Nagel-Schreckenberg, single-lane) outputs `71 vehicles / 3.1 min` — much more conservative. The "220 / 14 min" figures were rhetorical industry-scale numbers with no model behind them as written. A judge running the sim would catch the mismatch in 30 seconds.

2. **Misattributed physics claim.** Multiple docs said or implied that "MIT proved one well-behaved car kills the wave." The research dossier itself flagged this as misattribution: the Sugiyama 2008 paper proved phantom jams form spontaneously; the **Stern 2018** paper proved wave-dampening — but only with an **autonomous/controlled** vehicle, not an alerted human driver. The honest framing is **prevention of the trigger**, not dissipation of an existing wave.

3. **Competitive blind spots.** The research dossier flagged that NHAI's **Rajmargyatra** app already does balance check + recharge in 13 languages, and that **MLFF (Multi-Lane Free Flow)** rolls out nationwide end-2026 — both points the deck and pitch-script ignored entirely.

This batch reconciles all three across every doc without rewriting voice or structure.

### Number policy adopted

- **Primary number (cited as "our sim shows"):** `71 vehicles / 3.1 min`, single-lane Nagel-Schreckenberg result from `sim/simulate.py`.
- **Industry-scale number (cited as "model extrapolation"):** `200+ vehicles / 12-15 min` for a typical 3-lane Indian toll at ~600 vph throughput, always flagged as extrapolation not measurement.
- Both numbers appear together wherever the cascade is quantified, so the chain of reasoning is auditable.

---

## Files modified

### `README.md`
- Replaced the "~220-vehicle / ~14 minutes" claim with the dual-number framing (sim → 71/3.1, extrapolation → 200+/12-15, flagged as model extrapolation).
- Added Rajmargyatra mention in the "existing alert systems" sentence — acknowledges what they do (balance + recharge, 13 languages) and identifies our differentiation (location-based + cross-bank).
- Rewrote the "MIT 2008 ring-road" sentence to (a) clarify Stern 2018 vs Sugiyama 2008, (b) state the prevention-not-dissipation framing explicitly.
- Added a Year-2 MLFF pivot paragraph explaining how the geofence layer carries over when physical plazas disappear end-2026.

### `pitch-script.md`
- HOOK section: added an inline stage note for the speaker about the Rajmargyatra differentiator (cross-bank + location-based readiness) — kept off the spoken track but available if a judge asks during Q&A.
- CASCADE PHYSICS section: replaced the "around 220 vehicles / 14 minutes / MIT ring-road, replicated" line with the dual-number framing (sim → 71/3.1, 3-lane extrapolation → 200+/12-15, flagged as model extrapolation) and the Sugiyama 2008 citation.
- CASCADE PHYSICS closing: replaced "you have to prevent the spark" with the explicit Stern-2018 / prevention-not-dissipation framing.
- OUR SOLUTION section: rewrote the "4% adoption breaks the wave" line as "4% pre-warning prevents wave formation" (prevention framing) and added an inline stage note about the MLFF Year-2 pivot.
- DEMO section: replaced "220 cars stuck. 14 minutes of slowdown" with the dual-number framing matching the sim.
- IMPACT + ASK section: rewrote "cancel a 14-minute traffic wave" to "prevent the stall that triggers a multi-minute traffic wave" (prevention framing, consistent with new policy).

### `judge-qa.md`
- **Q3 (offline fallback)** — UPGRADED from "[WEAK]" to a five-layer answer: cached balance, predictive pre-flight pre-fetch for next 3 plazas on route, USSD `*99#` recharge over GSM voice, SMS-recharge bridge, cash-lane redirect. Removed [WEAK] flag.
- **Q8 (post-Paytm moat)** — UPGRADED from "[WEAK]" with the crowdsourced telemetry flywheel argument: cross-bank aggregation no single-bank player can match + anonymized stall-event telemetry → predictive warnings + flywheel compounding + fleet-side lock-in. Removed [WEAK] flag.
- **Q9 (the 220/14-min number)** — Rewrote to the dual-number policy, citing the sim as the source of the 71/3.1 figure and explicitly labelling the 200+/12-15 figure as a 3-lane extrapolation. Honest about what's measured vs modeled.
- **NEW Q13** — "What happens when MLFF eliminates physical tolls?" — covers the Year-2 pivot: failure modes persist post-MLFF (2x-toll penalties, blacklisting, automated camera flags), geofence layer pivots from "stop before the boom" to "fix before you cross the gantry," and the argument that our value increases under MLFF because there's no visible barrier to warn the driver.
- **NEW Q14** — "How is this different from NHAI's Rajmargyatra app?" — concedes Rajmargyatra is real (13 languages, 1033 helpline, Annual Pass), then enumerates the three differentiators: location-triggered readiness (not balance-on-demand), cross-bank aggregation (not NPCI-centric), four failure modes against that-plaza-specific fee (not just balance).
- **Flagged weak answers section** — updated to note Q3 and Q8 are now upgraded, with brief notes on which beats to lean on if pushed.

### `deck/build_deck.py` (and regenerated `deck/pitch.pptx`)
- **Slide 2 headline** — replaced "One car. 220 vehicles. 14 minutes lost." with "One car. 71 in our sim. 200+ in the real world."
- **Slide 2 body** — rewrote to cite the simulator explicitly and label the 200+ figure as a 3-lane extrapolation.
- **Slide 3 timeline** — final stage updated from "T+5min / 220-car backup / Lane changes spread jam laterally" to "T+3min / 71 cars (sim) / 200+ (3-lane extrap) / Residual slowdown 3-15 min." T+90s queue count adjusted from 60 to ~40 to be physically consistent.
- **Slide 3 quote bar** — replaced "MIT proved phantom traffic jams are real wave physics. We just gave them a fix." with "Sugiyama 2008 proved phantom jams are real wave physics. Stern 2018 showed waves can only be dampened by controlled vehicles — so we prevent the trigger instead." Font size reduced from 15pt to 12pt to fit the longer, more honest text.
- **Slide 4 tagline** — replaced "FASTag is a payment system. We make it a flow system." with "Rajmargyatra does balance + recharge. We add location-based readiness + cross-bank aggregation." This is the explicit Rajmargyatra differentiator, placed in the visual position where judges' eyes naturally land at end-of-slide.
- **Slide 5 WITHOUT card** — replaced "220-car backup · 14-min slowdown" with "71-car queue (sim) · 3.1-min slowdown" plus a subline noting the 3-lane extrapolation.
- **Slide 5 WITH card** — replaced "Wave never forms." with "Trigger prevented. 7 cars / 0 min." (matches sim console output) and rewrote subline to use "prevention" + "below critical density" framing.
- **pitch.pptx regenerated successfully** via `python3 deck/build_deck.py` — file size 39074 bytes, timestamp updated.

### `CHANGELOG.md` (new)
- This file.

---

## Files NOT modified (and why)

- **`research/dossier.md`** — Already correct on all three points. It was the source of the flagged inconsistencies. Left untouched.
- **`sim/README.md`** — Already states the conservative single-lane caveat and the actual 71/3.1 output. No change needed.
- **`sim/simulate.py`** — Not requested, and changing the model parameters to chase the 220-car figure would be intellectually dishonest. The sim is the ground truth; the docs now match it.
- **`app-mockup/`, `diagrams/`** — Not in scope and not flagged by the dossier as having inconsistencies on these three points.

---

## Inconsistencies deliberately NOT fixed

- **Slide-count footer says "Slide N of 6"** even though the script references "Slide 7 — team + contact". This is a pre-existing mismatch from batch-1 — the deck has 6 slides, the script implies 7. Not in scope for this batch and arguably the script should be cut to 6 references, but that's a presenter decision, not a consistency fix.
- **README mentions `research/cascade-physics.md`** (in the old Q9 phrasing — now removed from Q&A) but the file may not exist. The Q9 rewrite no longer references it, so the bad link is no longer in the user-facing flow.
- **`[Team Name]` and `[Hackathon Name]` placeholders** on the title slide and README footer — left as-is, these need a human decision before pitch day, not a doc-consistency fix.
- **Pitch-script word count target (`~450 words`)** — the rewrites added ~40 words to the cascade-physics section. Total runtime impact is ~15 seconds. Left to the presenter to trim in rehearsal rather than artificially compressing the more-honest framing.

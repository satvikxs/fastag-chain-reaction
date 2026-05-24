# FASTag Chain Reaction — 3-Minute Pitch Script

**Target runtime:** 3:00 · **Word count target:** ~450 words · **Pace:** ~150 wpm, conversational

---

## HOOK — 20 seconds

[STAGE DIRECTION: walk to center, look at audience, do not look at slides]

[SLIDE 1 — title slide visible]

"Raise your hand if you've sat in a traffic jam at a toll plaza for no visible reason."

[PAUSE 3 seconds — wait for hands. Most will go up.]

"That jam had a reason. One car, five minutes earlier, had a low FASTag balance. The boom didn't lift. They stopped for ninety seconds. And by the time you reached that plaza, that one car was already gone — but the wave it created was still rolling backward through traffic."

[NOTE: Rajmargyatra, NHAI's official app, already does balance + recharge in 13 languages — what nobody ships is the location-based readiness check across every issuer bank. That's our wedge.]

## PROBLEM — 30 seconds

[SLIDE 2 — photo of typical toll-plaza congestion]

"NHAI says toll plazas cause 12 to 15 percent of all highway congestion in India. We looked at why. Four reasons account for almost all of it: low balance, blacklisted tag, expired KYC, and vehicle-class mismatch. About 30 percent is just low balance — and yes, Paytm and HDFC already send you balance alerts. But those alerts are time-based. They fire on Tuesday at 9 a.m. They don't know you're about to hit a toll plaza in four minutes on a Friday evening."

## CASCADE PHYSICS — 40 seconds

[SLIDE 3 — animated wave diagram, or static if no animation]

"Here's what makes this a chain reaction. Our single-lane Nagel-Schreckenberg simulator — the canonical traffic physics model — shows one 90-second stall queues 71 vehicles and produces 3.1 minutes of residual slowdown, on a conservative single-lane approach. Extrapolated to a typical 3-lane Indian toll plaza running 600 vehicles per hour, the wave-equivalent affects 200-plus vehicles over 12 to 15 minutes — that's the industry-scale number, and we flag it as a model extrapolation, not a measurement. The physics is from Sugiyama 2008, replicated since. The highway keeps pumping cars in at 80 kilometers an hour. The wave propagates backward at walking pace. The math doesn't care that the cause has left."

[PAUSE — let "the cause has left" land]

"So fixing the queue at the plaza is fixing it too late. The Stern 2018 MIT field experiment showed that *one autonomous, controlled* vehicle can dampen an existing wave — but human drivers can't. That's why our model is **prevention of the trigger**, not dissipation. Stop the stall from happening, the wave never forms."

## OUR SOLUTION — 40 seconds

[SLIDE 4 — app mockup screenshot, three states: green, yellow warning, red blocking]

"We built FASTag Chain Reaction. It's a phone app. It knows where every toll plaza in India is — NHAI publishes the coordinates. Five kilometers before you reach one, it checks all four failure modes in parallel. If anything's wrong, it interrupts you loudly. You fix it on the open road, where stopping for 30 seconds at the shoulder costs nobody anything."

"The key number: thin out enough sparks below critical density and the cascade never reaches threshold. Our simulator shows **roughly 4% pre-warning adoption is enough to prevent wave formation** on a single-lane approach. You don't need everyone. You need to remove enough triggers."

[NOTE: MLFF — Multi-Lane Free Flow — goes nationwide end-2026. Physical plazas literally start disappearing. Our Year-2 pivot is the same geofence layer warning drivers before they cross a tolling gantry where post-trip penalties and blacklisting still apply. Same product, different copy.]

## DEMO — 40 seconds

[SLIDE 5 — simulator screen]

[PLAY SIM A — WITHOUT APP]

"This is the same stretch of NH-48, simulated. One car stops at the toll. Watch the wave."

[PAUSE 8 seconds — let the jam form visibly]

"71 cars backed up on a single lane. 3.1 minutes of residual slowdown. Scale that to a 3-lane plaza and you're at 200-plus vehicles, 12-15 minutes — the number every driver in this room has lived."

[PLAY SIM B — WITH APP]

"Same scenario. 4 percent of drivers got the warning at 5K. They pulled over briefly, topped up, kept going. Watch."

[PAUSE 8 seconds — no jam forms]

"No wave. No queue. Same number of cars on the road."

## IMPACT + ASK — 30 seconds

[SLIDE 6 — impact numbers]

"If we hit 4% adoption on the top 50 highway corridors, we estimate we eliminate roughly 30% of toll-induced congestion on those routes. That's measurable in hours of driver time, in fuel, in emissions."

[STAGE DIRECTION: pause, look at judges directly]

"We're not asking you to believe a 10x growth story. We're asking you to believe that a five-kilometer geofence and one push notification can prevent the stall that triggers a multi-minute traffic wave. The physics says yes. The simulator says yes. We'd like to run a pilot."

[SLIDE 7 — team + contact]

"Thank you."

---

**Notes for delivery:**
- The hook depends entirely on the pause after "raise your hand." Do not rush it.
- "The cause has left" is the rhetorical hinge of the whole pitch — emphasize.
- Simulator must be pre-loaded and one-keystroke playable. If it fails, fall back to a screen recording in `deck/sim-fallback.mp4`.
- If you go long, cut the impact-numbers preamble on Slide 6, not the demo.

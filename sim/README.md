# FASTag Chain Reaction — Traffic Simulator

A small Python simulator that shows what happens at an Indian toll plaza when
one car has a low / inactive FASTag balance and has to stop for manual
payment, versus what happens if the driver got a 5 km pre-warning from our
app and recharged in advance.

## The model

[Nagel–Schreckenberg cellular automaton](https://en.wikipedia.org/wiki/Nagel%E2%80%93Schreckenberg_model),
the canonical microscopic traffic model. Each cell is ~7.5 m, each step is
~1 s, max speed 5 cells/step ≈ 135 km/h. 200 vehicles on a single-lane
13.5 km approach road. Random braking probability `p = 0.15`.

Update rule per step, applied to every car in parallel:

1. accelerate (v → min(v+1, vmax))
2. brake to avoid collision (v → min(v, gap))
3. random slowdown with probability `p` (v → max(v-1, 0))
4. advance (x → x + v)

In **Scenario A**, the moment the lead car reaches the toll cell it stops
for 90 seconds (a stuck FASTag forcing manual payment). In **Scenario B**,
4% of approaching drivers were pre-warned by the app and recharged, so
nobody stalls — the toll passes traffic at full free-flow rate.

The "queue" metric counts vehicles within 2 km upstream of the toll that
are crawling (≤ 1 cell/s ≈ 27 km/h). The "residual slowdown" is the
number of minutes the platoon-average speed stays below 60% of free flow.

## Run it

```bash
pip install matplotlib numpy pillow
python3 simulate.py
```

Takes ~30 seconds. Writes three files next to `simulate.py`:

- `scenario_a_no_app.gif` — animation of the chain reaction
- `scenario_b_with_app.gif` — animation with the app deployed
- `comparison.png` — side-by-side queue-length chart for the pitch deck

It also prints a one-line summary to the console, e.g.:

```
Without app: 71 vehicles backed up, 3.1 min residual slowdown.
With app:    7 vehicles backed up, 0.0 min residual slowdown.
```

## Assumptions

- Single lane (worst-case bottleneck — multi-lane tolls have parallel
  channels but the same wave dynamics within each).
- Homogeneous vehicles, identical driver aggressiveness (`p = 0.15`).
- One stalled car triggers the wave; in reality stalls cluster, so this
  is a conservative estimate of the damage from a single FASTag failure.
- The app's only effect is preventing that stall; we don't model lane
  changes, honking, or rubbernecking, which would amplify A further.

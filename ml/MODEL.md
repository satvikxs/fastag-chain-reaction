# Wait Time Prediction Model

The moat for FASTag Chain Reaction is not a flashier app — it is the
**post-toll telemetry layer**. Every time a driver passes through a toll,
the app records dwell time, lane id, fault state, and weather. That stream,
crowdsourced across thousands of users, lets us *predict* wait time and
*route* drivers to the least-jammed lane or toll. This document explains
how the prediction model works, how to swap synthetic data for real
telemetry, and when to graduate beyond a Random Forest.

## What this model does

Given a toll plaza and the current conditions, it predicts `wait_seconds`
for an arriving FASTag vehicle.

### Inputs

| Feature                    | Type        | Notes                                            |
| -------------------------- | ----------- | ------------------------------------------------ |
| `toll_id`                  | categorical | One-hot encoded; 8 plazas in the demo set        |
| `hour_of_day`              | int 0-23    | Captures rush-hour spikes                        |
| `day_of_week`              | int 0-6     | 0 = Mon                                          |
| `is_holiday`               | bool        | Joined from a public holiday calendar            |
| `weather_rain`             | bool        | From a weather API at the toll's lat/lon         |
| `historical_avg_last_24h`  | float       | Rolling mean from our telemetry, per toll        |
| `last_30min_arrival_rate`  | float       | Vehicles/min, computed live from telemetry pings |
| `fastag_lane_count`        | int 2-8     | Static per plaza, from NHAI data                 |
| `last_known_fault`         | bool        | "Is a FASTag reader currently flaky?"            |

### Output
`wait_seconds` — predicted seconds from "vehicle joins queue" to "boom-barrier up".

## Synthetic baseline results

Trained on 40,000 samples, evaluated on 10,000 holdout:

| Metric                | Value         |
| --------------------- | ------------- |
| **MAE**               | **17.36 s**   |
| RMSE                  | 29.98 s       |
| Naive (per-toll mean) | 62.49 s MAE   |
| **Lift vs baseline**  | **+72.2%**    |

Big caveat: these numbers are on **synthetic data with the same generator
biases the model is fitted to**. Real-world MAE will be worse. The point
of these numbers is to show the architecture works end-to-end and that the
chosen features carry signal — not to claim a production accuracy floor.

## Feature importance (which signals matter)

From the trained Random Forest:

1. **`last_30min_arrival_rate` — 0.48**
   The dominant signal. Live queue pressure. This is exactly what
   crowdsourced telemetry buys us — nobody else has it.
2. **`historical_avg_last_24h` — 0.23**
   A toll's recent baseline absorbs latent factors (lane upgrades,
   construction, staffing) we don't measure directly.
3. **`fastag_lane_count` — 0.11**
   Throughput scales sub-linearly with lane count; the model learns the
   diminishing-returns curve.

Honourable mentions: `weather_rain` (0.055), `is_holiday` (0.040),
`toll_id` (0.034 aggregated). `hour_of_day` is lower than you'd expect
because its effect is already absorbed by `last_30min_arrival_rate`.

**Operational implication:** to ship, we need a reliable real-time arrival
rate per plaza. That is the one telemetry stream we cannot afford to lose.

## Going from synthetic to real telemetry

The current generator stands in for what production data looks like. To
swap in real telemetry:

1. **Telemetry schema (already designed in `backend/`):**
   `{ user_id, toll_id, lane_id, ts_join_queue, ts_barrier_up, fault_flag, rain_flag }`
2. **Feature builder cron (5-min cadence):**
   - Aggregate per-toll arrival counts over the last 30 min.
   - Recompute `historical_avg_last_24h` per toll.
   - Join hour/day/holiday from a calendar table.
   - Join `weather_rain` from the Open-Meteo API per toll lat/lon.
3. **Training set:** `(features at time T) -> (actual wait observed at time T)`,
   one row per telemetry record. With 10k DAUs and ~3 toll passes/day,
   that's ~900k rows/month — plenty for RF and enough to start trying GBDT.
4. **Cold-start tolls** (no telemetry yet): fall back to per-toll prior
   from NHAI published throughput numbers. Decay the prior as real
   telemetry arrives.
5. **Privacy:** drop `user_id` after aggregation; we only need counts.

## Retraining cadence

- **Nightly** full retrain on the trailing 90 days of telemetry. Cheap
  with RF (~minutes on a single box for ~1M rows).
- **Hourly** lightweight update: just recompute the rolling features
  (`last_30min_arrival_rate`, `historical_avg_last_24h`). The model
  itself stays fixed; only its inputs are refreshed.
- **Ad-hoc** retrain when a structural change happens at a toll (new
  lanes, FASTag-only conversion, road works). Flag these via the ops
  console so we can invalidate the prior baseline.

## Drift monitoring

Three guards in production:

1. **Prediction-vs-actual MAE per toll, per day.** Alert if any toll's
   MAE deviates >2x from its 30-day median for two consecutive days.
   Common cause: a toll added/removed lanes or installed new readers.
2. **Feature distribution drift (PSI).** Compute Population Stability
   Index on `last_30min_arrival_rate` and `historical_avg_last_24h`
   weekly. PSI > 0.2 → investigate before the model silently degrades.
3. **Fault-flag correlation.** Track the model's residual against
   `last_known_fault`. A growing positive residual means we're
   under-predicting when a reader is faulty — retrain immediately.

Also log the model version with every prediction so we can attribute
regressions cleanly.

## When to graduate from Random Forest

RF is the right call for the hackathon and likely the first ~6 months of
production: it's robust to feature scale, handles mixed types, doesn't
need much tuning, and is interpretable. Move on when:

| Trigger                                                         | Next step                          |
| --------------------------------------------------------------- | ---------------------------------- |
| Telemetry > ~5M rows / month, MAE plateau                        | **XGBoost / LightGBM** — typically 10-20% MAE win on tabular data; native NA handling; faster training. |
| Need calibrated uncertainty (for routing confidence intervals)   | LightGBM with quantile loss → P50 / P90 predictions per toll. |
| Per-lane (not per-plaza) prediction with sequential dependencies | **Temporal model** — a small LSTM or Temporal Fusion Transformer over the last N minutes of per-lane telemetry. Worth the complexity only once we have per-lane RFID timestamps from NHAI. |
| Geo-spatial spill-over between nearby tolls on the same corridor | **GNN over the toll graph** — overkill for now; revisit at 50+ plazas. |
| Multi-step forecasting ("wait time 15 min from now")             | DeepAR / N-BEATS over the arrival-rate time series. |

Order of attack: **RF (now) -> LightGBM with quantile loss -> LSTM per
corridor.** Skip XGBoost vs LightGBM holy wars; LightGBM is faster on
this data shape.

## What we are honestly NOT claiming

- We **cannot** validate accuracy from this hackathon build. Synthetic
  data tells us the pipeline runs end-to-end and that the chosen features
  carry signal in plausible directions. Production accuracy will need
  ~4-6 weeks of real telemetry to establish.
- We are not predicting individual lane choice yet — only plaza-level
  wait time. Per-lane prediction needs per-lane telemetry, which requires
  either NHAI cooperation or our app inferring lane from accelerometer +
  GPS heading (we have a prototype for this in `sim/`).
- We are not modelling cascading effects ("toll A spikes -> toll B floods
  20 min later"). That's the GNN/LSTM phase.

The deliverable today is: **a working prediction service that the routing
engine can call right now, and a clear path to making it accurate once
real telemetry flows.**

## Files

- `wait_time_model.py` — synthetic data + training + evaluation + save.
- `inference.py` — load model, predict 3 demo scenarios, print routing recommendation.
- `wait_time_model.joblib` — trained pipeline (encoder + RF).
- `model_metadata.json` — metrics + feature importance from the last training run.
- `requirements.txt` — `scikit-learn`, `pandas`, `numpy`, `joblib`.

## Demo

```bash
cd ml
pip install -r requirements.txt
python wait_time_model.py   # trains + saves
python inference.py         # 3 example predictions
```

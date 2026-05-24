"""
FASTag Chain Reaction — Wait Time Prediction Model
===================================================

Predicts `wait_seconds` at a toll plaza given current conditions.

This is the moat: with crowdsourced post-toll telemetry, we can predict
which lane/toll will be least jammed and route drivers accordingly.

Pipeline:
    1. Generate 50,000 synthetic samples with realistic distributions
       (rush-hour spikes, weekend lulls, holiday surges, weather effects).
    2. One-hot encode `toll_id`, pass numerical features through.
    3. Train a RandomForestRegressor.
    4. Report MAE / RMSE, feature importance.
    5. Persist the pipeline (encoder + model) with joblib.

Run:
    python wait_time_model.py
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

RANDOM_STATE = 42
N_SAMPLES = 50_000
MODEL_PATH = Path(__file__).parent / "wait_time_model.joblib"
METADATA_PATH = Path(__file__).parent / "model_metadata.json"

# A representative set of toll plazas (NH-48 / NH-19 / NH-44 corridor mix).
TOLL_IDS = [
    "KHE-NH48-01",  # Kherki Daula, Gurgaon
    "MAN-NH48-02",  # Manesar
    "GHA-NH48-03",  # Gharaunda
    "PAN-NH44-04",  # Panipat
    "MUR-NH44-05",  # Murthal
    "AGR-NH19-06",  # Agra-Mathura
    "VAD-NH48-07",  # Vadodara
    "PUN-NH48-08",  # Pune-Mumbai
]

CATEGORICAL_FEATURES = ["toll_id"]
NUMERIC_FEATURES = [
    "hour_of_day",
    "day_of_week",
    "is_holiday",
    "weather_rain",
    "historical_avg_last_24h",
    "last_30min_arrival_rate",
    "fastag_lane_count",
    "last_known_fault",
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES
TARGET = "wait_seconds"


# --------------------------------------------------------------------------
# Synthetic data generator
# --------------------------------------------------------------------------

def generate_synthetic_data(n: int = N_SAMPLES, seed: int = RANDOM_STATE) -> pd.DataFrame:
    """
    Produce realistic synthetic toll-plaza telemetry.

    Latent patterns baked in:
      * Rush-hour spikes (08-10, 18-21).
      * Weekend lulls (Sat/Sun lower base load).
      * Holiday surges (long-weekend evacuation traffic).
      * Rain doubles dwell time and amplifies arrival rate effects.
      * Faulty FASTag readers add ~40s baseline plus a multiplier.
      * Toll-specific base load (Kherki Daula and Pune-Mumbai are notoriously bad).
    """
    rng = np.random.default_rng(seed)

    toll_id = rng.choice(TOLL_IDS, size=n)
    hour_of_day = rng.integers(0, 24, size=n)
    day_of_week = rng.integers(0, 7, size=n)  # 0=Mon, 6=Sun
    is_holiday = rng.choice([0, 1], size=n, p=[0.92, 0.08])
    weather_rain = rng.choice([0, 1], size=n, p=[0.78, 0.22])
    last_known_fault = rng.choice([0, 1], size=n, p=[0.94, 0.06])
    fastag_lane_count = rng.integers(2, 9, size=n)  # 2-8 FASTag lanes per plaza

    # Per-toll base congestion (seconds of dwell).
    toll_base = {
        "KHE-NH48-01": 85,  # Kherki Daula — chronic bottleneck
        "MAN-NH48-02": 45,
        "GHA-NH48-03": 35,
        "PAN-NH44-04": 55,
        "MUR-NH44-05": 40,
        "AGR-NH19-06": 60,
        "VAD-NH48-07": 30,
        "PUN-NH48-08": 90,  # Pune-Mumbai — very heavy commercial traffic
    }
    base = np.array([toll_base[t] for t in toll_id], dtype=float)

    # Rush hour multiplier (08-10 AM and 18-21 PM).
    morning_rush = np.where((hour_of_day >= 8) & (hour_of_day <= 10), 1.0, 0.0)
    evening_rush = np.where((hour_of_day >= 18) & (hour_of_day <= 21), 1.0, 0.0)
    rush_multiplier = 1.0 + 0.85 * morning_rush + 1.05 * evening_rush

    # Weekend lull: Sat (5) and Sun (6) are calmer on commute routes.
    weekend_factor = np.where(day_of_week >= 5, 0.75, 1.0)

    # Holiday surge (exodus traffic, especially evenings).
    holiday_factor = 1.0 + (is_holiday * (0.6 + 0.4 * (hour_of_day >= 16)))

    # Rain effect.
    rain_factor = 1.0 + (weather_rain * 0.55)

    # Faulty lane: adds latency and per-vehicle delay.
    fault_penalty = last_known_fault * 40.0
    fault_multiplier = 1.0 + (last_known_fault * 0.25)

    # Lane count helps (more lanes = less queueing). Diminishing returns.
    lane_factor = 1.0 / np.sqrt(fastag_lane_count / 4.0)

    # Recent arrival rate — vehicles per minute over last 30 minutes.
    # Correlated with rush/weather/holiday so the model can learn it.
    arrival_base = 12 + 18 * (rush_multiplier - 1) + 5 * weather_rain + 8 * is_holiday
    last_30min_arrival_rate = np.clip(
        arrival_base + rng.normal(0, 4, size=n), 1.0, 80.0
    )

    # Historical avg last 24h — noisy but correlated with the toll's true base.
    historical_avg_last_24h = np.clip(
        base * weekend_factor * 1.1 + rng.normal(0, 12, size=n), 8.0, 400.0
    )

    # Final wait time — combine all factors with multiplicative noise.
    arrival_pressure = 1.0 + (last_30min_arrival_rate / 40.0)
    wait_seconds = (
        base
        * rush_multiplier
        * weekend_factor
        * holiday_factor
        * rain_factor
        * fault_multiplier
        * lane_factor
        * arrival_pressure
        + fault_penalty
    )
    # Heteroscedastic noise — larger waits have larger variance.
    wait_seconds = wait_seconds * rng.normal(1.0, 0.12, size=n) + rng.normal(0, 5, size=n)
    wait_seconds = np.clip(wait_seconds, 5.0, 900.0)  # 5s floor, 15min cap

    df = pd.DataFrame(
        {
            "toll_id": toll_id,
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "is_holiday": is_holiday,
            "weather_rain": weather_rain,
            "historical_avg_last_24h": historical_avg_last_24h,
            "last_30min_arrival_rate": last_30min_arrival_rate,
            "fastag_lane_count": fastag_lane_count,
            "last_known_fault": last_known_fault,
            "wait_seconds": wait_seconds,
        }
    )
    return df


# --------------------------------------------------------------------------
# Model
# --------------------------------------------------------------------------

def build_pipeline() -> Pipeline:
    """RandomForest + one-hot for toll_id."""
    # sklearn >=1.2 uses `sparse_output`; older versions used `sparse`.
    try:
        encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:  # pragma: no cover — legacy sklearn
        encoder = OneHotEncoder(handle_unknown="ignore", sparse=False)

    preprocessor = ColumnTransformer(
        transformers=[
            ("toll", encoder, CATEGORICAL_FEATURES),
            ("num", "passthrough", NUMERIC_FEATURES),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=180,
        max_depth=18,
        min_samples_leaf=4,
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )

    return Pipeline(steps=[("preprocess", preprocessor), ("model", model)])


def feature_importance_report(pipeline: Pipeline) -> list[tuple[str, float]]:
    """Aggregate one-hot toll_id importances back into a single `toll_id` score."""
    pre: ColumnTransformer = pipeline.named_steps["preprocess"]
    rf: RandomForestRegressor = pipeline.named_steps["model"]
    importances = rf.feature_importances_

    # Recover feature names from the ColumnTransformer.
    feature_names: list[str] = []
    for name, transformer, cols in pre.transformers_:
        if name == "toll":
            feature_names.extend(transformer.get_feature_names_out(cols).tolist())
        else:
            feature_names.extend(cols)

    # Sum all toll_id one-hot columns into a single bucket.
    grouped: dict[str, float] = {}
    for fname, imp in zip(feature_names, importances):
        key = "toll_id" if fname.startswith("toll_id_") else fname
        grouped[key] = grouped.get(key, 0.0) + float(imp)

    return sorted(grouped.items(), key=lambda kv: kv[1], reverse=True)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main() -> None:
    print("=" * 64)
    print("FASTag Chain Reaction — Wait Time Model Training")
    print("=" * 64)

    print(f"\n[1/4] Generating {N_SAMPLES:,} synthetic samples...")
    df = generate_synthetic_data()
    print(f"      target stats: mean={df[TARGET].mean():.1f}s "
          f"median={df[TARGET].median():.1f}s "
          f"p95={df[TARGET].quantile(0.95):.1f}s "
          f"max={df[TARGET].max():.1f}s")

    X = df[ALL_FEATURES]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE
    )

    print(f"\n[2/4] Training RandomForest on {len(X_train):,} samples...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    print("\n[3/4] Evaluating on holdout set...")
    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    # R^2-ish naive baseline: predict the per-toll mean.
    baseline_pred = X_test["toll_id"].map(
        df.groupby("toll_id")[TARGET].mean().to_dict()
    ).values
    baseline_mae = mean_absolute_error(y_test, baseline_pred)
    lift = (1 - mae / baseline_mae) * 100

    print(f"      MAE              : {mae:6.2f} s")
    print(f"      RMSE             : {rmse:6.2f} s")
    print(f"      Naive-mean MAE   : {baseline_mae:6.2f} s")
    print(f"      Lift vs baseline : {lift:5.1f}%")

    print("\n      Feature importance (aggregated):")
    importance = feature_importance_report(pipeline)
    for name, imp in importance:
        bar = "#" * int(imp * 60)
        print(f"        {name:<28} {imp:6.4f}  {bar}")

    print(f"\n[4/4] Saving model to {MODEL_PATH.name}")
    joblib.dump(pipeline, MODEL_PATH)

    metadata = {
        "n_samples": N_SAMPLES,
        "test_mae_seconds": round(mae, 3),
        "test_rmse_seconds": round(rmse, 3),
        "baseline_mae_seconds": round(baseline_mae, 3),
        "lift_vs_baseline_pct": round(lift, 2),
        "feature_importance": [
            {"feature": n, "importance": round(i, 5)} for n, i in importance
        ],
        "toll_ids": TOLL_IDS,
        "features": ALL_FEATURES,
        "target": TARGET,
        "model": "RandomForestRegressor(n=180, max_depth=18)",
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2))
    print(f"      metadata -> {METADATA_PATH.name}")

    print("\nDone. Run `python inference.py` for the demo.\n")


if __name__ == "__main__":
    main()

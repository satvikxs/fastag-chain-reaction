"""
FASTag Chain Reaction — Wait Time Inference Demo
=================================================

Loads the trained model and predicts wait_seconds for 3 hand-picked scenarios.

Run:
    python inference.py
"""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).parent / "wait_time_model.joblib"


SCENARIOS = [
    {
        "label": "Friday evening rush, raining, Kherki Daula (worst-case)",
        "row": {
            "toll_id": "KHE-NH48-01",
            "hour_of_day": 19,
            "day_of_week": 4,           # Friday
            "is_holiday": 0,
            "weather_rain": 1,
            "historical_avg_last_24h": 130.0,
            "last_30min_arrival_rate": 55.0,
            "fastag_lane_count": 4,
            "last_known_fault": 1,       # one reader down
        },
    },
    {
        "label": "Sunday 6 AM, clear weather, Vadodara (best-case)",
        "row": {
            "toll_id": "VAD-NH48-07",
            "hour_of_day": 6,
            "day_of_week": 6,           # Sunday
            "is_holiday": 0,
            "weather_rain": 0,
            "historical_avg_last_24h": 28.0,
            "last_30min_arrival_rate": 7.0,
            "fastag_lane_count": 6,
            "last_known_fault": 0,
        },
    },
    {
        "label": "Diwali long-weekend exodus, 5 PM, Panipat",
        "row": {
            "toll_id": "PAN-NH44-04",
            "hour_of_day": 17,
            "day_of_week": 5,           # Saturday holiday eve
            "is_holiday": 1,
            "weather_rain": 0,
            "historical_avg_last_24h": 75.0,
            "last_30min_arrival_rate": 38.0,
            "fastag_lane_count": 5,
            "last_known_fault": 0,
        },
    },
]


def fmt_wait(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.0f}s"
    return f"{seconds / 60:.1f}min ({seconds:.0f}s)"


def recommendation(seconds: float) -> str:
    if seconds < 30:
        return "GREEN  — sail through, recommend this lane"
    if seconds < 90:
        return "AMBER  — manageable, no reroute needed"
    if seconds < 180:
        return "ORANGE — consider alternate lane / toll"
    return "RED    — reroute strongly recommended"


def main() -> None:
    if not MODEL_PATH.exists():
        raise SystemExit(
            f"Model not found at {MODEL_PATH}.\n"
            f"Train it first:  python wait_time_model.py"
        )

    pipeline = joblib.load(MODEL_PATH)

    print("=" * 70)
    print("FASTag Chain Reaction — Wait Time Predictions")
    print("=" * 70)

    rows = pd.DataFrame([s["row"] for s in SCENARIOS])
    preds = pipeline.predict(rows)

    for scenario, pred in zip(SCENARIOS, preds):
        print(f"\n  Scenario: {scenario['label']}")
        print(f"  Toll:     {scenario['row']['toll_id']}")
        print(f"  When:     hour={scenario['row']['hour_of_day']:02d}:00  "
              f"dow={scenario['row']['day_of_week']}  "
              f"holiday={scenario['row']['is_holiday']}  "
              f"rain={scenario['row']['weather_rain']}")
        print(f"  Lanes:    {scenario['row']['fastag_lane_count']} FASTag  "
              f"(fault={scenario['row']['last_known_fault']})")
        print(f"  Arrivals: {scenario['row']['last_30min_arrival_rate']:.1f} veh/min "
              f"(24h avg wait = {scenario['row']['historical_avg_last_24h']:.0f}s)")
        print(f"  -> PREDICTED WAIT: {fmt_wait(pred)}")
        print(f"  -> {recommendation(pred)}")

    print("\n" + "=" * 70)
    print("Plug these predictions into the routing engine to pick the")
    print("least-jammed toll along the driver's route in real time.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()

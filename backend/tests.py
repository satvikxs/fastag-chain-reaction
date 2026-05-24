"""
Smoke tests for the FASTag Chain Reaction backend.

Usage:
    1) Start the server in another terminal:   python app.py
    2) Run:                                    python tests.py
"""

import sys
import time

import requests

BASE = "http://127.0.0.1:5050"


def check(name, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    print(f"[{status}] {name}" + (f"  -- {detail}" if detail else ""))
    return cond


def main():
    failures = 0

    # 1. Root
    r = requests.get(f"{BASE}/")
    if not check("GET / responds 200", r.status_code == 200, str(r.status_code)):
        failures += 1

    # 2. location-ping near Khalapur (should fire)
    r = requests.post(f"{BASE}/v1/location-ping", json={
        "user_id": "demo-user", "lat": 18.81, "lon": 73.27,
    })
    body = r.json()
    if not check("location-ping near Khalapur triggers readiness",
                 r.status_code == 200 and body.get("readiness_check_required") is True,
                 str(body)):
        failures += 1

    # 3. location-ping far from any toll (middle of Rajasthan desert-ish)
    r = requests.post(f"{BASE}/v1/location-ping", json={
        "user_id": "demo-user", "lat": 27.0, "lon": 71.0,
    })
    body = r.json()
    if not check("location-ping in middle of nowhere does NOT trigger",
                 r.status_code == 200 and body.get("readiness_check_required") is False,
                 str(body)):
        failures += 1

    # 4. fastag-status known seeded low-balance vehicle
    r = requests.get(f"{BASE}/v1/fastag-status/MH12AB1234")
    body = r.json()
    if not check("fastag-status MH12AB1234 reports low_balance",
                 r.status_code == 200 and "low_balance" in body.get("issues", []),
                 str(body)):
        failures += 1

    # 5. recharge bumps balance
    r = requests.post(f"{BASE}/v1/recharge", json={
        "vehicle_reg": "MH12AB1234", "amount": 500, "upi_handle": "demo@upi",
    })
    body = r.json()
    if not check("recharge succeeds and returns txn_id",
                 r.status_code == 200 and body.get("status") == "success" and body.get("new_balance", 0) > 500,
                 str(body)):
        failures += 1

    # 6. telemetry post + dashboard
    requests.post(f"{BASE}/v1/telemetry", json={
        "toll_id": "MH-KHALAPUR", "wait_seconds": 45, "queue_length": 6,
    })
    requests.post(f"{BASE}/v1/telemetry", json={
        "toll_id": "MH-KHALAPUR", "wait_seconds": 90, "queue_length": 12,
    })
    r = requests.get(f"{BASE}/v1/toll-health")
    body = r.json()
    found = any(t["toll_id"] == "MH-KHALAPUR" and t["samples"] >= 2 for t in body.get("tolls", []))
    if not check("toll-health aggregates Khalapur telemetry",
                 r.status_code == 200 and found,
                 str(body)):
        failures += 1

    # 7. Validation: bad location-ping
    r = requests.post(f"{BASE}/v1/location-ping", json={"user_id": "x"})
    if not check("location-ping with missing fields rejected (400)",
                 r.status_code == 400,
                 str(r.status_code)):
        failures += 1

    if failures:
        print(f"\n{failures} test(s) failed")
        sys.exit(1)
    print("\nAll smoke tests passed")


if __name__ == "__main__":
    main()

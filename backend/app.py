"""
FASTag Chain Reaction - Backend Prototype
Flask app that powers the early-warning toll readiness system.

Run:
    pip install -r requirements.txt
    python app.py

Listens on http://0.0.0.0:5050
"""

import math
import os
import random
import sqlite3
import time
import uuid
from contextlib import contextmanager
from threading import Lock

from flask import Flask, jsonify, request
from flask_cors import CORS


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DB_PATH = os.path.join(os.path.dirname(__file__), "fastag.db")
TRIGGER_RADIUS_KM = 5.0  # readiness check fires inside this radius
PORT = 5050

# In-memory telemetry buffer (resets on restart — fine for hackathon demo)
_telemetry_log = []
_telemetry_lock = Lock()


# ---------------------------------------------------------------------------
# Toll plaza fixtures (realistic Indian toll plazas with approx GPS)
# ---------------------------------------------------------------------------

TOLLS = [
    # Srinagar -> Jammu NH-44 (primary demo corridor)
    {"toll_id": "JK-LAKHANPUR",  "name": "Lakhanpur Toll Plaza",      "highway": "NH-44 Srinagar-Jammu",       "lat": 32.6722, "lon": 75.5500, "state": "Jammu & Kashmir"},
    {"toll_id": "JK-SAROORE",    "name": "Sarore Toll Plaza",         "highway": "NH-44 Srinagar-Jammu",       "lat": 32.4500, "lon": 75.0670, "state": "Jammu & Kashmir"},
    {"toll_id": "JK-BANN",       "name": "Bann Toll Plaza",           "highway": "NH-44 Srinagar-Jammu",       "lat": 32.9244, "lon": 75.1349, "state": "Jammu & Kashmir"},
    {"toll_id": "JK-LOWERMUNDA", "name": "Lower Munda Toll Plaza",    "highway": "NH-44 Qazigund Approach",    "lat": 33.6500, "lon": 75.1500, "state": "Jammu & Kashmir"},
    {"toll_id": "JK-THANDIKHUI", "name": "Thandi Khui Toll Plaza",    "highway": "NH-44 Srinagar-Jammu",       "lat": 32.6300, "lon": 75.5100, "state": "Jammu & Kashmir"},
    # National rollout sample
    {"toll_id": "HR-KHERKI",     "name": "Kherki Daula Toll Plaza",   "highway": "NH-48 Delhi-Gurugram",       "lat": 28.4050, "lon": 76.9760, "state": "Haryana"},
    {"toll_id": "UP-CHHIJARSI",  "name": "Chhijarsi Toll Plaza",      "highway": "NH-9 Delhi-Meerut Expy",     "lat": 28.7250, "lon": 77.5210, "state": "Uttar Pradesh"},
    {"toll_id": "KA-ATTIBELE",   "name": "Attibele Toll Plaza",       "highway": "NH-44 Bangalore-Hosur",      "lat": 12.7920, "lon": 77.7700, "state": "Karnataka"},
    {"toll_id": "TN-PALANCHUR",  "name": "Palanchur Toll Plaza",      "highway": "NH-16 Chennai Bypass",       "lat": 13.0850, "lon": 80.1480, "state": "Tamil Nadu"},
    {"toll_id": "GJ-CHHAYAPURI", "name": "Chhayapuri Toll Plaza",     "highway": "NH-48 Vadodara-Ahmedabad",   "lat": 22.2870, "lon": 73.2120, "state": "Gujarat"},
]


# ---------------------------------------------------------------------------
# Geo helpers
# ---------------------------------------------------------------------------

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def nearest_toll(lat, lon):
    best = None
    for t in TOLLS:
        d = haversine_km(lat, lon, t["lat"], t["lon"])
        if best is None or d < best[1]:
            best = (t, d)
    return best  # (toll_dict, distance_km)


# ---------------------------------------------------------------------------
# SQLite (used for mock FASTag accounts + recharge ledger)
# ---------------------------------------------------------------------------

@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS fastag_accounts (
                vehicle_reg     TEXT PRIMARY KEY,
                balance         REAL NOT NULL,
                blacklisted     INTEGER NOT NULL DEFAULT 0,
                kyc_expired     INTEGER NOT NULL DEFAULT 0,
                class_mismatch  INTEGER NOT NULL DEFAULT 0,
                vehicle_class   TEXT NOT NULL DEFAULT 'Car/Jeep/Van'
            );

            CREATE TABLE IF NOT EXISTS recharges (
                txn_id        TEXT PRIMARY KEY,
                vehicle_reg   TEXT NOT NULL,
                amount        REAL NOT NULL,
                upi_handle    TEXT,
                created_at    INTEGER NOT NULL
            );
            """
        )


def seed_mock_accounts():
    """Seed a handful of demo vehicles so /v1/fastag-status returns interesting data."""
    seed = [
        # reg,           balance, blacklisted, kyc_expired, class_mismatch
        ("JK01AB1234",   12.50,   0, 0, 0),   # low balance — primary demo plate (Srinagar)
        ("JK02XY9999",   850.00,  0, 0, 0),   # healthy (Jammu)
        ("JK03BL4455",   0.00,    1, 0, 0),   # blacklisted
        ("JK20KY8080",   240.00,  0, 1, 0),   # kyc expired (Kathua)
        ("JK21CM7777",   600.00,  0, 0, 1),   # class mismatch (Samba)
        ("JK11UD0001",   45.00,   0, 0, 0),   # borderline low (Udhampur)
    ]
    with db() as conn:
        for reg, bal, bl, kyc, cm in seed:
            conn.execute(
                """
                INSERT OR IGNORE INTO fastag_accounts
                    (vehicle_reg, balance, blacklisted, kyc_expired, class_mismatch)
                VALUES (?, ?, ?, ?, ?)
                """,
                (reg, bal, bl, kyc, cm),
            )


def get_or_create_account(vehicle_reg):
    """Auto-create an account with randomized state for unknown vehicles (demo flavor)."""
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM fastag_accounts WHERE vehicle_reg = ?",
            (vehicle_reg,),
        ).fetchone()
        if row:
            return dict(row)

        # Deterministic-ish random based on reg so the same plate behaves consistently per process
        rng = random.Random(vehicle_reg)
        balance = round(rng.choice([5.0, 22.0, 80.0, 350.0, 720.0, 1200.0]), 2)
        blacklisted = 1 if rng.random() < 0.05 else 0
        kyc_expired = 1 if rng.random() < 0.10 else 0
        class_mismatch = 1 if rng.random() < 0.08 else 0
        conn.execute(
            """
            INSERT INTO fastag_accounts
                (vehicle_reg, balance, blacklisted, kyc_expired, class_mismatch)
            VALUES (?, ?, ?, ?, ?)
            """,
            (vehicle_reg, balance, blacklisted, kyc_expired, class_mismatch),
        )
        return {
            "vehicle_reg": vehicle_reg,
            "balance": balance,
            "blacklisted": blacklisted,
            "kyc_expired": kyc_expired,
            "class_mismatch": class_mismatch,
            "vehicle_class": "Car/Jeep/Van",
        }


# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)


@app.get("/")
def root():
    return jsonify({
        "service": "FASTag Chain Reaction backend",
        "version": "0.1.0",
        "endpoints": [
            "POST /v1/location-ping",
            "GET  /v1/fastag-status/<vehicle_reg>",
            "POST /v1/recharge",
            "POST /v1/telemetry",
            "GET  /v1/toll-health",
            "GET  /v1/tolls",
        ],
    })


@app.get("/v1/tolls")
def list_tolls():
    return jsonify({"count": len(TOLLS), "tolls": TOLLS})


@app.post("/v1/location-ping")
def location_ping():
    """A driver pings their GPS. We tell them if a toll is within trigger radius."""
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id")
    lat = body.get("lat")
    lon = body.get("lon")

    if user_id is None or lat is None or lon is None:
        return jsonify({"error": "user_id, lat, lon are required"}), 400
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return jsonify({"error": "lat and lon must be numeric"}), 400

    toll, distance_km = nearest_toll(lat, lon)
    nearby = distance_km <= TRIGGER_RADIUS_KM
    return jsonify({
        "user_id": user_id,
        "toll_nearby": nearby,
        "toll_id": toll["toll_id"] if nearby else None,
        "toll_name": toll["name"] if nearby else None,
        "highway": toll["highway"] if nearby else None,
        "distance_km": round(distance_km, 3),
        "readiness_check_required": nearby,
        "trigger_radius_km": TRIGGER_RADIUS_KM,
    })


@app.get("/v1/fastag-status/<vehicle_reg>")
def fastag_status(vehicle_reg):
    """Stub of an NPCI/NETC tag status lookup. Mock data per vehicle_reg."""
    vehicle_reg = vehicle_reg.strip().upper()
    if not vehicle_reg:
        return jsonify({"error": "vehicle_reg required"}), 400

    acct = get_or_create_account(vehicle_reg)
    issues = []
    if acct["blacklisted"]:
        issues.append("blacklisted")
    if acct["kyc_expired"]:
        issues.append("kyc_expired")
    if acct["class_mismatch"]:
        issues.append("class_mismatch")
    if acct["balance"] < 100:
        issues.append("low_balance")

    return jsonify({
        "vehicle_reg": vehicle_reg,
        "balance": acct["balance"],
        "blacklisted": bool(acct["blacklisted"]),
        "kyc_expired": bool(acct["kyc_expired"]),
        "class_mismatch": bool(acct["class_mismatch"]),
        "vehicle_class": acct.get("vehicle_class", "Car/Jeep/Van"),
        "issues": issues,
        "ready_for_toll": len(issues) == 0,
    })


@app.post("/v1/recharge")
def recharge():
    """Mock UPI-driven recharge. Always 'succeeds' for hackathon demo."""
    body = request.get_json(silent=True) or {}
    vehicle_reg = (body.get("vehicle_reg") or "").strip().upper()
    amount = body.get("amount")
    upi_handle = body.get("upi_handle")

    if not vehicle_reg or amount is None:
        return jsonify({"error": "vehicle_reg and amount are required"}), 400
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be numeric"}), 400
    if amount <= 0:
        return jsonify({"error": "amount must be > 0"}), 400

    acct = get_or_create_account(vehicle_reg)
    new_balance = round(acct["balance"] + amount, 2)
    txn_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

    with db() as conn:
        conn.execute(
            "UPDATE fastag_accounts SET balance = ? WHERE vehicle_reg = ?",
            (new_balance, vehicle_reg),
        )
        conn.execute(
            """
            INSERT INTO recharges (txn_id, vehicle_reg, amount, upi_handle, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (txn_id, vehicle_reg, amount, upi_handle, int(time.time())),
        )

    return jsonify({
        "txn_id": txn_id,
        "status": "success",
        "vehicle_reg": vehicle_reg,
        "amount": amount,
        "new_balance": new_balance,
        "upi_handle": upi_handle,
    })


@app.post("/v1/telemetry")
def telemetry():
    """Drivers/app push toll-lane telemetry for the dashboard."""
    body = request.get_json(silent=True) or {}
    toll_id = body.get("toll_id")
    wait_seconds = body.get("wait_seconds")
    queue_length = body.get("queue_length")

    if toll_id is None or wait_seconds is None or queue_length is None:
        return jsonify({"error": "toll_id, wait_seconds, queue_length required"}), 400
    try:
        wait_seconds = float(wait_seconds)
        queue_length = int(queue_length)
    except (TypeError, ValueError):
        return jsonify({"error": "wait_seconds numeric, queue_length integer"}), 400

    entry = {
        "toll_id": toll_id,
        "wait_seconds": wait_seconds,
        "queue_length": queue_length,
        "ts": int(time.time()),
    }
    with _telemetry_lock:
        _telemetry_log.append(entry)
        # keep memory bounded
        if len(_telemetry_log) > 5000:
            del _telemetry_log[:1000]

    return jsonify({"ok": True, "recorded": entry})


@app.get("/v1/toll-health")
def toll_health():
    """Aggregate telemetry per toll: avg wait, max queue, samples, last_seen."""
    with _telemetry_lock:
        snapshot = list(_telemetry_log)

    agg = {}
    for e in snapshot:
        a = agg.setdefault(e["toll_id"], {
            "toll_id": e["toll_id"],
            "samples": 0,
            "wait_sum": 0.0,
            "queue_max": 0,
            "last_seen": 0,
        })
        a["samples"] += 1
        a["wait_sum"] += e["wait_seconds"]
        a["queue_max"] = max(a["queue_max"], e["queue_length"])
        a["last_seen"] = max(a["last_seen"], e["ts"])

    toll_lookup = {t["toll_id"]: t for t in TOLLS}
    out = []
    for toll_id, a in agg.items():
        meta = toll_lookup.get(toll_id, {})
        avg_wait = a["wait_sum"] / a["samples"] if a["samples"] else 0
        # naive health label
        if avg_wait < 60 and a["queue_max"] < 10:
            health = "green"
        elif avg_wait < 180 and a["queue_max"] < 25:
            health = "amber"
        else:
            health = "red"
        out.append({
            "toll_id": toll_id,
            "toll_name": meta.get("name"),
            "highway": meta.get("highway"),
            "samples": a["samples"],
            "avg_wait_seconds": round(avg_wait, 1),
            "max_queue_length": a["queue_max"],
            "last_seen": a["last_seen"],
            "health": health,
        })

    out.sort(key=lambda x: x["toll_id"])
    return jsonify({"count": len(out), "tolls": out})


# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

def bootstrap():
    init_db()
    seed_mock_accounts()


bootstrap()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)

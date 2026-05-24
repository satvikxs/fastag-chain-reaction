# FASTag Chain Reaction — Backend Prototype

Flask backend that powers the early-warning toll readiness app.
Single file, SQLite via stdlib, in-memory telemetry. Hackathon-grade.

## Run

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Listens on **http://0.0.0.0:5050** (no auth).

Smoke tests (in another shell):

```bash
python tests.py
```

## Mock Tolls

Ten realistic plazas seeded with GPS, e.g. Khalapur, Talegaon, Vadape,
Pimpalgaon (Nashik), Dharuhera, Kherki Daula, Chhijarsi (Delhi-Meerut),
Attibele, Palanchur, Chhayapuri. List them with:

```bash
curl -s http://localhost:5050/v1/tolls | jq
```

Seeded demo vehicle regs:
`MH12AB1234` (low balance), `MH14XY9999` (healthy),
`DL3CAB4455` (blacklisted), `HR26DK8080` (kyc expired),
`KA01MJ7777` (class mismatch), `TN10AB0001` (borderline).

Unknown plates are auto-generated with deterministic randomness.

## Endpoints — curl demo

### 1. Location ping (driver moving toward Khalapur)
```bash
curl -s -X POST http://localhost:5050/v1/location-ping \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"driver-001","lat":18.81,"lon":73.27}' | jq
```
Expect `readiness_check_required: true` because driver is within 5 km of Khalapur.

### 2. FASTag status (low balance demo vehicle)
```bash
curl -s http://localhost:5050/v1/fastag-status/MH12AB1234 | jq
```
Returns balance + blacklisted/kyc/class flags + `issues` array + `ready_for_toll`.

### 3. Recharge via UPI
```bash
curl -s -X POST http://localhost:5050/v1/recharge \
  -H 'Content-Type: application/json' \
  -d '{"vehicle_reg":"MH12AB1234","amount":500,"upi_handle":"driver@upi"}' | jq
```
Returns `txn_id`, `status: success`, `new_balance`.

### 4. Telemetry (driver/app reports lane state)
```bash
curl -s -X POST http://localhost:5050/v1/telemetry \
  -H 'Content-Type: application/json' \
  -d '{"toll_id":"MH-KHALAPUR","wait_seconds":120,"queue_length":18}' | jq
```

### 5. Toll health dashboard (aggregated telemetry)
```bash
curl -s http://localhost:5050/v1/toll-health | jq
```
Returns avg wait, max queue, sample count, last_seen, and a green/amber/red
health label per toll.

### 6. List all known tolls
```bash
curl -s http://localhost:5050/v1/tolls | jq
```

## Files

- `app.py` — Flask app, all routes, SQLite bootstrap, mock data.
- `tests.py` — smoke tests using `requests`.
- `requirements.txt` — Flask, Flask-Cors, requests.
- `fastag.db` — created at first launch (gitignore if you wish).

## Notes

- Trigger radius is 5 km (configurable: `TRIGGER_RADIUS_KM` in `app.py`).
- Telemetry is in-memory; restart wipes the dashboard data — fine for demo.
- CORS is open so the React/Next.js app mockup can hit this directly.

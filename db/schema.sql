-- =====================================================================
-- FASTag Chain Reaction — Production PostgreSQL Schema
-- Target: PostgreSQL 15+ (PostGIS 3.x optional)
-- =====================================================================
-- Conventions:
--   * snake_case for all identifiers
--   * UUID primary keys where rows may be referenced externally
--   * BIGSERIAL for high-volume append-only event tables
--   * TIMESTAMPTZ everywhere (store UTC, render in app)
--   * Money in paise (BIGINT) — never FLOAT for currency
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid(), digest()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- fuzzy plaza name search

-- Optional but recommended for spatial queries.
-- Comment out if your managed Postgres does not support PostGIS.
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------
CREATE TYPE vehicle_class_enum AS ENUM (
    'car_jeep_van',      -- Class 4
    'lcv',               -- Light Commercial Vehicle
    'bus_truck_2axle',
    'truck_3axle',
    'hcm_eme_4to6axle',
    'oversized_7plus',
    'two_wheeler'        -- non-FASTag but supported for ETC pilots
);

CREATE TYPE fastag_issuer_enum AS ENUM (
    'paytm', 'icici', 'hdfc', 'sbi', 'axis', 'idfc',
    'kotak', 'yes_bank', 'bob', 'au_bank', 'airtel', 'other'
);

CREATE TYPE txn_status_enum AS ENUM (
    'initiated', 'pending', 'success', 'failed', 'refunded', 'timeout'
);

CREATE TYPE alert_action_enum AS ENUM (
    'ignored', 'recharged', 'already_ok', 'dismissed', 'snoozed'
);

CREATE TYPE stop_reason_enum AS ENUM (
    'normal_pass', 'low_balance', 'blacklist', 'tag_read_fail',
    'kyc_issue', 'manual_payment', 'queue', 'other'
);

CREATE TYPE language_enum AS ENUM (
    'en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'or', 'as'
);

-- =====================================================================
-- 1. USERS
-- =====================================================================
CREATE TABLE users (
    user_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_hash       BYTEA NOT NULL UNIQUE,           -- SHA-256(phone + pepper)
    phone_e164_enc   BYTEA,                           -- AES-GCM encrypted phone (for SMS sends)
    name             TEXT NOT NULL,
    language_pref    language_enum NOT NULL DEFAULT 'en',
    push_token       TEXT,                            -- FCM/APNs token (rotates often)
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at     TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_users_last_seen ON users(last_seen_at DESC) WHERE is_active;

-- =====================================================================
-- 2. VEHICLES
-- =====================================================================
CREATE TABLE vehicles (
    vehicle_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    registration_no   TEXT NOT NULL,                  -- e.g. "MH12AB1234"
    registration_hash BYTEA NOT NULL,                 -- SHA-256 for dedupe/lookup
    vehicle_class     vehicle_class_enum NOT NULL DEFAULT 'car_jeep_van',
    fastag_issuer     fastag_issuer_enum,
    fastag_serial_enc BYTEA,                          -- encrypted FASTag serial if scraped
    nickname          TEXT,                           -- "My i20", "Office truck"
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ,                    -- soft delete

    CONSTRAINT chk_reg_format CHECK (registration_no ~ '^[A-Z0-9]{4,15}$')
);

CREATE UNIQUE INDEX idx_vehicles_user_reg
    ON vehicles(user_id, registration_hash)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_user ON vehicles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_reg_hash ON vehicles(registration_hash);

-- =====================================================================
-- 3. TOLL_PLAZAS
-- =====================================================================
CREATE TABLE toll_plazas (
    toll_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    highway        TEXT NOT NULL,                    -- "NH-48", "Mumbai-Pune Expressway"
    state          TEXT NOT NULL,                    -- ISO 3166-2:IN code preferred
    lat            DOUBLE PRECISION NOT NULL,
    lon            DOUBLE PRECISION NOT NULL,
    fastag_lanes   SMALLINT NOT NULL DEFAULT 2,
    total_lanes    SMALLINT,
    geohash_8      CHAR(8) NOT NULL,                 -- ~38m precision
    operator       TEXT,                             -- "NHAI", "IRB", "Adani Roads", ...
    direction      TEXT,                             -- "N-S", "Both"
    plaza_code     TEXT UNIQUE,                      -- NHAI plaza ID where available
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- geom GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS
    --     (ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography) STORED,

    CONSTRAINT chk_lat CHECK (lat BETWEEN -90 AND 90),
    CONSTRAINT chk_lon CHECK (lon BETWEEN -180 AND 180)
);

-- Geohash prefix index — supports proximity scans cheaply without PostGIS
CREATE INDEX idx_toll_geohash8     ON toll_plazas(geohash_8);
CREATE INDEX idx_toll_geohash6     ON toll_plazas(substr(geohash_8, 1, 6));
CREATE INDEX idx_toll_geohash5     ON toll_plazas(substr(geohash_8, 1, 5));
CREATE INDEX idx_toll_state_active ON toll_plazas(state) WHERE is_active;
CREATE INDEX idx_toll_name_trgm    ON toll_plazas USING gin (name gin_trgm_ops);

-- Optional PostGIS spatial index (only if extension enabled above)
-- CREATE INDEX idx_toll_geom_gist ON toll_plazas USING GIST (geom);

-- =====================================================================
-- 4. FASTAG_STATUS_CACHE  (short TTL: 5–15 min)
-- =====================================================================
CREATE TABLE fastag_status_cache (
    vehicle_id       UUID PRIMARY KEY REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    balance_paise    BIGINT NOT NULL DEFAULT 0,
    blacklisted      BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_expired      BOOLEAN NOT NULL DEFAULT FALSE,
    issuer_status    TEXT,                           -- raw status code from NPCI/issuer
    last_checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ttl_expires_at   TIMESTAMPTZ NOT NULL,
    source           TEXT NOT NULL DEFAULT 'npci',   -- 'npci', 'issuer_api', 'user_reported'

    CONSTRAINT chk_balance_nonneg CHECK (balance_paise >= 0)
);

CREATE INDEX idx_cache_ttl ON fastag_status_cache(ttl_expires_at);
-- vehicle_id lookup is already O(1) via PK

-- =====================================================================
-- 5. GEOFENCE_EVENTS  (high-volume; partitioned by month)
-- =====================================================================
CREATE TABLE geofence_events (
    event_id          BIGSERIAL,
    user_id           UUID NOT NULL,
    vehicle_id        UUID NOT NULL,
    toll_id           UUID NOT NULL,
    distance_km       NUMERIC(5,2) NOT NULL,        -- distance at trigger time
    fired_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_at_fire   JSONB,                          -- snapshot of cache row at fire moment
    speed_kmph        SMALLINT,
    heading_deg       SMALLINT,
    eta_seconds       INT,                           -- predicted seconds-to-plaza
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (event_id, fired_at)
) PARTITION BY RANGE (fired_at);

-- Initial partitions; create automation should roll these monthly.
CREATE TABLE geofence_events_2026_05 PARTITION OF geofence_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE geofence_events_2026_06 PARTITION OF geofence_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE geofence_events_default PARTITION OF geofence_events DEFAULT;

CREATE INDEX idx_geofence_user_fired  ON geofence_events(user_id, fired_at DESC);
CREATE INDEX idx_geofence_toll_fired  ON geofence_events(toll_id, fired_at DESC);
CREATE INDEX idx_geofence_vehicle     ON geofence_events(vehicle_id, fired_at DESC);

-- =====================================================================
-- 6. RECHARGE_TXNS
-- =====================================================================
CREATE TABLE recharge_txns (
    txn_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    event_id        BIGINT,                         -- linking geofence event that triggered this
    event_fired_at  TIMESTAMPTZ,                    -- partition routing column (see FK note)
    amount_paise    BIGINT NOT NULL,
    upi_handle      TEXT,                           -- e.g. "user@oksbi"
    npci_ref        TEXT UNIQUE,                    -- NPCI RRN / order ref
    issuer_ref      TEXT,                           -- bank/issuer order ID
    status          txn_status_enum NOT NULL DEFAULT 'initiated',
    failure_reason  TEXT,
    initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,

    CONSTRAINT chk_amount_positive CHECK (amount_paise > 0),
    CONSTRAINT chk_amount_sane     CHECK (amount_paise <= 50000000) -- ≤ ₹5,00,000
);
-- NOTE: We cannot FK into a partitioned parent without including the partition key,
-- so event_id is kept as a soft reference. Validate in app layer.

CREATE INDEX idx_recharge_user_time    ON recharge_txns(user_id, initiated_at DESC);
CREATE INDEX idx_recharge_vehicle_time ON recharge_txns(vehicle_id, initiated_at DESC);
CREATE INDEX idx_recharge_status       ON recharge_txns(status) WHERE status IN ('initiated','pending');
CREATE INDEX idx_recharge_event        ON recharge_txns(event_id) WHERE event_id IS NOT NULL;

-- =====================================================================
-- 7. TOLL_TELEMETRY  (crowdsourced; very high volume; partitioned)
-- =====================================================================
CREATE TABLE toll_telemetry (
    telemetry_id   BIGSERIAL,
    toll_id        UUID NOT NULL,
    vehicle_id     UUID NOT NULL,
    arrived_at     TIMESTAMPTZ NOT NULL,
    departed_at    TIMESTAMPTZ,
    wait_seconds   INT,
    lane_used      SMALLINT,
    stop_reason    stop_reason_enum NOT NULL DEFAULT 'normal_pass',
    queue_length   SMALLINT,
    user_reported  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (telemetry_id, arrived_at),
    CONSTRAINT chk_wait_nonneg CHECK (wait_seconds IS NULL OR wait_seconds >= 0)
) PARTITION BY RANGE (arrived_at);

CREATE TABLE toll_telemetry_2026_05 PARTITION OF toll_telemetry
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE toll_telemetry_2026_06 PARTITION OF toll_telemetry
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE toll_telemetry_default PARTITION OF toll_telemetry DEFAULT;

-- Primary query pattern: jam at plaza X in last N minutes
CREATE INDEX idx_telemetry_toll_arrived ON toll_telemetry(toll_id, arrived_at DESC);
CREATE INDEX idx_telemetry_vehicle      ON toll_telemetry(vehicle_id, arrived_at DESC);
CREATE INDEX idx_telemetry_stop_reason  ON toll_telemetry(stop_reason, arrived_at DESC)
    WHERE stop_reason <> 'normal_pass';

-- =====================================================================
-- 8. ALERT_OUTCOMES  (funnel analysis)
-- =====================================================================
CREATE TABLE alert_outcomes (
    outcome_id      BIGSERIAL PRIMARY KEY,
    event_id        BIGINT NOT NULL,                -- soft FK to geofence_events
    event_fired_at  TIMESTAMPTZ NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    action_taken    alert_action_enum NOT NULL,
    recharge_txn_id UUID REFERENCES recharge_txns(txn_id) ON DELETE SET NULL,
    outcome_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latency_seconds INT,                            -- fire → outcome
    client_meta     JSONB                           -- app version, network type, etc.
);

CREATE UNIQUE INDEX idx_outcome_event_unique
    ON alert_outcomes(event_id, event_fired_at);
CREATE INDEX idx_outcome_user_time   ON alert_outcomes(user_id, outcome_at DESC);
CREATE INDEX idx_outcome_action      ON alert_outcomes(action_taken, outcome_at DESC);

-- =====================================================================
-- TRIGGERS — updated_at maintenance
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_toll_plazas_updated
    BEFORE UPDATE ON toll_plazas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- VIEWS
-- =====================================================================

-- v_active_alerts: geofence fires in last 30 min with no outcome yet
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT
    ge.event_id,
    ge.fired_at,
    ge.user_id,
    ge.vehicle_id,
    ge.toll_id,
    tp.name        AS plaza_name,
    tp.highway,
    ge.distance_km,
    ge.eta_seconds,
    ge.status_at_fire,
    v.registration_no,
    v.nickname
FROM geofence_events ge
JOIN toll_plazas tp ON tp.toll_id = ge.toll_id
JOIN vehicles v     ON v.vehicle_id = ge.vehicle_id
LEFT JOIN alert_outcomes ao
       ON ao.event_id = ge.event_id
      AND ao.event_fired_at = ge.fired_at
WHERE ge.fired_at > NOW() - INTERVAL '30 minutes'
  AND ao.outcome_id IS NULL;

-- v_toll_health_24h: per-plaza pass-through health in the last 24h
CREATE OR REPLACE VIEW v_toll_health_24h AS
SELECT
    tp.toll_id,
    tp.name,
    tp.highway,
    tp.state,
    COUNT(*)                                            AS passes,
    COUNT(*) FILTER (WHERE tt.stop_reason <> 'normal_pass') AS abnormal_passes,
    ROUND(AVG(tt.wait_seconds)::numeric, 1)             AS avg_wait_seconds,
    ROUND((PERCENTILE_CONT(0.95)
        WITHIN GROUP (ORDER BY tt.wait_seconds))::numeric, 1) AS p95_wait_seconds,
    COUNT(*) FILTER (WHERE tt.stop_reason = 'low_balance')   AS low_balance_stops,
    COUNT(*) FILTER (WHERE tt.stop_reason = 'tag_read_fail') AS tag_read_failures
FROM toll_telemetry tt
JOIN toll_plazas tp ON tp.toll_id = tt.toll_id
WHERE tt.arrived_at > NOW() - INTERVAL '24 hours'
GROUP BY tp.toll_id, tp.name, tp.highway, tp.state;

-- v_user_savings: alerts that became successful recharges = saved a stop
CREATE OR REPLACE VIEW v_user_savings AS
SELECT
    u.user_id,
    u.name,
    COUNT(DISTINCT ao.event_id) FILTER (WHERE ao.action_taken = 'recharged')
                                                  AS stops_prevented,
    COUNT(DISTINCT ao.event_id)                    AS total_alerts,
    COALESCE(SUM(rt.amount_paise) FILTER
        (WHERE rt.status = 'success'), 0) / 100.0  AS total_recharged_inr,
    -- Estimated saving: ₹100 per prevented stop (calibrate later)
    COUNT(DISTINCT ao.event_id) FILTER
        (WHERE ao.action_taken = 'recharged') * 100 AS estimated_saving_inr
FROM users u
LEFT JOIN alert_outcomes ao  ON ao.user_id = u.user_id
LEFT JOIN recharge_txns rt   ON rt.txn_id  = ao.recharge_txn_id
GROUP BY u.user_id, u.name;

-- =====================================================================
-- SAMPLE DATA — 10 toll plazas (real Indian locations)
-- =====================================================================
INSERT INTO toll_plazas (name, highway, state, lat, lon, fastag_lanes, total_lanes, geohash_8, operator, plaza_code) VALUES
    ('Khalapur Toll Plaza',         'Mumbai-Pune Expressway', 'MH', 18.7780, 73.2950, 10, 14, 'te7m9xqz', 'MSRDC',          'MH-MPEW-01'),
    ('Kherki Daula Toll Plaza',     'NH-48',                  'HR', 28.4089, 76.9776, 12, 16, 'tuvz8vh2', 'Skylark',        'HR-NH48-03'),
    ('Manesar Toll Plaza',          'NH-48',                  'HR', 28.3585, 76.9229, 8,  12, 'tuvz4cz8', 'NHAI',           'HR-NH48-04'),
    ('Vadodara Halol Toll',         'NH-47',                  'GJ', 22.3072, 73.1812, 6,  10, 'te6tt2bd', 'IRB',            'GJ-NH47-02'),
    ('Krishnagiri Toll Plaza',      'NH-44',                  'TN', 12.5266, 78.2150, 8,  12, 'tdrwznmc', 'L&T',            'TN-NH44-07'),
    ('Devanahalli Toll',            'NH-44',                  'KA', 13.2492, 77.7128, 6,   8, 'tdt0fjp5', 'NHAI',           'KA-NH44-01'),
    ('Sanjan Toll Plaza',           'NH-48',                  'GJ', 20.2050, 72.8500, 8,  12, 'te5d2x6w', 'Adani Roads',    'GJ-NH48-09'),
    ('Sarai Toll Plaza',            'Yamuna Expressway',      'UP', 28.0780, 77.6650, 10, 14, 'tuxh43r1', 'JIL',            'UP-YEW-02'),
    ('Charoti Toll Plaza',          'NH-48',                  'MH', 20.0050, 72.9080, 8,  12, 'te5fmd7k', 'IRB',            'MH-NH48-11'),
    ('Palasdari Toll Plaza',        'NH-48',                  'MH', 18.7920, 73.3340, 6,  10, 'te7m9zqf', 'MSRDC',          'MH-NH48-13');

-- =====================================================================
-- SAMPLE DATA — 5 users + 5 vehicles
-- =====================================================================
INSERT INTO users (user_id, phone_hash, name, language_pref) VALUES
    ('11111111-1111-1111-1111-111111111111', digest('+919876543201', 'sha256'), 'Aarav Kumar',    'hi'),
    ('22222222-2222-2222-2222-222222222222', digest('+919876543202', 'sha256'), 'Priya Sharma',   'en'),
    ('33333333-3333-3333-3333-333333333333', digest('+919876543203', 'sha256'), 'Ravi Iyer',      'ta'),
    ('44444444-4444-4444-4444-444444444444', digest('+919876543204', 'sha256'), 'Neha Patel',     'gu'),
    ('55555555-5555-5555-5555-555555555555', digest('+919876543205', 'sha256'), 'Suresh Reddy',   'te');

INSERT INTO vehicles (user_id, registration_no, registration_hash, vehicle_class, fastag_issuer, nickname) VALUES
    ('11111111-1111-1111-1111-111111111111', 'MH12AB1234', digest('MH12AB1234','sha256'), 'car_jeep_van',     'paytm', 'Daily driver'),
    ('22222222-2222-2222-2222-222222222222', 'DL3CAY9999', digest('DL3CAY9999','sha256'), 'car_jeep_van',     'icici', 'Innova'),
    ('33333333-3333-3333-3333-333333333333', 'TN10BK5678', digest('TN10BK5678','sha256'), 'lcv',              'hdfc',  'Delivery van'),
    ('44444444-4444-4444-4444-444444444444', 'GJ01HP2345', digest('GJ01HP2345','sha256'), 'car_jeep_van',     'sbi',   'Family car'),
    ('55555555-5555-5555-5555-555555555555', 'TS07UB7890', digest('TS07UB7890','sha256'), 'bus_truck_2axle',  'axis',  'Office bus');

-- =====================================================================
-- ANALYZE for freshly loaded tables
-- =====================================================================
ANALYZE users, vehicles, toll_plazas;

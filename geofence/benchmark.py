"""
Benchmark: naive O(N) Haversine scan vs geohash + Haversine.

Setup:
    * 30 real-ish Indian toll seed points, jittered & duplicated up to 1,200.
    * 100,000 random GPS pings drawn from a box covering mainland India.
    * 5 km query radius (FASTag use-case).

Run:
    pip install numpy
    python benchmark.py
"""

from __future__ import annotations

import random
import time

import numpy as np

from geofence import (
    GeofenceIndex,
    Toll,
    haversine_km,
    naive_any_within,
)

# ---------------------------------------------------------------------------
# 30 inline toll seed rows (name, lat, lon)
# Real-world Indian highway tolls -- mixed across NH-1/NH-44/NH-48/NH-16 etc.
# ---------------------------------------------------------------------------
SEED_TOLLS: list[tuple[str, float, float]] = [
    ("Karnal Toll Plaza",          29.6857, 76.9905),
    ("Panipat Toll Plaza",         29.3909, 76.9635),
    ("Ghaziabad-Meerut Toll",      28.7570, 77.5800),
    ("Kherki Daula Toll",          28.4089, 76.9700),
    ("Manesar Toll",               28.3540, 76.9220),
    ("Shahjahanpur Toll (NH-48)",  27.7510, 76.4660),
    ("Behror Toll",                27.8800, 76.2840),
    ("Jaipur Ring Road Toll",      26.8000, 75.8000),
    ("Ajmer Toll",                 26.4499, 74.6399),
    ("Kishangarh Toll",            26.5800, 74.8600),
    ("Vadodara-Bharuch Toll",      21.9100, 73.0500),
    ("Vapi Toll",                  20.3700, 72.9100),
    ("Charoti Toll (Mumbai-Ahd)",  20.1800, 72.9500),
    ("Khalapur Toll (Mum-Pune)",   18.8000, 73.2700),
    ("Talegaon Toll",              18.7340, 73.6790),
    ("Kagal Toll",                 16.5800, 74.3000),
    ("Belgaum Toll",               15.8500, 74.5000),
    ("Tumkur Toll (NH-48)",        13.3400, 77.1010),
    ("Hosur Toll",                 12.7400, 77.8300),
    ("Krishnagiri Toll",           12.5290, 78.2140),
    ("Chengalpattu Toll",          12.6920, 79.9760),
    ("Tada Toll (AP-TN border)",   13.5300, 80.0100),
    ("Nellore Toll",               14.4400, 79.9860),
    ("Vijayawada Bypass Toll",     16.5060, 80.6480),
    ("Ichchapuram Toll",           19.1100, 84.6900),
    ("Bhubaneswar Toll (NH-16)",   20.2960, 85.8240),
    ("Kharagpur Toll",             22.3460, 87.2320),
    ("Dankuni Toll",               22.6720, 88.2950),
    ("Lucknow-Agra Expressway",    27.0000, 79.5000),
    ("Yamuna Expressway Toll",     27.6000, 78.0000),
]


def build_toll_set(n: int = 1200, rng: random.Random | None = None) -> list[Toll]:
    """Expand 30 seeds to ~n tolls by jittering ~+/-25 km."""
    rng = rng or random.Random(42)
    out: list[Toll] = []
    for i in range(n):
        name, lat, lon = SEED_TOLLS[i % len(SEED_TOLLS)]
        # 0.25 deg ~= 27 km at India latitudes -- scatters seeds along corridors
        jlat = lat + rng.uniform(-0.25, 0.25)
        jlon = lon + rng.uniform(-0.25, 0.25)
        out.append(Toll(id=f"T{i:04d}", name=f"{name} #{i}", lat=jlat, lon=jlon))
    return out


def build_pings(n: int = 100_000, seed: int = 7) -> np.ndarray:
    """Random GPS pings inside the mainland-India bounding box."""
    rng = np.random.default_rng(seed)
    lats = rng.uniform(8.0, 35.0, n)
    lons = rng.uniform(68.0, 95.0, n)
    return np.column_stack([lats, lons])


# ---------------------------------------------------------------------------
# Runners
# ---------------------------------------------------------------------------
def run_naive(tolls: list[Toll], pings: np.ndarray, radius: float) -> tuple[int, float]:
    t0 = time.perf_counter()
    hits = 0
    for lat, lon in pings:
        if naive_any_within(tolls, lat, lon, radius):
            hits += 1
    return hits, time.perf_counter() - t0


def run_geohash(idx: GeofenceIndex, pings: np.ndarray, radius: float) -> tuple[int, float]:
    t0 = time.perf_counter()
    hits = 0
    for lat, lon in pings:
        if idx.any_within(lat, lon, radius):
            hits += 1
    return hits, time.perf_counter() - t0


# ---------------------------------------------------------------------------
# Recall sanity check (geohash must not miss any naive hits)
# ---------------------------------------------------------------------------
def verify_recall(tolls: list[Toll], idx: GeofenceIndex, pings: np.ndarray, radius: float, sample: int = 2000) -> tuple[int, int]:
    miss = 0
    sample_pings = pings[:sample]
    for lat, lon in sample_pings:
        n = naive_any_within(tolls, lat, lon, radius)
        g = idx.any_within(lat, lon, radius)
        if n and not g:
            miss += 1
    return miss, sample


def main() -> None:
    N_TOLLS = 1_200
    N_PINGS = 100_000
    RADIUS_KM = 5.0

    print("=" * 64)
    print("FASTag geofence benchmark")
    print(f"  tolls       : {N_TOLLS}")
    print(f"  pings       : {N_PINGS:,}")
    print(f"  radius      : {RADIUS_KM} km")
    print("=" * 64)

    tolls = build_toll_set(N_TOLLS)
    pings = build_pings(N_PINGS)

    # --- baseline (subset, full 100k naive is slow) ---
    # We benchmark naive on 5k pings then extrapolate to keep the script <10s.
    SAMPLE = 5_000
    naive_hits, naive_t = run_naive(tolls, pings[:SAMPLE], RADIUS_KM)
    naive_per_ping_us = naive_t / SAMPLE * 1e6
    naive_ops = SAMPLE / naive_t

    # --- benchmark each geohash precision ---
    # Note: precision 7 at a 5 km query radius forces a ring of 34 cells in
    # each direction (~4,800 candidate cells). It's obviously a misuse --
    # cell size should be near the query radius -- so we benchmark on a
    # small ping sample just to confirm the cost, not pretend it scales.
    rows = []
    for p in (4, 5, 6, 7):
        idx = GeofenceIndex(tolls, precision=p)
        avg_bucket = sum(len(v) for v in idx.buckets.values()) / max(1, len(idx.buckets))
        max_bucket = max((len(v) for v in idx.buckets.values()), default=0)
        ring = idx._ring_for(RADIUS_KM)
        cells_scanned = (2 * ring + 1) ** 2
        n_run = N_PINGS if cells_scanned <= 200 else 2_000
        gh_hits, gh_t = run_geohash(idx, pings[:n_run], RADIUS_KM)
        per_ping_us = gh_t / n_run * 1e6
        ops = n_run / gh_t
        miss, sample = verify_recall(tolls, idx, pings, RADIUS_KM)
        rows.append({
            "precision": p,
            "ring":      ring,
            "cells":     cells_scanned,
            "buckets":   len(idx.buckets),
            "avg_bkt":   avg_bucket,
            "max_bkt":   max_bucket,
            "n_run":     n_run,
            "hits":      gh_hits,
            "per_ping_us": per_ping_us,
            "ops":       ops,
            "miss":      miss,
            "sample":    sample,
        })

    # --- output ---
    print("\nNaive O(N) baseline (sampled on 5,000 pings):")
    print(f"  hits        : {naive_hits}")
    print(f"  total time  : {naive_t*1000:.1f} ms")
    print(f"  per ping    : {naive_per_ping_us:,.1f} us")
    print(f"  throughput  : {naive_ops:,.0f} pings/sec")

    print("\nGeohash + Haversine:")
    print(f"  {'prec':>4} {'ring':>4} {'cells':>6} {'buckets':>8} {'avg/bkt':>8} "
          f"{'pings run':>10} {'per ping us':>12} {'ops/sec':>14} {'recall':>10}")
    print(f"  {'-'*4} {'-'*4} {'-'*6} {'-'*8} {'-'*8} {'-'*10} {'-'*12} {'-'*14} {'-'*10}")
    for r in rows:
        recall = f"{r['sample']-r['miss']}/{r['sample']}"
        print(f"  {r['precision']:>4d} {r['ring']:>4d} {r['cells']:>6d} "
              f"{r['buckets']:>8d} {r['avg_bkt']:>8.1f} {r['n_run']:>10,} "
              f"{r['per_ping_us']:>12.2f} {r['ops']:>14,.0f} {recall:>10}")

    # --- headline speedup ---
    best = min(rows, key=lambda r: r["per_ping_us"])
    speedup = naive_per_ping_us / best["per_ping_us"]
    print(f"\nBest precision : geohash-{best['precision']}")
    print(f"Speedup vs naive: {speedup:,.1f}x  "
          f"({naive_per_ping_us:.1f} us  ->  {best['per_ping_us']:.2f} us per ping)")

    # --- sanity: Haversine vs naive geometry ---
    # Distance between Delhi and Mumbai is ~1163 km on great circle.
    delhi = (28.6139, 77.2090)
    mumbai = (19.0760, 72.8777)
    d = haversine_km(*delhi, *mumbai)
    print(f"\nSanity: Delhi <-> Mumbai great-circle = {d:.1f} km (expected ~1163 km)")


if __name__ == "__main__":
    main()

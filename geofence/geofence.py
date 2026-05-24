"""
Geofence proximity check for FASTag Chain Reaction.

Problem: given millions of GPS pings/second from phones, decide
"is any toll within 5 km of this point?" without scanning all 1,200 tolls.

Strategy (two-stage):
    1. Geohash prefix filter   -- O(1) hash lookup, narrows ~1,200 -> <20 candidates
    2. Haversine exact check    -- precise spherical distance, only on candidates

Geohash refresher
-----------------
A geohash is a base-32 string that recursively bisects (lon, lat) space.
Longer prefix = smaller cell. At length 5, a cell is ~4.9 x 4.9 km --
which conveniently matches our 5 km query radius, so for any query point
the 5 km ball overlaps at most the home cell + 8 neighbours.
"""

from __future__ import annotations

import math
from collections import defaultdict
from dataclasses import dataclass
from typing import Iterable

# Standard geohash alphabet (Niemeyer 2008, base-32, omits a/i/l/o).
_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
_BASE32_IDX = {c: i for i, c in enumerate(_BASE32)}

EARTH_RADIUS_KM = 6371.0088  # WGS84 mean radius


# ---------------------------------------------------------------------------
# Geohash encode  (lon, lat) -> string
# ---------------------------------------------------------------------------
def geohash_encode(lat: float, lon: float, precision: int = 5) -> str:
    """Encode a coordinate into a base-32 geohash of given length."""
    lat_lo, lat_hi = -90.0, 90.0
    lon_lo, lon_hi = -180.0, 180.0
    bits, bit, ch, even = [], 0, 0, True  # even bit -> longitude
    while len(bits) < precision:
        if even:
            mid = (lon_lo + lon_hi) / 2
            if lon >= mid:
                ch |= 1 << (4 - bit)
                lon_lo = mid
            else:
                lon_hi = mid
        else:
            mid = (lat_lo + lat_hi) / 2
            if lat >= mid:
                ch |= 1 << (4 - bit)
                lat_lo = mid
            else:
                lat_hi = mid
        even = not even
        bit += 1
        if bit == 5:
            bits.append(_BASE32[ch])
            bit, ch = 0, 0
    return "".join(bits)


def geohash_decode_bbox(gh: str) -> tuple[float, float, float, float]:
    """Decode a geohash to its bounding box (lat_lo, lat_hi, lon_lo, lon_hi)."""
    lat_lo, lat_hi = -90.0, 90.0
    lon_lo, lon_hi = -180.0, 180.0
    even = True
    for c in gh:
        cd = _BASE32_IDX[c]
        for mask in (16, 8, 4, 2, 1):
            if even:
                mid = (lon_lo + lon_hi) / 2
                if cd & mask:
                    lon_lo = mid
                else:
                    lon_hi = mid
            else:
                mid = (lat_lo + lat_hi) / 2
                if cd & mask:
                    lat_lo = mid
                else:
                    lat_hi = mid
            even = not even
    return lat_lo, lat_hi, lon_lo, lon_hi


def geohash_neighbours(gh: str, ring: int = 1) -> list[str]:
    """Return cells in a (2*ring+1) x (2*ring+1) block centred on `gh`.

    `ring=1` -> classic 3x3 (9 cells), works when cell_size >= query_radius.
    When cells are smaller than the radius (e.g. precision 6 at 5 km query),
    you must widen the ring. `GeofenceIndex` computes the right ring from
    the precision automatically.

    Works correctly away from poles/antimeridian. India sits safely inside
    ~8N-37N, 68E-97E so wrap-around is documented but not implemented.
    """
    lat_lo, lat_hi, lon_lo, lon_hi = geohash_decode_bbox(gh)
    lat_c, lon_c = (lat_lo + lat_hi) / 2, (lon_lo + lon_hi) / 2
    dlat, dlon = lat_hi - lat_lo, lon_hi - lon_lo
    p = len(gh)
    out = set()
    for dy in range(-ring, ring + 1):
        for dx in range(-ring, ring + 1):
            out.add(geohash_encode(lat_c + dy * dlat, lon_c + dx * dlon, p))
    return list(out)


# Smallest cell dimension (lat or lon) at India's latitude range, in km.
# Geohash cell shape alternates: odd precisions are square-ish at equator,
# even precisions are 2x wide. Longitudinal width shrinks as cos(lat),
# so at lat=37N (north India worst case) lon-width *= 0.8.
# We size the scan ring off this minimum to guarantee recall everywhere
# in mainland India. Numbers below are slightly rounded down for safety.
_CELL_MIN_KM = {1: 2500.0, 2: 500.0, 3: 78.0, 4: 15.6, 5: 3.90, 6: 0.49, 7: 0.122, 8: 0.0153}


# ---------------------------------------------------------------------------
# Haversine -- great-circle distance on a sphere
# ---------------------------------------------------------------------------
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km. Accurate to ~0.5% vs WGS84 ellipsoid."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# Geofence index
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Toll:
    id: str
    name: str
    lat: float
    lon: float


class GeofenceIndex:
    """Two-stage geofence: geohash bucket -> Haversine refine."""

    def __init__(self, tolls: Iterable[Toll], precision: int = 5):
        self.precision = precision
        self.cell_km = _CELL_MIN_KM.get(precision, 0.019)
        self.buckets: dict[str, list[Toll]] = defaultdict(list)
        self.tolls: list[Toll] = list(tolls)
        for t in self.tolls:
            self.buckets[geohash_encode(t.lat, t.lon, precision)].append(t)

    def _ring_for(self, radius_km: float) -> int:
        """How many cells outward we must scan to fully cover `radius_km`."""
        return max(1, math.ceil(radius_km / self.cell_km))

    # ---- query API ---------------------------------------------------------
    def nearby(self, lat: float, lon: float, radius_km: float = 5.0) -> list[tuple[Toll, float]]:
        """Return [(toll, distance_km), ...] for tolls within radius_km."""
        gh = geohash_encode(lat, lon, self.precision)
        ring = self._ring_for(radius_km)
        # Edge cases handled by ring scan:
        #   * ping on a cell boundary  -- neighbour ring catches it
        #   * radius > cell size       -- ring grows automatically
        candidates: list[Toll] = []
        for cell in geohash_neighbours(gh, ring=ring):
            candidates.extend(self.buckets.get(cell, ()))
        hits = []
        for t in candidates:
            d = haversine_km(lat, lon, t.lat, t.lon)
            if d <= radius_km:
                hits.append((t, d))
        return hits

    def any_within(self, lat: float, lon: float, radius_km: float = 5.0) -> bool:
        """Fast-path: stop on first hit."""
        gh = geohash_encode(lat, lon, self.precision)
        ring = self._ring_for(radius_km)
        for cell in geohash_neighbours(gh, ring=ring):
            for t in self.buckets.get(cell, ()):
                if haversine_km(lat, lon, t.lat, t.lon) <= radius_km:
                    return True
        return False


# ---------------------------------------------------------------------------
# Naive baseline (for benchmarking)
# ---------------------------------------------------------------------------
def naive_any_within(tolls: list[Toll], lat: float, lon: float, radius_km: float = 5.0) -> bool:
    """O(N) scan -- the strawman we are beating."""
    for t in tolls:
        if haversine_km(lat, lon, t.lat, t.lon) <= radius_km:
            return True
    return False

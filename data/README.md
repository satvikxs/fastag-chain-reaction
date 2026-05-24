# FASTag Chain Reaction — Toll Plaza Geofence Dataset

`toll-plazas.csv` is a curated dataset of 100 real Indian toll plazas used by
the simulator as geofence anchors. This README explains how the dataset was
assembled, where its limits are, how to extend it to the full ~1,200 NHAI
network, and which five plazas are best for a hackathon demo.

---

## Schema

| Column | Notes |
| --- | --- |
| `toll_id` | Stable internal ID (`TP001`–`TP100`). Do not reassign once shipped. |
| `name` | Plaza display name, taken from NHAI / operator listings. |
| `highway` | Highway designation. Includes new-style NH-XX numbering and named expressways (e.g. Mumbai-Pune Expressway, Yamuna Expressway, Bengaluru-Mysuru Expressway, Delhi-Mumbai Expressway). |
| `state` | Indian state the plaza sits in. 15 states represented. |
| `latitude`, `longitude` | WGS-84 decimal degrees, 4 decimal places (~11 m precision). Values suffixed with `_approx` (e.g. `28.3870_approx`) are NOT exact NHAI-published GPS — they are derived from nearby village/town centroids or interchange km-marks and should be treated as ±2 km until verified. |
| `fastag_lanes` | Number of dedicated FASTag lanes (each direction summed). Sourced from operator pages where available, otherwise estimated from plaza size. |
| `opened_year` | Year toll collection began (not the year of highway commissioning). |
| `operator` | Tolling concessionaire. `NHAI` for direct collection; private concessionaires (IRB, Adani, Jaypee, Dilip Buildcon, Larsen & Toubro, GMR, MSRDC, HMDA, UPEIDA, DME Development Ltd) otherwise. |
| `avg_daily_vehicles` | Estimated AADT through the plaza. Numbers are rounded estimates from news articles, NHAI press notes, and concessionaire annual reports. Treat as order-of-magnitude. |

---

## Source methodology

The dataset was hand-assembled from public sources via ~15 targeted web
searches. The hierarchy of trust used for each field:

1. **Exact GPS, no suffix.** Pulled from Mappls / mapcarta / wikimapia /
   GEOCORDS pins that explicitly label the toll plaza, or from operator /
   NHAI documents that publish coordinates. Examples: Khalapur (18.8010,
   73.2852), Talegaon (18.7139, 73.6458), Charoti (19.8905, 72.9426), Jewar
   (28.1147, 77.5747), Debra (22.3967, 87.5232), Ahmedabad-Vadodara (22.4138,
   73.1494).
2. **`_approx` GPS.** Derived from the nearest named village or
   interchange centroid where the plaza is reported to sit (e.g. "Hilalpur,
   Nuh district" → village centroid). Accurate enough for a city-level
   geofence demo, not accurate enough for a production billing decision.
3. **Operator / lanes / AADT.** Mostly NHAI's IHMCL fee plaza listing,
   tollguru.com, goodreturns.in, and operator press releases. Where the
   operator restructured (e.g. NHAI taking over Reliance plazas) the most
   recent known operator is recorded.

Primary sources consulted include:

- NHAI Toll Information System — https://tis.nhai.gov.in/tollplazasataglance
- IHMCL NH Fee Plazas list — https://ihmcl.co.in/wp-content/uploads/2025/08/NH-Fee-Plazas-1.pdf
- Wikipedia entries for each expressway (Mumbai-Pune, Yamuna, Delhi-Mumbai,
  Eastern/Western Peripheral, Purvanchal, Agra-Lucknow, Bengaluru-Mysuru, NH-19, NH-44, NH-48, NH-66, NH-16)
- TollGuru per-expressway guides — https://tollguru.com/
- Mappls / mapcarta / wikimapia plaza pins
- Goodreturns state-wise toll plaza directories

---

## Known gaps

- **`_approx` coordinates dominate.** Of the 100 rows, ~80 use approximated
  GPS. Before any real-money use, every `_approx` row needs to be verified
  against a satellite image or driven and re-pinned.
- **No plazas from the North East, Jammu & Kashmir, Ladakh, Bihar,
  Jharkhand, Chhattisgarh, Uttarakhand, or Sikkim.** The 15 states covered
  skew towards high-traffic corridors. Expansion is straightforward — these
  states each have 10–40 NHAI plazas listed in the IHMCL PDF.
- **AADT is rough.** Plaza-level vehicle counts are not consistently
  published. Numbers in this CSV are ballpark, cross-checked against news
  articles. The Kherki Daula figure (~80k) is well-documented; many others
  are estimates from concession agreement traffic projections.
- **Closed-tolling expressways.** Delhi-Mumbai Expressway, Mumbai-Pune
  Expressway, Yamuna Expressway, and the Peripheral Expressways use
  closed-system (entry/exit, distance-based) tolling rather than a single
  plaza. We treat each interchange tolling point as a plaza row, which is
  correct for geofence purposes but not for fare modelling.
- **Operator churn.** Concessions change hands every 5–15 years. The
  `operator` column reflects best-known assignments as of mid-2026 but
  should be refreshed annually.
- **Lane counts.** `fastag_lanes` is the operator-published figure where
  available, otherwise a sensible estimate based on plaza class (regional
  plaza ~8, major plaza ~12, mega plaza ~16+).

---

## Refresh process — scaling to all ~1,200 NHAI tolls

To go from 100 to the full network:

1. **Bulk seed.** Download the latest IHMCL NH Fee Plazas PDF
   (`ihmcl.co.in/wp-content/uploads/.../NH-Fee-Plazas-1.pdf`). Convert with
   `pdfplumber` or `tabula-py`. That gives `name`, `state`, `district`,
   `highway`, `section`, `concessionaire` for every active plaza —
   essentially the entire schema minus GPS, lanes, and AADT.
2. **Geocode.** Pipe each `name + state` through the Mappls (MapmyIndia) or
   Google Geocoding API with a `"toll plaza"` qualifier. Mappls gives the
   best Indian POI coverage. Reject any result more than 2 km off the
   highway centerline (use OSM highway geometry as the ground truth).
3. **Manual verification queue.** Anything the geocoder doesn't return a
   plaza-named POI for goes into a CSV that staff/interns inspect in Google
   Earth using the NHAI km-mark column. Estimate: ~40 % of rows need manual
   review.
4. **Lane counts.** Scrape `tis.nhai.gov.in/TollInformation?TollPlazaID=...`
   for each plaza — it includes lane configurations. Loop over the ID range
   (~1–1500) and parse.
5. **AADT.** Pull from each concessionaire's annual report (publicly
   filed) plus NHAI's quarterly traffic dashboards. Maintain a separate
   `toll-plazas-traffic-history.csv` so AADT can be versioned without
   thrashing the main file.
6. **Schedule.** Re-run the geocoder + IHMCL PDF diff monthly; refresh
   AADT quarterly; verify operator changes annually (concession transfers
   are typically NHAI press releases).

A first scaled pass should hit ~1,200 rows in 2–3 engineer-days, with
another 1–2 days of cleanup on the manual-review queue.

---

## Five recommended demo tolls for the hackathon

Pick plazas that (a) have exact GPS coordinates so the geofence reliably
triggers in front of judges, (b) sit near dense urban centres so the demo
phone has GPS lock, and (c) are nationally recognisable so the audience
"feels" the toll.

| # | Plaza | City reason | Why it demos well |
| --- | --- | --- | --- |
| 1 | **TP001 — Khalapur Toll Plaza** (Mumbai-Pune Expressway, Maharashtra) | Mumbai metro outskirts | India's most famous expressway plaza, 150k vehicles/day, exact verified GPS (18.8010, 73.2852). Universally recognised. |
| 2 | **TP007 — Kherki Daula Toll Plaza** (NH-48, Haryana) | Gurgaon / Delhi NCR | Busiest NHAI plaza in the country (~80k vehicles/day). Anyone who has driven Delhi-Jaipur has paid this toll. |
| 3 | **TP045 — Shamshabad Toll Plaza** (Hyderabad ORR, Telangana) | Hyderabad airport | Demos the ORR closed-system case; instantly familiar to anyone who has flown into HYD. Always-on signal because it's an active urban ring. |
| 4 | **TP039 — Ahmedabad-Vadodara Toll Plaza** (NE-1, Gujarat) | Ahmedabad-Vadodara corridor | Exact verified GPS (22.4138, 73.1494), on one of India's earliest access-controlled expressways. Good narrative anchor for "FASTag from day one." |
| 5 | **TP088 — Electronics City Elevated Toll** (NH-44, Karnataka) | Bengaluru tech corridor | A toll most engineers in the audience have personally paid. Sits 30 min from any Bangalore demo venue and works as a live drive-by if the judge wants to test in person. |

If demoing in a fixed venue, fall back to mock-GPS spoofing the device to
these coordinates; the geofence logic should be identical to a real drive.

---

## File layout

```
data/
  README.md          # this file
  toll-plazas.csv    # 100 plazas, schema above
```

When the dataset grows, keep one row per plaza per file, and version
breaking schema changes by bumping the CSV filename
(`toll-plazas.v2.csv`). Downstream code in `backend/` and `sim/` reads the
unversioned filename — update it deliberately.

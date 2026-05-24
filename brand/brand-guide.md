# FASTag Chain Reaction — Brand Guide

One page. One voice. One system. Use this everywhere — deck, landing, app, video, paperwork.

---

## 1. Logo concept

A clean wave (continuous traffic flow) crossed by a single diagonal barrier arm tipped with a red stop dot. Two green node-dots sit at the wave's inflection points, suggesting toll plaza checkpoints. The barrier doesn't just stop one vehicle — it stops the wave, and the wave becomes a chain. Reads as "FASTag → checkpoint → chain reaction" at any size.

Files:
- `logo-primary.svg` — square mark + stacked wordmark (320x120 viewBox)
- `logo-horizontal.svg` — square mark + inline wordmark (420x80)
- `logo-mark.svg` — mark only, 64x64, app-icon ready
- `logo-monochrome.svg` — single-color (`currentColor`) for print, dark mode, embossing
- `favicon.svg` — 32x32 simplified mark
- `favicon-32.png` — 32x32 PNG fallback for legacy browsers

---

## 2. Colors

| Token | Hex | Use |
|---|---|---|
| Highway Blue | `#0B2545` | Primary. App chrome, deck backgrounds, headings on light surfaces, structural lines. |
| Accent Orange | `#F4A261` | CTAs, key data callouts, "in motion" energy. Buttons, link hovers, KPI numbers. |
| Success Green | `#06A77D` | "Recharged", "Cleared", "Open lane". Status pills, success toasts. |
| Caution Red | `#E63946` | "Jam", "Blocked", "Low balance". Alerts, error states, hazard markers. |
| Off-white | `#FAFAF7` | Canvas / page background. Never pure `#FFFFFF` — too clinical. |
| Neutral Grey | `#6B7280` | Secondary text, dividers, disabled states, captions. |

### WCAG AA contrast (measured)

| Foreground / Background | Ratio | Verdict |
|---|---|---|
| Highway Blue on Off-white | **14.71** | AAA — body text safe |
| Off-white on Highway Blue | **14.71** | AAA — body text safe |
| Accent Orange on Highway Blue | **7.46** | AAA — use for CTAs on dark |
| Accent Orange on Off-white | 1.97 | **FAIL** — never use orange text on light; use as fill only |
| Success Green on Highway Blue | **5.01** | AA — text and icons OK |
| Success Green on Off-white | 2.94 | **FAIL for text** — use as fill / icon ≥24px only |
| Caution Red on Off-white | 3.99 | AA Large — headings and icons ≥18px |
| Caution Red on Highway Blue | 3.69 | AA Large — large UI only |
| Neutral Grey on Off-white | **4.62** | AA — body OK |
| Neutral Grey on Highway Blue | 3.18 | AA Large — captions ≥18px |

**Rule of thumb:** body text is Highway Blue on Off-white or Off-white on Highway Blue. Orange, green and red are fills first, text second.

---

## 3. Typography

| Role | Family | Weights | Source |
|---|---|---|---|
| Display / headings | **Plus Jakarta Sans** | 600, 700, 800 | Google Fonts |
| Body / UI | **Inter** | 400, 500, 600 | Google Fonts |
| Code / data | **JetBrains Mono** | 400, 500 | Google Fonts |

### Type scale (web, base 16px)

| Token | Size | Line | Weight | Family |
|---|---|---|---|---|
| h1 | 56 / 3.5rem | 1.05 | 800 | Plus Jakarta Sans |
| h2 | 40 / 2.5rem | 1.1 | 700 | Plus Jakarta Sans |
| h3 | 28 / 1.75rem | 1.2 | 700 | Plus Jakarta Sans |
| h4 | 20 / 1.25rem | 1.3 | 600 | Plus Jakarta Sans |
| body-lg | 18 | 1.55 | 400 | Inter |
| body | 16 | 1.55 | 400 | Inter |
| caption | 13 | 1.4 | 500 | Inter |
| code | 14 | 1.5 | 400 | JetBrains Mono |

Headlines tighten with `letter-spacing: -0.02em`. Body uses default tracking.

---

## 4. Voice & tone

Confident, plain-spoken Indian English. Short sentences. Verbs over adjectives. We sound like a senior NHAI engineer who's seen the data and is done sugar-coating.

**In voice:**
- "One stalled tag at the plaza adds 40 minutes to the next 12 km."
- "We rebuilt FASTag balance checks so they happen 800 m before the gantry, not at it."
- "Mumbai-Pune leaks ~₹14 crore of fuel a year to recoverable jams. Here's the proof."
- "The fix is not more toll booths. The fix is letting the booth disappear."

**Out of voice (avoid):**
- "Leveraging AI-driven synergies to revolutionize the mobility ecosystem."
- "We are excited to share our innovative journey toward seamless transportation!"
- "Disrupting the tolling paradigm with next-gen blockchain solutions."
- "A best-in-class platform for stakeholder-centric value creation."

No emojis in product copy. No exclamation marks outside marketing. Indian English spelling (`recognise`, `optimise`, `kilometre`). Money in `₹` with Indian grouping (`₹14,00,000`).

---

## 5. Iconography

- **Library:** [Lucide](https://lucide.dev) — only. Never mix with Heroicons, Feather, Material.
- **Stroke:** 2 px at native size. Don't override.
- **Size grid:** 16, 20, 24, 32, 40, 48.
- **Color:** inherit from text (`currentColor`). Status icons may use Success Green / Caution Red as fills.
- **Don't:** fill outline icons. Don't add drop shadows. Don't combine two icons into one composition.

---

## 6. Imagery

- **Use:** real photography of Indian highways — NH-48, Mumbai-Pune Expressway, Yamuna Expressway, Bengaluru-Mysore. Toll plazas at golden hour. Dashcam-style frames. Drone shots of curving expressway. Real FASTag stickers on real windshields.
- **Style:** documentary realism. Slight contrast bump, never oversaturated. Original photography or licensed editorial (Unsplash India tag, Getty editorial).
- **Don't use:** stock photo cliches (handshakes, lightbulbs, glowing globes, gear icons, hooded hackers, suit-and-tie boardrooms). No clip art. No 3D-rendered cars from asset stores. No "AI-generated highway" until it stops looking obviously synthetic.

---

## 7. Logo usage

### Clear space
Minimum clear space around the mark = height of the inner wave (≈ 25% of mark height). Nothing else inside that buffer.

### Minimum sizes
- Mark: 24 px (favicon scale).
- Primary lockup: 96 px wide.
- Horizontal lockup: 160 px wide.

### Backgrounds
- Off-white background → use primary (Highway Blue + Off-white inside the tile).
- Highway Blue background → use monochrome in Off-white.
- Photo background → use a Highway Blue tile beneath the mark with full clear space, or use monochrome white.

### Do
- Keep the tile's `14/26 px` corner radius proportional to mark size.
- Use the supplied SVGs at any size — they scale cleanly.
- Place on calm, low-contrast areas of photos.

### Don't
- Don't stretch, skew, or rotate.
- Don't recolor the mark outside the brand palette.
- Don't add drop shadows, glows, gradients, or bevels.
- Don't place on a busy photo without the solid tile.
- Don't separate the barrier slash from the wave — they are one composition.
- Don't translate the wordmark.

---

## 8. App icon spec

- **Source:** `logo-mark.svg` rendered to a 1024×1024 PNG with the existing 14/26 px-equivalent rounded tile baked in (iOS/Android will mask further).
- **Tile color:** Highway Blue `#0B2545`. No gradient. No bevel.
- **Safe area:** mark occupies the central 75% of the tile (768 px square centered).
- **Generation:** export 1024×1024 PNG once, then derive:
  - iOS: 1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20
  - Android (adaptive): foreground layer 432×432 in 108 dp container, background = Highway Blue solid
  - Web app manifest: 512, 192, 180 (Apple touch), 32 (favicon), 16
- **Foreground for Android adaptive:** export the mark alone (no tile) centered on transparent 432×432 — let the OS apply the shape mask.

### TODO
- Render `logo-mark.svg` → `app-icon-1024.png` via `rsvg-convert -w 1024 logo-mark.svg -o app-icon-1024.png` or a designer tool.
- Run through [appicon.co](https://appicon.co) or Xcode's asset catalog to fan out all required sizes.

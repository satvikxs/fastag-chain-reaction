"""Build FASTag Chain Reaction pitch deck."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

# Colors
HIGHWAY_BLUE = RGBColor(0x0B, 0x25, 0x45)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT_ORANGE = RGBColor(0xF4, 0xA2, 0x61)
SUCCESS_GREEN = RGBColor(0x06, 0xA7, 0x7D)
LIGHT_GREY = RGBColor(0xB0, 0xB0, 0xB0)
DARK_GREY = RGBColor(0x33, 0x33, 0x33)
SOFT_BLUE = RGBColor(0x1B, 0x3A, 0x5E)
PALE_BG = RGBColor(0xF5, 0xF7, 0xFA)

FONT = "Calibri"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height

BLANK = prs.slide_layouts[6]


def add_rect(slide, x, y, w, h, fill, line=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(0.75)
    shape.shadow.inherit = False
    return shape


def add_text(slide, x, y, w, h, text, *, size=18, bold=False, color=DARK_GREY,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font=FONT):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = anchor
    lines = text.split("\n") if isinstance(text, str) else text
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        run = p.add_run()
        run.text = line
        run.font.name = font
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
    return tb


def add_footer(slide, n):
    add_text(slide, Inches(0.4), Inches(7.15), Inches(12.5), Inches(0.3),
             f"FASTag Chain Reaction  ·  Slide {n} of 6",
             size=9, color=LIGHT_GREY, align=PP_ALIGN.LEFT)


def add_accent_bar(slide, color=ACCENT_ORANGE, x=Inches(0.6), y=Inches(0.6),
                   w=Inches(0.5), h=Inches(0.08)):
    add_rect(slide, x, y, w, h, color)


# ----------------------- SLIDE 1 — TITLE -----------------------
s = prs.slides.add_slide(BLANK)
# full bg
add_rect(s, 0, 0, SW, SH, HIGHWAY_BLUE)
# left accent column
add_rect(s, 0, 0, Inches(0.35), SH, ACCENT_ORANGE)

# Eyebrow label
add_text(s, Inches(1.0), Inches(1.4), Inches(8), Inches(0.4),
         "PITCH DECK  ·  HACKATHON 2026", size=12, bold=True,
         color=ACCENT_ORANGE, align=PP_ALIGN.LEFT)

# Title
add_text(s, Inches(1.0), Inches(2.0), Inches(11), Inches(1.6),
         "FASTag Chain Reaction", size=66, bold=True, color=WHITE,
         align=PP_ALIGN.LEFT)

# Orange underline accent
add_rect(s, Inches(1.0), Inches(3.55), Inches(1.6), Inches(0.08), ACCENT_ORANGE)

# Subtitle
add_text(s, Inches(1.0), Inches(3.8), Inches(11), Inches(0.7),
         "Stop the wave before it starts.", size=28, bold=False,
         color=WHITE, align=PP_ALIGN.LEFT)

# Team + Hackathon block (bottom)
add_text(s, Inches(1.0), Inches(5.6), Inches(5), Inches(0.35),
         "TEAM", size=10, bold=True, color=ACCENT_ORANGE)
add_text(s, Inches(1.0), Inches(5.95), Inches(5), Inches(0.5),
         "[Team Name]", size=20, bold=True, color=WHITE)

add_text(s, Inches(7.0), Inches(5.6), Inches(5), Inches(0.35),
         "HACKATHON", size=10, bold=True, color=ACCENT_ORANGE)
add_text(s, Inches(7.0), Inches(5.95), Inches(5), Inches(0.5),
         "[Hackathon Name]", size=20, bold=True, color=WHITE)

# footer (lighter on dark bg)
add_text(s, Inches(0.7), Inches(7.15), Inches(12.5), Inches(0.3),
         "FASTag Chain Reaction  ·  Slide 1 of 6",
         size=9, color=LIGHT_GREY, align=PP_ALIGN.LEFT)


# ----------------------- SLIDE 2 — THE HOOK -----------------------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, WHITE)
# top accent strip
add_rect(s, 0, 0, SW, Inches(0.18), ACCENT_ORANGE)

# section label
add_text(s, Inches(0.7), Inches(0.5), Inches(6), Inches(0.4),
         "THE PROBLEM", size=12, bold=True, color=ACCENT_ORANGE)

# Headline
add_text(s, Inches(0.7), Inches(1.0), Inches(12), Inches(1.8),
         "One car. 71 in our sim.\n200+ in the real world.",
         size=54, bold=True, color=HIGHWAY_BLUE, align=PP_ALIGN.LEFT)

# Body
body = (
    "At any Indian toll plaza, a single FASTag failure — low balance, blacklisted tag, "
    "vehicle-class mismatch, or expired KYC — stops one car for 90+ seconds. "
    "Our single-lane Nagel-Schreckenberg simulator shows this queues 71 vehicles with "
    "3.1 min of residual slowdown. Extrapolated to a typical 3-lane Indian toll at ~600 vph, "
    "the wave-equivalent affects 200+ vehicles over 12-15 minutes (model extrapolation)."
)
add_text(s, Inches(0.7), Inches(3.6), Inches(7.6), Inches(2.4),
         body, size=16, color=DARK_GREY, align=PP_ALIGN.LEFT)

# Pull-quote box (right side)
quote_x = Inches(8.7)
quote_y = Inches(3.5)
quote_w = Inches(4.0)
quote_h = Inches(2.6)
add_rect(s, quote_x, quote_y, quote_w, quote_h, HIGHWAY_BLUE)
# orange accent stripe on left of quote
add_rect(s, quote_x, quote_y, Inches(0.12), quote_h, ACCENT_ORANGE)
add_text(s, quote_x + Inches(0.4), quote_y + Inches(0.3),
         quote_w - Inches(0.6), Inches(0.5),
         "“", size=48, bold=True, color=ACCENT_ORANGE)
add_text(s, quote_x + Inches(0.4), quote_y + Inches(0.9),
         quote_w - Inches(0.6), Inches(1.4),
         "Every Indian who's driven a highway has lived this.",
         size=18, bold=True, color=WHITE, align=PP_ALIGN.LEFT)

add_footer(s, 2)


# ----------------------- SLIDE 3 — THE CHAIN REACTION -----------------------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, WHITE)
add_rect(s, 0, 0, SW, Inches(0.18), ACCENT_ORANGE)

add_text(s, Inches(0.7), Inches(0.5), Inches(6), Inches(0.4),
         "THE CHAIN REACTION", size=12, bold=True, color=ACCENT_ORANGE)
add_text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.9),
         "How one stop becomes a wave.",
         size=36, bold=True, color=HIGHWAY_BLUE)

# Timeline strip
timeline_y = Inches(2.4)
timeline_h = Inches(2.6)
strip_x = Inches(0.7)
strip_w = Inches(11.9)

# Background timeline line
add_rect(s, strip_x, timeline_y + Inches(1.95), strip_w, Inches(0.06), LIGHT_GREY)

stages = [
    ("T+0s", "One car stops.\nFASTag fails at the gantry.", HIGHWAY_BLUE),
    ("T+30s", "8 cars queued\nbehind the stopped vehicle.", SOFT_BLUE),
    ("T+90s", "~40 cars queued.\nWave travels backward at ~20 km/h.", ACCENT_ORANGE),
    ("T+3min", "71 cars (sim) / 200+ (3-lane extrap).\nResidual slowdown 3-15 min.", RGBColor(0xC0, 0x39, 0x2B)),
]

col_w = strip_w / len(stages)
for i, (t, body, color) in enumerate(stages):
    cx = strip_x + col_w * i
    # Time chip
    chip_w = Inches(1.4)
    chip_h = Inches(0.55)
    chip_x = cx + (col_w - chip_w) / 2
    add_rect(s, chip_x, timeline_y, chip_w, chip_h, color)
    add_text(s, chip_x, timeline_y + Inches(0.08), chip_w, chip_h,
             t, size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    # Dot on timeline
    dot_size = Inches(0.28)
    dot_x = cx + (col_w - dot_size) / 2
    dot_y = timeline_y + Inches(1.86)
    dot = s.shapes.add_shape(MSO_SHAPE.OVAL, dot_x, dot_y, dot_size, dot_size)
    dot.fill.solid()
    dot.fill.fore_color.rgb = color
    dot.line.fill.background()
    # Connector to chip
    add_rect(s, cx + col_w/2 - Inches(0.015), timeline_y + Inches(0.55),
             Inches(0.03), Inches(1.31), LIGHT_GREY)
    # Body text below timeline
    add_text(s, cx + Inches(0.1), timeline_y + Inches(2.25),
             col_w - Inches(0.2), Inches(1.2),
             body, size=12, color=DARK_GREY, align=PP_ALIGN.CENTER)

# Bottom quote bar
qy = Inches(6.05)
add_rect(s, Inches(0.7), qy, Inches(11.9), Inches(0.85), PALE_BG)
add_rect(s, Inches(0.7), qy, Inches(0.12), Inches(0.85), ACCENT_ORANGE)
add_text(s, Inches(1.0), qy + Inches(0.12), Inches(11.5), Inches(0.65),
         "“Sugiyama 2008 proved phantom jams are real wave physics. Stern 2018 showed waves can only be dampened by controlled vehicles — so we prevent the trigger instead.”",
         size=12, bold=True, color=HIGHWAY_BLUE, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 3)


# ----------------------- SLIDE 4 — SOLUTION -----------------------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, WHITE)
add_rect(s, 0, 0, SW, Inches(0.18), ACCENT_ORANGE)

add_text(s, Inches(0.7), Inches(0.5), Inches(6), Inches(0.4),
         "OUR SOLUTION", size=12, bold=True, color=ACCENT_ORANGE)
add_text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.9),
         "5km Pre-Warning System.",
         size=40, bold=True, color=HIGHWAY_BLUE)
add_text(s, Inches(0.7), Inches(1.85), Inches(12), Inches(0.5),
         "We intercept every FASTag failure before it ever reaches the gantry.",
         size=16, color=DARK_GREY)

# Three pillar cards
card_y = Inches(2.9)
card_h = Inches(3.1)
card_w = Inches(3.85)
gap = Inches(0.225)
start_x = Inches(0.7)

pillars = [
    ("01", "Geofence",
     "Detect approach to every Indian toll plaza in real time, 5 km out."),
    ("02", "4-Mode Check",
     "Verify balance, blacklist, vehicle class, and KYC status — all four failure modes, in one call."),
    ("03", "One-Tap UPI",
     "Recharge or resolve directly from the warning — before the cascade can start."),
]

for i, (num, title, body) in enumerate(pillars):
    cx = start_x + (card_w + gap) * i
    # Card
    add_rect(s, cx, card_y, card_w, card_h, PALE_BG)
    # Top color bar
    add_rect(s, cx, card_y, card_w, Inches(0.18), ACCENT_ORANGE)
    # Big number
    add_text(s, cx + Inches(0.3), card_y + Inches(0.35),
             card_w - Inches(0.6), Inches(0.8),
             num, size=42, bold=True, color=ACCENT_ORANGE)
    # Title
    add_text(s, cx + Inches(0.3), card_y + Inches(1.25),
             card_w - Inches(0.6), Inches(0.55),
             title, size=22, bold=True, color=HIGHWAY_BLUE)
    # Body
    add_text(s, cx + Inches(0.3), card_y + Inches(1.9),
             card_w - Inches(0.6), Inches(1.1),
             body, size=13, color=DARK_GREY)

# Tagline
add_rect(s, Inches(0.7), Inches(6.25), Inches(11.9), Inches(0.65), HIGHWAY_BLUE)
add_text(s, Inches(0.7), Inches(6.25), Inches(11.9), Inches(0.65),
         "Rajmargyatra does balance + recharge. We add location-based readiness + cross-bank aggregation.",
         size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
         anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 4)


# ----------------------- SLIDE 5 — DEMO + NUMBERS -----------------------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, WHITE)
add_rect(s, 0, 0, SW, Inches(0.18), ACCENT_ORANGE)

add_text(s, Inches(0.7), Inches(0.5), Inches(6), Inches(0.4),
         "DEMO + NUMBERS", size=12, bold=True, color=ACCENT_ORANGE)
add_text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.9),
         "What it looks like. What it saves.",
         size=36, bold=True, color=HIGHWAY_BLUE)

# Left column — mockup placeholder
mock_x = Inches(0.7)
mock_y = Inches(2.2)
mock_w = Inches(4.2)
mock_h = Inches(4.0)
# Phone-frame styling
add_rect(s, mock_x, mock_y, mock_w, mock_h, HIGHWAY_BLUE)
add_rect(s, mock_x + Inches(0.2), mock_y + Inches(0.2),
         mock_w - Inches(0.4), mock_h - Inches(0.4), WHITE)
add_text(s, mock_x, mock_y, mock_w, mock_h,
         "[App Mockup Screenshot]", size=16, bold=True, color=LIGHT_GREY,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

# Right column — numbers
right_x = Inches(5.4)
right_w = Inches(7.2)

# WITHOUT card
without_y = Inches(2.2)
add_rect(s, right_x, without_y, right_w, Inches(1.7), PALE_BG)
add_rect(s, right_x, without_y, Inches(0.12), Inches(1.7),
         RGBColor(0xC0, 0x39, 0x2B))
add_text(s, right_x + Inches(0.35), without_y + Inches(0.2),
         right_w - Inches(0.5), Inches(0.4),
         "WITHOUT THE APP", size=11, bold=True,
         color=RGBColor(0xC0, 0x39, 0x2B))
add_text(s, right_x + Inches(0.35), without_y + Inches(0.6),
         right_w - Inches(0.5), Inches(0.7),
         "71-car queue (sim)  ·  3.1-min slowdown",
         size=22, bold=True, color=HIGHWAY_BLUE)
add_text(s, right_x + Inches(0.35), without_y + Inches(1.25),
         right_w - Inches(0.5), Inches(0.4),
         "Single-lane Nagel-Schreckenberg. 3-lane extrapolation: 200+ cars / 12-15 min.",
         size=11, color=DARK_GREY)

# WITH card
with_y = Inches(4.05)
add_rect(s, right_x, with_y, right_w, Inches(1.7), PALE_BG)
add_rect(s, right_x, with_y, Inches(0.12), Inches(1.7), SUCCESS_GREEN)
add_text(s, right_x + Inches(0.35), with_y + Inches(0.2),
         right_w - Inches(0.5), Inches(0.4),
         "WITH THE APP (4% ADOPTION)", size=11, bold=True, color=SUCCESS_GREEN)
add_text(s, right_x + Inches(0.35), with_y + Inches(0.6),
         right_w - Inches(0.5), Inches(0.7),
         "Trigger prevented. 7 cars / 0 min.",
         size=22, bold=True, color=SUCCESS_GREEN)
add_text(s, right_x + Inches(0.35), with_y + Inches(1.25),
         right_w - Inches(0.5), Inches(0.4),
         "Simulation: 4% of drivers warned 5 km out keeps the cascade below critical density.",
         size=11, color=DARK_GREY)

# Bottom money line
money_y = Inches(6.25)
add_rect(s, Inches(0.7), money_y, Inches(11.9), Inches(0.65), HIGHWAY_BLUE)
add_text(s, Inches(0.7), money_y, Inches(11.9), Inches(0.65),
         "₹3,800 Cr/year in fuel + time waste eliminated at 500k-user scale  ·  est. from NHAI data",
         size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
         anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 5)


# ----------------------- SLIDE 6 — IMPACT + ASK -----------------------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, WHITE)
add_rect(s, 0, 0, SW, Inches(0.18), ACCENT_ORANGE)

add_text(s, Inches(0.7), Inches(0.5), Inches(6), Inches(0.4),
         "IMPACT + ASK", size=12, bold=True, color=ACCENT_ORANGE)
add_text(s, Inches(0.7), Inches(0.95), Inches(12), Inches(0.9),
         "Who wins. What we want.",
         size=36, bold=True, color=HIGHWAY_BLUE)

# Three impact pillars
pcard_y = Inches(2.3)
pcard_h = Inches(3.0)
pcard_w = Inches(3.85)
pgap = Inches(0.225)
pstart = Inches(0.7)

impacts = [
    ("FOR DRIVERS", "Minutes saved.\nFuel saved.",
     "Skip the wave entirely. Recharge once, drive through.", ACCENT_ORANGE),
    ("FOR NHAI", "Live toll plaza\nhealth dashboard.",
     "Post-toll telemetry layer — our product moat and NHAI's missing eye.", HIGHWAY_BLUE),
    ("FOR INDIA", "Measurable highway\nthroughput gain.",
     "Compounding national productivity from a single backend integration.", SUCCESS_GREEN),
]

for i, (label, headline, body, color) in enumerate(impacts):
    cx = pstart + (pcard_w + pgap) * i
    add_rect(s, cx, pcard_y, pcard_w, pcard_h, PALE_BG)
    add_rect(s, cx, pcard_y, pcard_w, Inches(0.18), color)
    add_text(s, cx + Inches(0.3), pcard_y + Inches(0.35),
             pcard_w - Inches(0.6), Inches(0.4),
             label, size=11, bold=True, color=color)
    add_text(s, cx + Inches(0.3), pcard_y + Inches(0.8),
             pcard_w - Inches(0.6), Inches(1.4),
             headline, size=22, bold=True, color=HIGHWAY_BLUE)
    add_text(s, cx + Inches(0.3), pcard_y + Inches(2.05),
             pcard_w - Inches(0.6), Inches(0.9),
             body, size=12, color=DARK_GREY)

# CTA strip
cta_y = Inches(5.7)
cta_h = Inches(1.15)
add_rect(s, Inches(0.7), cta_y, Inches(11.9), cta_h, HIGHWAY_BLUE)
add_rect(s, Inches(0.7), cta_y, Inches(0.18), cta_h, ACCENT_ORANGE)
add_text(s, Inches(1.1), cta_y + Inches(0.15),
         Inches(11.4), Inches(0.4),
         "THE ASK", size=11, bold=True, color=ACCENT_ORANGE)
add_text(s, Inches(1.1), cta_y + Inches(0.5),
         Inches(11.4), Inches(0.6),
         "Pilot with one toll on the Mumbai–Pune Expressway.  90 days.  Measurable wave reduction.",
         size=18, bold=True, color=WHITE, anchor=MSO_ANCHOR.TOP)

add_footer(s, 6)


# ---- Save ----
out = "/Users/adeebbashir/projects/fastag-chain-reaction/deck/pitch.pptx"
prs.save(out)
print(f"Saved: {out}")

"""
Record two demo videos for FASTag Chain Reaction project.

Video 1: Web prototype two-phone comparison (with playback at 2x).
Video 2: Landing page editorial scroll-through.

Outputs MP4 files via ffmpeg conversion from Playwright's native webm.
"""

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = Path("/Users/adeebbashir/projects/fastag-chain-reaction")
VIDEO_DIR = BASE / "video"
WEB_PROTO_URL = f"file://{BASE}/web-prototype/index.html"
SITE_URL = f"file://{BASE}/site/index.html"

VIDEO_DIR.mkdir(parents=True, exist_ok=True)


def convert_to_mp4(webm_path: Path, out_path: Path) -> bool:
    """Convert a webm file to mp4 via ffmpeg. Returns True on success."""
    if not shutil.which("ffmpeg"):
        print(f"[warn] ffmpeg not found; leaving {webm_path} as .webm")
        # Just rename webm to the .mp4-target's webm sibling
        webm_sibling = out_path.with_suffix(".webm")
        shutil.move(str(webm_path), str(webm_sibling))
        return False
    cmd = [
        "ffmpeg", "-y", "-i", str(webm_path),
        "-c:v", "libx264", "-preset", "slow", "-crf", "22",
        "-pix_fmt", "yuv420p", "-r", "30",
        str(out_path),
    ]
    print(f"[ffmpeg] {' '.join(cmd)}")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"[ffmpeg-err] {proc.stderr[-800:]}")
        return False
    print(f"[ffmpeg] OK -> {out_path}")
    # Delete source webm after success
    try:
        webm_path.unlink()
    except Exception:
        pass
    return True


def record_web_prototype(pw):
    """Video 1: web prototype with 2x speed playback."""
    print("\n=== Recording Video 1: web-prototype ===")
    tmp_dir = VIDEO_DIR / "_tmp_proto"
    tmp_dir.mkdir(exist_ok=True)
    # Clean stale files
    for f in tmp_dir.glob("*.webm"):
        f.unlink()

    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir=str(tmp_dir),
        record_video_size={"width": 1920, "height": 1080},
    )
    page = context.new_page()
    page.goto(WEB_PROTO_URL)
    page.wait_for_timeout(3000)

    # Click 2× speed button
    try:
        page.click('#speed-ctrl button[data-speed="2"]', timeout=5000)
        print("[proto] clicked 2x speed")
    except Exception as e:
        print(f"[proto] 2x click failed via selector: {e}; trying JS fallback")
        page.evaluate("document.querySelector('#speed-ctrl button[data-speed=\"2\"]').click()")

    page.wait_for_timeout(1000)

    # Click Play
    try:
        page.click('#btn-play', timeout=5000)
        print("[proto] clicked play")
    except Exception as e:
        print(f"[proto] play click failed: {e}; trying JS fallback")
        page.evaluate("document.getElementById('btn-play').click()")

    # 2:30 timeline at 2x = 75s. Wait 75s for playback.
    page.wait_for_timeout(75000)
    # Final state hold
    page.wait_for_timeout(3000)

    page.close()
    context.close()
    browser.close()

    # Find the produced webm
    webms = list(tmp_dir.glob("*.webm"))
    if not webms:
        print("[proto] ERROR: no webm produced")
        return None
    webm = webms[0]
    out = VIDEO_DIR / "web-prototype-demo.mp4"
    convert_to_mp4(webm, out)
    # Cleanup tmp
    shutil.rmtree(tmp_dir, ignore_errors=True)
    return out if out.exists() else out.with_suffix(".webm")


def record_site(pw):
    """Video 2: landing page scroll-through."""
    print("\n=== Recording Video 2: site scroll-through ===")
    tmp_dir = VIDEO_DIR / "_tmp_site"
    tmp_dir.mkdir(exist_ok=True)
    for f in tmp_dir.glob("*.webm"):
        f.unlink()

    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir=str(tmp_dir),
        record_video_size={"width": 1920, "height": 1080},
    )
    page = context.new_page()
    page.goto(SITE_URL)
    page.wait_for_timeout(3000)

    # Smooth scroll to bottom over 40s
    page.evaluate("""
        () => new Promise((resolve) => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          const duration = 40000;
          const start = performance.now();
          function step(now) {
            const t = Math.min((now - start) / duration, 1);
            window.scrollTo(0, totalHeight * t);
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          }
          requestAnimationFrame(step);
        })
    """)

    # Hold on footer
    page.wait_for_timeout(3000)

    # Scroll back to top over 3s
    page.evaluate("""
        () => new Promise((resolve) => {
          const start = performance.now();
          const startY = window.scrollY;
          const duration = 3000;
          function step(now) {
            const t = Math.min((now - start) / duration, 1);
            window.scrollTo(0, startY * (1 - t));
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          }
          requestAnimationFrame(step);
        })
    """)

    page.wait_for_timeout(1000)

    page.close()
    context.close()
    browser.close()

    webms = list(tmp_dir.glob("*.webm"))
    if not webms:
        print("[site] ERROR: no webm produced")
        return None
    webm = webms[0]
    out = VIDEO_DIR / "site-scrollthrough.mp4"
    convert_to_mp4(webm, out)
    shutil.rmtree(tmp_dir, ignore_errors=True)
    return out if out.exists() else out.with_suffix(".webm")


def main():
    with sync_playwright() as pw:
        v1 = record_web_prototype(pw)
        v2 = record_site(pw)
    print("\n=== DONE ===")
    for v in (v1, v2):
        if v and v.exists():
            sz = v.stat().st_size
            print(f"  {v}  ({sz/1024/1024:.2f} MB)")
        else:
            print(f"  MISSING: {v}")


if __name__ == "__main__":
    main()

"""
Record the animated FASTag Chain Reaction explainer as MP4.

Pipeline:
  1. Launch Chromium (headed=False) at exactly 1920x1080
  2. Load animated-explainer/index.html via file:// URL
  3. Wait 2 seconds for fonts + initial paint
  4. Record for 48 seconds (45s anim + ~3s tail buffer)
  5. Close context; Playwright saves webm
  6. ffmpeg convert webm -> mp4 (libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 -movflags +faststart)
  7. Delete intermediate webm
  8. Final MP4 path: ../animated-explainer.mp4

Also runs a final-frame sanity check by re-launching headless to a screenshot at sim time ~45s
to verify the close card is on screen.
"""

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = Path("/Users/adeebbashir/projects/fastag-chain-reaction")
EXPLAINER_DIR = BASE / "video" / "animated-explainer"
HTML_URL = f"file://{EXPLAINER_DIR}/index.html"
OUT_MP4 = BASE / "video" / "animated-explainer.mp4"
TMP_DIR = EXPLAINER_DIR / "_tmp_record"

RECORD_SECONDS = 48
WIDTH, HEIGHT = 1920, 1080


def convert_to_mp4(webm_path: Path, out_path: Path) -> bool:
    if not shutil.which("ffmpeg"):
        print("[error] ffmpeg not found on PATH")
        return False
    cmd = [
        "ffmpeg", "-y",
        "-i", str(webm_path),
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-movflags", "+faststart",
        str(out_path),
    ]
    print(f"[ffmpeg] converting: {webm_path.name} -> {out_path.name}")
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"[ffmpeg-err] {proc.stderr[-1500:]}")
        return False
    print(f"[ffmpeg] OK -> {out_path}")
    return True


def record():
    print("=== Recording animated explainer ===")
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    # Wipe any stale webms
    for f in TMP_DIR.glob("*.webm"):
        f.unlink()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            device_scale_factor=1,
            record_video_dir=str(TMP_DIR),
            record_video_size={"width": WIDTH, "height": HEIGHT},
        )
        page = context.new_page()
        print(f"[load] {HTML_URL}")
        page.goto(HTML_URL)
        # let fonts + initial paint settle
        page.wait_for_timeout(2000)

        print(f"[record] capturing {RECORD_SECONDS}s …")
        page.wait_for_timeout(RECORD_SECONDS * 1000)

        page.close()
        context.close()
        browser.close()

    webms = sorted(TMP_DIR.glob("*.webm"))
    if not webms:
        print("[error] no webm produced")
        return False
    webm = webms[-1]
    sz = webm.stat().st_size
    print(f"[record] webm captured: {webm.name} ({sz/1024/1024:.2f} MB)")

    ok = convert_to_mp4(webm, OUT_MP4)

    # Cleanup
    try:
        webm.unlink()
    except Exception:
        pass
    try:
        shutil.rmtree(TMP_DIR, ignore_errors=True)
    except Exception:
        pass

    return ok


def final_frame_check() -> bool:
    """Re-launch headless and screenshot near the end to confirm the close card is visible."""
    print("\n=== Final frame check ===")
    shot_path = EXPLAINER_DIR / "_final_check.png"
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ctx = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT})
            page = ctx.new_page()
            page.goto(HTML_URL)
            page.wait_for_timeout(46000)  # ~46s into the 45s animation — should be in hold state
            # Confirm DOM markers
            data_final = page.evaluate("document.body.getAttribute('data-final')")
            scene_final_active = page.evaluate(
                "document.getElementById('scene-final').classList.contains('in')"
            )
            page.screenshot(path=str(shot_path))
            ctx.close()
            browser.close()
        print(f"[check] data-final attr = {data_final}")
        print(f"[check] #scene-final.in = {scene_final_active}")
        ok = (data_final == "1") and bool(scene_final_active)
        if ok:
            print(f"[check] PASS — close card is active. Screenshot: {shot_path}")
        else:
            print(f"[check] FAIL — close card not detected. Screenshot: {shot_path}")
        return ok
    except Exception as e:
        print(f"[check] error: {e}")
        return False


def main():
    if not EXPLAINER_DIR.joinpath("index.html").exists():
        print(f"[fatal] index.html not found at {EXPLAINER_DIR}")
        sys.exit(1)

    t0 = time.time()
    ok_record = record()
    if not ok_record:
        print("[fatal] recording / conversion failed")
        sys.exit(2)
    elapsed = time.time() - t0
    print(f"[done] elapsed {elapsed:.1f}s")

    ok_check = final_frame_check()

    # Report
    if OUT_MP4.exists():
        sz_mb = OUT_MP4.stat().st_size / 1024 / 1024
        # ffprobe for duration
        dur = None
        if shutil.which("ffprobe"):
            try:
                r = subprocess.run(
                    ["ffprobe", "-v", "error",
                     "-show_entries", "format=duration",
                     "-of", "default=noprint_wrappers=1:nokey=1",
                     str(OUT_MP4)],
                    capture_output=True, text=True,
                )
                dur = float(r.stdout.strip())
            except Exception:
                pass
        print("\n=== REPORT ===")
        print(f"  MP4:        {OUT_MP4}")
        print(f"  size:       {sz_mb:.2f} MB")
        print(f"  duration:   {dur:.2f} s" if dur else "  duration:   (ffprobe unavailable)")
        print(f"  final-frame check: {'PASS' if ok_check else 'FAIL'}")
    else:
        print("[fatal] MP4 missing after pipeline")
        sys.exit(3)


if __name__ == "__main__":
    main()

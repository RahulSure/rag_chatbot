"""
Bring the Ganga backdrop to life: Seedance 2.5 image-to-video on the night
still (only the water, flames and mist move; the camera holds), then a
cross-faded, slowed, seamless loop cut with the bundled ffmpeg.

Billable unless run with --loop-only on an already downloaded clip.
Output: platform/apps/web/public/ganga/bg-night.mp4 (muted, ~1280w) and
bg-night-poster.webp (the loop's exact first frame).
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).parent
WEB_PUBLIC = TOOLS.parents[1] / "apps" / "web" / "public" / "ganga"

PROMPT = (
    "The river water flows gently: golden reflections shimmer and stretch on small drifting ripples, "
    "the floating diya flames flicker softly, thin mist drifts slowly over the far water, rose petals "
    "stir slightly on the stone ledge. The camera is completely static, locked off. The temples, ghats, "
    "moon, sky and stars remain perfectly still. No people moving, no new objects appear. "
    "Calm, slow, ambient, photorealistic, seamless atmosphere."
)


def load_env() -> None:
    env_file = TOOLS / ".env.local"
    if "HF_KEY" not in os.environ and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.strip() and not line.startswith("#") and "=" in line:
                name, value = line.split("=", 1)
                os.environ.setdefault(name.strip(), value.strip().strip("'\""))


def main(still_png: Path, out_name: str = "bg-night.mp4") -> None:
    import httpx
    import higgsfield_client
    from higgsfield_client.exceptions import HiggsfieldClientError

    print("uploading the still...", flush=True)
    image_url = higgsfield_client.upload_file(str(still_png))
    print("submitting bytedance/seedance-2.5/image-to-video (5s, 720p, billable)...", flush=True)
    try:
        result = higgsfield_client.subscribe(
            "bytedance/seedance-2.5/image-to-video",
            arguments={"image_url": image_url, "prompt": PROMPT, "duration": 5, "resolution": "720p",
                       "generate_audio": False},
        )
    except HiggsfieldClientError as e:
        sys.exit(f"refused: {e}")
    url = ((result or {}).get("video") or {}).get("url")
    if not url:
        sys.exit(f"no video in result: status={(result or {}).get('status')}")
    raw = TOOLS / "out" / "river-raw.mp4"
    raw.parent.mkdir(exist_ok=True)
    raw.write_bytes(httpx.get(url, timeout=300, follow_redirects=True).content)
    print(f"downloaded {raw} ({raw.stat().st_size // 1024} KB)", flush=True)
    make_loop(raw, out_name)


def _duration(ffmpeg: str, path: Path) -> float:
    probe = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", probe.stderr).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def make_loop(raw: Path, out_name: str = "bg-night.mp4", fade: float = 1.5, slow: float = 1.75,
              out_dir: Path = WEB_PUBLIC, width: int = 1280) -> None:
    """
    A seamless forward-flowing loop: the clip's tail is cross-faded into its own
    head, so the last frame leads straight into the first and the water never
    reverses. Then slowed (`slow`x) with motion-compensated in-between frames so
    the calmer current stays smooth, keyframed every second, plus a poster that
    is exactly the loop's first frame.
    """
    import imageio_ffmpeg
    from PIL import Image

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / out_name
    stem = Path(out_name).stem

    # 1. Slow the whole clip first (scene-change detection off, or the interpolator
    #    treats the last frames as a cut and jumps), so the loop seam below joins
    #    two real, consecutive frames.
    slowed = TOOLS / "out" / f"{stem}-slow.mp4"
    subprocess.run([
        ffmpeg, "-y", "-i", str(raw), "-vf",
        f"setpts={slow}*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none",
        "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "14", str(slowed),
    ], check=True, capture_output=True)

    # 2. Cross-fade the slowed clip's tail into its own head.
    d = _duration(ffmpeg, slowed)
    fade *= slow
    body = d - fade                       # length of the tail segment C[fade:d]
    offset = body - fade                  # where the tail starts dissolving into the head
    graph = (
        f"[0:v]split[a][b];"
        f"[a]trim=start={fade:.3f},setpts=PTS-STARTPTS[tail];"
        f"[b]trim=end={fade:.3f},setpts=PTS-STARTPTS[head];"
        f"[tail][head]xfade=transition=fade:duration={fade:.3f}:offset={offset:.3f},"
        f"scale={width}:-2,format=yuv420p[v]"
    )
    print(f"cutting a {body:.1f}s seamless loop (x{slow / 1:.2f} slower)...", flush=True)
    subprocess.run([
        ffmpeg, "-y", "-i", str(slowed), "-filter_complex", graph, "-map", "[v]", "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-g", "24", "-keyint_min", "24",
        "-movflags", "+faststart", str(out),
    ], check=True, capture_output=True)
    print(f"published {out} ({out.stat().st_size // 1024} KB)", flush=True)

    poster_png = TOOLS / "out" / f"{stem}-poster.png"
    subprocess.run([ffmpeg, "-y", "-i", str(out), "-frames:v", "1", str(poster_png)], check=True, capture_output=True)
    poster = out_dir / f"{stem}-poster.webp"
    Image.open(poster_png).convert("RGB").save(poster, "WEBP", quality=84, method=6)
    print(f"published {poster} ({poster.stat().st_size // 1024} KB)", flush=True)


if __name__ == "__main__":
    load_env()
    if sys.argv[1:2] == ["--loop-only"]:
        make_loop(Path(sys.argv[2]))   # re-cut an already downloaded clip, no API call
    else:
        main(Path(sys.argv[1]))

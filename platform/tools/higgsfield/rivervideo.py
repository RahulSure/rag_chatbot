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


def main(still_png: Path, out_name: str = "bg-night.mp4", prompt: str = PROMPT) -> None:
    import httpx
    import higgsfield_client
    from higgsfield_client.exceptions import HiggsfieldClientError

    print("uploading the still...", flush=True)
    image_url = higgsfield_client.upload_file(str(still_png))
    result = None
    for label, extra in (("720p", {"resolution": "720p"}), ("480p draft", {"draft": True})):
        print(f"submitting bytedance/seedance-2.5/image-to-video (5s, {label}, billable)...", flush=True)
        try:
            result = higgsfield_client.subscribe(
                "bytedance/seedance-2.5/image-to-video",
                arguments={"image_url": image_url, "prompt": prompt, "duration": 5, "generate_audio": False, **extra},
            )
            break
        except HiggsfieldClientError as e:
            print(f"  refused at {label}: {e}", flush=True)
            if "credit" not in str(e).lower():
                sys.exit(1)
    else:
        sys.exit("no tier could be afforded; nothing was charged")
    url = ((result or {}).get("video") or {}).get("url")
    if not url:
        sys.exit(f"no video in result: status={(result or {}).get('status')}")
    raw = TOOLS / "out" / f"{Path(out_name).stem}-raw.mp4"
    raw.parent.mkdir(exist_ok=True)
    raw.write_bytes(httpx.get(url, timeout=300, follow_redirects=True).content)
    print(f"downloaded {raw} ({raw.stat().st_size // 1024} KB)", flush=True)
    make_loop(raw, out_name)


def _duration(ffmpeg: str, path: Path) -> float:
    probe = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", probe.stderr).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def _frames(ffmpeg: str, path: Path) -> int:
    probe = subprocess.run([ffmpeg, "-hide_banner", "-i", str(path), "-map", "0:v:0", "-f", "null", "-"],
                           capture_output=True, text=True)
    return int(re.findall(r"frame=\s*(\d+)", probe.stderr)[-1])


def make_loop(raw: Path, out_name: str = "bg-night.mp4", fade: float = 1.5, slow: float = 1.75,
              out_dir: Path = WEB_PUBLIC, width: int = 1280, mode: str = "crossfade") -> None:
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

    if mode == "palindrome":
        # 2. For a moving camera a cross-fade ghosts two viewpoints; play forward then back instead.
        #    Every frame meets its true neighbour, and neither turning point repeats a frame.
        n = _frames(ffmpeg, slowed)
        graph = (
            f"[0:v]split[a][b];[b]reverse,trim=start_frame=1:end_frame={n - 1},setpts=PTS-STARTPTS[r];"
            f"[a][r]concat=n=2:v=1,scale={width}:-2,format=yuv420p[v]"
        )
        print(f"cutting a {(2 * n - 2) / 24:.1f}s palindrome loop (x{slow:.2f} slower)...", flush=True)
        subprocess.run([
            ffmpeg, "-y", "-i", str(slowed), "-filter_complex", graph, "-map", "[v]", "-an",
            "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-g", "24", "-keyint_min", "24",
            "-movflags", "+faststart", str(out),
        ], check=True, capture_output=True)
        _poster(ffmpeg, out, out_dir, stem)
        return

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
    _poster(ffmpeg, out, out_dir, stem)


def _poster(ffmpeg: str, out: Path, out_dir: Path, stem: str) -> None:
    """A still that is exactly the loop's first frame, shown before (and under) playback."""
    from PIL import Image

    poster_png = TOOLS / "out" / f"{stem}-poster.png"
    subprocess.run([ffmpeg, "-y", "-i", str(out), "-frames:v", "1", str(poster_png)], check=True, capture_output=True)
    poster = out_dir / f"{stem}-poster.webp"
    Image.open(poster_png).convert("RGB").save(poster, "WEBP", quality=84, method=6)
    print(f"published {poster} ({poster.stat().st_size // 1024} KB)", flush=True)


DAWN_PROMPT = (
    "The river water flows gently at first light: the sun's golden path shimmers and stretches on small "
    "drifting ripples, the temple's reflection wavers softly in the water, the small floating diya flames "
    "flicker, thin morning mist drifts slowly across the river, flower petals stir slightly on the stone "
    "steps. The camera is completely static, locked off. The temple, trees, sky and sun remain still. No "
    "people moving, no new objects appear. Calm, slow, ambient, photorealistic, seamless atmosphere."
)


if __name__ == "__main__":
    load_env()
    if sys.argv[1:2] == ["--loop-only"]:
        make_loop(Path(sys.argv[2]), sys.argv[3] if len(sys.argv) > 3 else "bg-night.mp4")  # no API call
    elif sys.argv[1:2] == ["--dawn"]:
        main(Path(sys.argv[2]), "bg-dawn.mp4", DAWN_PROMPT)
    else:
        main(Path(sys.argv[1]))

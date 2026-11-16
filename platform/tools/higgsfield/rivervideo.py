"""
Bring the Ganga backdrop to life: Seedance 2.5 image-to-video on the night
still (only the water, flames and mist move; the camera holds), then a
forward+reversed palindrome via the bundled ffmpeg so the loop has no seam.

Billable. Output: platform/apps/web/public/ganga/bg-night.mp4 (muted, ~1280w).
"""

from __future__ import annotations

import os
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
    import imageio_ffmpeg
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

    # forward + reversed = a loop with no seam; scaled and muted for the web
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
    out = WEB_PUBLIC / out_name
    subprocess.run([
        ffmpeg, "-y", "-i", str(raw),
        "-filter_complex", "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1,scale=1280:-2[v]",
        "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "25",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out),
    ], check=True, capture_output=True)
    print(f"published {out} ({out.stat().st_size // 1024} KB)", flush=True)


if __name__ == "__main__":
    load_env()
    main(Path(sys.argv[1]))

"""
Generate the Ganga page's cinematic backdrops with Higgsfield Soul stills:
a night and a dawn view of the river, composed so the interactive diyas sit
on open water (temples right, steps bottom-left, orb upper right).

Each run is billable. PNGs land in the out dir for review; --publish converts
the chosen PNGs to webp in platform/apps/web/public/ganga/.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

TOOLS = Path(__file__).parent
WEB_PUBLIC = TOOLS.parents[1] / "apps" / "web" / "public" / "ganga"

MODELS = ["higgsfield-ai/soul/v2/standard", "higgsfield-ai/soul/standard"]  # first that exists wins

COMPOSITION = (
    "Ancient temple spires and stone ghats lit by strings of warm golden lamps descend to the water "
    "along the right side of the frame, distant small pilgrims on the steps. The calm river fills the "
    "whole lower half with long golden reflections on gentle ripples; the centre of the water is open "
    "and empty. A few small lit clay diyas with marigold petals float far apart. Old stone ghat steps "
    "enter the water in the bottom left corner with scattered rose petals and one pink lotus. Gentle "
    "mist on the far bank. Photorealistic cinematic matte painting, rich detail, volumetric light, "
    "no text, no watermark, no logos, no people in the foreground."
)

PROMPTS = {
    "night": "Cinematic night scene of the Ganga river at Varanasi, wide shot. Deep indigo starry sky, "
             "one large glowing full moon in the upper right with a soft halo, its road of light on the water. "
             "Warm candlelight gold against cool blue night. " + COMPOSITION,
    "dawn": "Cinematic first light of dawn over the Ganga river at Varanasi, wide shot. Soft peach and pale "
            "gold sky, the rising sun low in the upper right with a gentle halo, its path shining on the water. "
            "Warm amber light against cool blue-grey water. " + COMPOSITION,
}


def load_env() -> None:
    env_file = TOOLS / ".env.local"
    if "HF_KEY" not in os.environ and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.strip() and not line.startswith("#") and "=" in line:
                name, value = line.split("=", 1)
                os.environ.setdefault(name.strip(), value.strip().strip("'\""))


def generate(which: list[str], out_dir: Path, tag: str) -> None:
    import httpx
    import higgsfield_client
    from higgsfield_client.exceptions import HiggsfieldClientError

    out_dir.mkdir(parents=True, exist_ok=True)
    for name in which:
        last_error: Exception | None = None
        for model in MODELS:
            print(f"[{name}] {model} (billable)...", flush=True)
            try:
                result = higgsfield_client.subscribe(model, arguments={"prompt": PROMPTS[name], "aspect_ratio": "16:9"})
            except HiggsfieldClientError as e:
                last_error = e
                if "not_found" in str(e).lower() or "404" in str(e):
                    continue  # try the older model id
                sys.exit(f"[{name}] refused: {e}")
            images = (result or {}).get("images") or []
            url = images[0].get("url") if images else ((result or {}).get("image") or {}).get("url")
            if not url:
                sys.exit(f"[{name}] no image in result: status={result.get('status') if result else None}")
            png = out_dir / f"{name}-{tag}.png"
            png.write_bytes(httpx.get(url, timeout=120, follow_redirects=True).content)
            print(f"[{name}] saved {png} ({png.stat().st_size // 1024} KB)")
            break
        else:
            sys.exit(f"[{name}] no model accepted the request: {last_error}")


def publish(night_png: Path, dawn_png: Path) -> None:
    from PIL import Image

    WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
    for src, dest in ((night_png, "bg-night.webp"), (dawn_png, "bg-dawn.webp")):
        img = Image.open(src).convert("RGB")
        if img.width > 1920:
            img = img.resize((1920, round(img.height * 1920 / img.width)), Image.LANCZOS)
        out = WEB_PUBLIC / dest
        img.save(out, "WEBP", quality=82, method=6)
        print(f"published {out} ({out.stat().st_size // 1024} KB, {img.width}x{img.height})")


if __name__ == "__main__":
    load_env()
    if sys.argv[1:2] == ["--publish"]:
        publish(Path(sys.argv[2]), Path(sys.argv[3]))
    else:
        which = sys.argv[1].split(",") if sys.argv[1:] else ["night", "dawn"]
        generate(which, Path(sys.argv[2]) if len(sys.argv) > 2 else TOOLS / "out", sys.argv[3] if len(sys.argv) > 3 else "a")

"""
The home page's cosmos: a Seedance 2.5 text-to-video of deep space with the
navagraha orbiting on faint golden astrolabe rings around a dark, empty centre
(the headline sits there), cut into a seamless slowed loop.

Billable. Tries 720p; if the balance cannot cover it, falls back to the cheaper
480p draft tier (refused requests are not charged). Output:
platform/apps/web/public/cosmos/hero.mp4 and hero-poster.webp.
"""

from __future__ import annotations

import sys
from pathlib import Path

from rivervideo import TOOLS, load_env, make_loop

OUT_DIR = TOOLS.parents[1] / "apps" / "web" / "public" / "cosmos"

PROMPT = (
    "A slow, majestic cinematic shot of deep space at night. A dark indigo and near-black cosmos filled with "
    "fine twinkling stars and faint violet and soft gold nebula clouds. Around the dark, empty centre of the "
    "frame, thin elegant golden orbital rings like an ancient brass astrolabe, with fine engraved tick marks, "
    "rotate slowly at different speeds. Nine softly glowing planets of different colours and sizes travel "
    "slowly along these rings: a radiant golden sun, a pale silver moon, a red planet, a ringed planet, a "
    "blue-green giant, a pale yellow planet, a small grey planet, a dark smoky planet. Gentle drifting golden "
    "dust particles. The centre of the frame stays dark and empty. Camera almost still, very slow push in. "
    "Calm, sacred, majestic, slow motion. No text, no letters, no numbers, no symbols, no people, no logos."
)


def main() -> None:
    import httpx
    import higgsfield_client
    from higgsfield_client.exceptions import HiggsfieldClientError

    attempts = [
        ("720p", {"resolution": "720p"}),
        ("480p draft", {"draft": True}),
    ]
    result = None
    for label, extra in attempts:
        print(f"submitting bytedance/seedance-2.5/text-to-video (5s, {label}, billable)...", flush=True)
        try:
            result = higgsfield_client.subscribe(
                "bytedance/seedance-2.5/text-to-video",
                arguments={"prompt": PROMPT, "duration": 5, "aspect_ratio": "16:9", "generate_audio": False, **extra},
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
    raw = TOOLS / "out" / "hero-raw.mp4"
    raw.parent.mkdir(exist_ok=True)
    raw.write_bytes(httpx.get(url, timeout=300, follow_redirects=True).content)
    print(f"downloaded {raw} ({raw.stat().st_size // 1024} KB)", flush=True)
    make_loop(raw, "hero.mp4", out_dir=OUT_DIR, slow=1.5)


if __name__ == "__main__":
    load_env()
    if sys.argv[1:2] == ["--loop-only"]:
        make_loop(Path(sys.argv[2]), "hero.mp4", out_dir=OUT_DIR, slow=1.5)
    else:
        main()

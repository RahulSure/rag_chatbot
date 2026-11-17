"""
Smoke test for the Higgsfield API: one short Seedance 2.5 text-to-video job.

Reads HF_KEY (key-id:key-secret) from .env.local next to this file — never
committed, never printed. Submits, waits, and prints the video URL on success;
any failed, canceled or moderation-blocked request is reported as exactly that.

NOTE: every successful run is a billable generation (priced per output second).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

ENV_FILE = Path(__file__).with_name(".env.local")

MODEL = "bytedance/seedance-2.5/text-to-video"
ARGUMENTS = {
    "prompt": "A cinematic scene at sunset",
    "duration": 5,
    "resolution": "720p",
    "aspect_ratio": "16:9",
}


def load_env() -> None:
    """Load HF_KEY from .env.local without echoing its value anywhere."""
    if "HF_KEY" in os.environ:
        return
    if not ENV_FILE.exists():
        sys.exit(f"missing {ENV_FILE.name}: put HF_KEY=key-id:key-secret in it (see .env.example)")
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            name, value = line.split("=", 1)
            os.environ.setdefault(name.strip(), value.strip().strip("'\""))
    if "HF_KEY" not in os.environ:
        sys.exit(f"{ENV_FILE.name} does not define HF_KEY")


def main() -> None:
    load_env()
    import higgsfield_client  # imported after the key is in the environment

    print(f"submitting {MODEL} ({ARGUMENTS['duration']}s, {ARGUMENTS['resolution']}, billable)...")
    try:
        result = higgsfield_client.subscribe(MODEL, arguments=ARGUMENTS)
    except higgsfield_client.exceptions.HiggsfieldClientError as e:
        # e.g. not_enough_credits (top up the API balance in the console), or auth errors
        sys.exit(f"request refused: {e}")

    status = (result or {}).get("status", "completed" if result and result.get("video") else "unknown")
    video = (result or {}).get("video") or {}
    url = video.get("url") if isinstance(video, dict) else None

    if url:
        print("status: completed")
        print(f"video: {url}")
    else:
        # failed / canceled / blocked by moderation — do not pretend otherwise
        print(f"status: {status}")
        if result and result.get("error"):
            print(f"error: {result['error']}")
        sys.exit(1)


if __name__ == "__main__":
    main()

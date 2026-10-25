"""
Offline birthplace lookup: name -> latitude, longitude, IANA time zone.

Uses the GeoNames "cities15000" dump (every city of 15,000+ people, ~30k places,
each with its time zone), licensed CC BY 4.0 — credit "GeoNames" wherever the
results are shown. Downloaded once into data/geo/ (gitignored); no API, no key.
"""

from __future__ import annotations

import io
import zipfile
from functools import lru_cache
from pathlib import Path

import requests

GEO_DIR = Path(__file__).resolve().parents[3] / "data" / "geo"
CITIES_URL = "https://download.geonames.org/export/dump/cities15000.zip"
ADMIN1_URL = "https://download.geonames.org/export/dump/admin1CodesASCII.txt"
USER_AGENT = "SadhakAI/1.0 (+https://github.com/RahulSure/rag_chatbot)"


def download(force: bool = False) -> None:
    GEO_DIR.mkdir(parents=True, exist_ok=True)
    cities = GEO_DIR / "cities15000.txt"
    if force or not cities.exists():
        resp = requests.get(CITIES_URL, headers={"User-Agent": USER_AGENT}, timeout=120)
        resp.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            cities.write_bytes(z.read("cities15000.txt"))
    admin1 = GEO_DIR / "admin1CodesASCII.txt"
    if force or not admin1.exists():
        resp = requests.get(ADMIN1_URL, headers={"User-Agent": USER_AGENT}, timeout=120)
        resp.raise_for_status()
        admin1.write_bytes(resp.content)


@lru_cache(maxsize=1)
def _places() -> tuple[dict, ...]:
    download()
    regions = {}
    for line in (GEO_DIR / "admin1CodesASCII.txt").read_text(encoding="utf-8").splitlines():
        code, name, *_ = line.split("\t")
        regions[code] = name

    rows = []
    for line in (GEO_DIR / "cities15000.txt").read_text(encoding="utf-8").splitlines():
        f = line.split("\t")
        names = {f[1].lower(), f[2].lower(), *(a.strip().lower() for a in f[3].split(",") if a.strip())}
        rows.append({
            "name": f[1],
            "region": regions.get(f"{f[8]}.{f[10]}", ""),
            "country": f[8],
            "latitude": float(f[4]),
            "longitude": float(f[5]),
            "tz": f[17],
            "population": int(f[14] or 0),
            "_names": tuple(names),  # includes alternate spellings and scripts (e.g. Devanagari)
        })
    rows.sort(key=lambda r: -r["population"])
    return tuple(rows)


def search(query: str, limit: int = 8) -> list[dict]:
    """Prefix match on any name of the place; biggest places first."""
    q = query.strip().lower()
    if len(q) < 2:
        return []
    hits = []
    for place in _places():
        if any(n.startswith(q) for n in place["_names"]):
            hits.append({k: v for k, v in place.items() if not k.startswith("_")})
            if len(hits) >= limit:
                break
    return hits


if __name__ == "__main__":
    download(force=True)
    print(f"[places] {len(_places())} places loaded from {GEO_DIR}")

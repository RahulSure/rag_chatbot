"""
Maitri (friendship) score between two sadhaks on the Ganga, 0-100, with its reasons.

From the kundli: friendship of the Moon signs' lords, the navtara between the two birth
stars and the gana. From numerology: friendship of the moolank planets and how one
Lo Shu grid fills the other's gaps. Shared practices add a little; without birth
details the score rests on practices alone. Only derived values (signs, nakshatra,
moolank, grid digits) are kept for this, never the birth date, time or place.
"""

from __future__ import annotations

from datetime import date, time

from services.astro.jyotish import SIGN_LORD
from services.astro.matching import NAKSHATRA_GANA, TARA_BAD, _tara, maitri_points
from services.astro.names import nakshatra_index, sign_index

# Graha of each number 1-9; Rahu acts like Saturn and Ketu like Mars ("Shanivat Rahu, Kujavat Ketu").
NUMBER_GRAHA = {1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Saturn", 5: "Mercury", 6: "Venus", 7: "Mars", 8: "Saturn", 9: "Mars"}


def _reduce(n: int) -> int:
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n


def derive_sky(birth_date: date, birth_time: time, tz: str, latitude: float, longitude: float) -> dict:
    """The few derived values the river needs from a birth chart."""
    from services.astro.chart import compute_chart

    chart = compute_chart(birth_date, birth_time, tz, latitude, longitude)
    moon = next(p for p in chart["planets"] if p["name"] == "Moon")["longitude"]
    digits = {int(c) for c in birth_date.strftime("%d%m%Y") if c != "0"}
    nak = nakshatra_index(moon)
    return {
        "moon_sign": sign_index(moon),
        "nakshatra": nak,
        "gana": NAKSHATRA_GANA[nak],
        "moolank": _reduce(birth_date.day),
        "loshu": sorted(digits),
    }


def _gana_points(a: str, b: str) -> float:
    if a == b:
        return 1.0
    return 0.6 if {a, b} == {"Deva", "Manushya"} else 0.2


def maitri(a: dict, b: dict) -> dict:
    """Score two river profiles. Each may carry `sky` (derived birth values) and `practices`."""
    shared = sorted(set(a.get("practices") or []) & set(b.get("practices") or []))
    reasons: list[dict] = []
    if shared:
        reasons.append({"code": "shared_practice", "items": shared})

    sa, sb = a.get("sky"), b.get("sky")
    if not (sa and sb):
        # No kundli on one side: practices and a fair middle ground.
        return {"score": min(85, 50 + 10 * len(shared)), "reasons": reasons, "by_kundli": False}

    lord_a, lord_b = SIGN_LORD[sa["moon_sign"]], SIGN_LORD[sb["moon_sign"]]
    mind = maitri_points(lord_a, lord_b) / 5
    if mind >= 0.8:
        reasons.append({"code": "moon_friends", "a": lord_a, "b": lord_b})

    taras = [_tara(sa["nakshatra"], sb["nakshatra"]), _tara(sb["nakshatra"], sa["nakshatra"])]
    stars = sum(t not in TARA_BAD for t in taras) / 2
    if stars == 1:
        reasons.append({"code": "tara_good"})

    gana = _gana_points(sa["gana"], sb["gana"])
    if sa["gana"] == sb["gana"]:
        reasons.append({"code": "same_gana", "gana": sa["gana"]})

    num_a, num_b = NUMBER_GRAHA[sa["moolank"]], NUMBER_GRAHA[sb["moolank"]]
    numbers = maitri_points(num_a, num_b) / 5
    if numbers >= 0.8:
        reasons.append({"code": "moolank_friends", "a": sa["moolank"], "b": sb["moolank"]})

    have_a, have_b = set(sa["loshu"]), set(sb["loshu"])
    missing = (set(range(1, 10)) - have_a) | (set(range(1, 10)) - have_b)
    filled = len((set(range(1, 10)) - have_a) & have_b) + len((set(range(1, 10)) - have_b) & have_a)
    grid = filled / max(1, len(set(range(1, 10)) - have_a) + len(set(range(1, 10)) - have_b))
    if missing and grid >= 0.5:
        reasons.append({"code": "loshu_complement"})

    score = 35 * mind + 25 * stars + 15 * gana + 15 * numbers + 10 * grid + min(10, 4 * len(shared))
    return {"score": int(round(min(100, score))), "reasons": reasons, "by_kundli": True}

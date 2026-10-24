"""
Vedic birth chart — sidereal zodiac, Lahiri ayanamsa, whole-sign houses.

Planet positions, nakshatra, Vimshottari dasha, panchang and sade sati come from
jyotipy (pure Python, MIT). Its positions were checked against NASA JPL DE421:
within 0.011° for the Moon and 0.002° for the planets, 1950-2026.

The ascendant is computed here instead. jyotipy 0.2.0's `ascendant_tropical`
returns the descendant — 180° off, confirmed by checking which ecliptic point is
actually rising in the east — and its whole-sign houses inherit that error, as
do its yogas, which are therefore not used.
"""

from __future__ import annotations

import math
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from services.astro.names import (
    GRAHAS_HI,
    NAKSHATRAS_HI,
    SIGNS,
    nakshatra_index,
    nakshatra_pada,
    sign_index,
)

GRAHA_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]


def _name(value) -> str:
    """jyotipy returns Graha enums in places; the API speaks plain strings."""
    return getattr(value, "value", value)


def local_to_utc(birth_date: date, birth_time: time, tz_name: str) -> tuple[datetime, float]:
    """Local civil time at the birthplace -> (UTC datetime, UTC offset in hours), using historical tz rules."""
    local = datetime.combine(birth_date, birth_time).replace(tzinfo=ZoneInfo(tz_name))
    offset = local.utcoffset() or timedelta(0)
    return local.astimezone(timezone.utc).replace(tzinfo=None), offset.total_seconds() / 3600


def _julian_day(utc: datetime) -> float:
    """Julian day of a naive UTC datetime."""
    return utc.replace(tzinfo=timezone.utc).timestamp() / 86400.0 + 2440587.5


def tropical_ascendant(utc: datetime, latitude: float, longitude: float) -> float:
    """Ecliptic longitude rising on the eastern horizon (tropical, of date)."""
    jd = _julian_day(utc)
    t = (jd - 2451545.0) / 36525
    gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t ** 3 / 38710000) % 360
    lst = math.radians((gmst + longitude) % 360)
    eps = math.radians(23.4392911 - 0.0130042 * t)
    phi = math.radians(latitude)
    return math.degrees(math.atan2(math.cos(lst), -(math.sin(lst) * math.cos(eps) + math.tan(phi) * math.sin(eps)))) % 360


def _position(longitude: float) -> dict:
    s, n = sign_index(longitude), nakshatra_index(longitude)
    return {
        "longitude": round(longitude % 360, 4),
        "sign": SIGNS[s][0],
        "sign_hi": SIGNS[s][1],
        "degree_in_sign": round(longitude % 30, 4),
        "nakshatra_index": n,
        "nakshatra_hi": NAKSHATRAS_HI[n],
        "pada": nakshatra_pada(longitude),
    }


def _retrograde(utc: datetime) -> dict[str, bool]:
    """A planet is retrograde when its longitude decreases across the moment of birth."""
    from jyotipy import ephemeris

    before = ephemeris.tropical_longitudes(ephemeris.epoch_from_datetime(utc - timedelta(hours=12), 0.0))
    after = ephemeris.tropical_longitudes(ephemeris.epoch_from_datetime(utc + timedelta(hours=12), 0.0))
    flags = {}
    for name in ("Mars", "Mercury", "Jupiter", "Venus", "Saturn"):
        a, b = before[name], after[name]
        a, b = (a["longitude"], b["longitude"]) if isinstance(a, dict) else (a, b)
        flags[name] = ((b - a + 180) % 360 - 180) < 0
    flags.update(Sun=False, Moon=False, Rahu=True, Ketu=True)  # mean nodes always move backwards
    return flags


def _period(p: dict) -> dict:
    return {"lord": _name(p["lord"]), "lord_hi": GRAHAS_HI[_name(p["lord"])],
            "start": p["start"].date().isoformat(), "end": p["end"].date().isoformat()}


def compute_chart(birth_date: date, birth_time: time, tz_name: str, latitude: float, longitude: float,
                  now: datetime | None = None) -> dict:
    from jyotipy import BirthChart, ayanamsa, ephemeris

    utc, offset = local_to_utc(birth_date, birth_time, tz_name)
    chart = BirthChart(utc, 0.0, latitude, longitude)
    summary = chart.summary()
    aya = ayanamsa.get_ayanamsa(ephemeris.epoch_from_datetime(utc, 0.0), ayanamsa.AyanamsaSystem.LAHIRI)

    asc_long = (tropical_ascendant(utc, latitude, longitude) - aya) % 360
    asc_sign = sign_index(asc_long)
    retro = _retrograde(utc)

    planets = []
    for name in GRAHA_ORDER:
        pos = _position(summary[name]["longitude"])
        planets.append({
            "name": name,
            "name_hi": GRAHAS_HI[name],
            **pos,
            "nakshatra": summary[name].get("name"),
            "house": (sign_index(pos["longitude"]) - asc_sign) % 12 + 1,
            "retrograde": retro[name],
        })

    houses = [
        {"house": h, "sign": SIGNS[(asc_sign + h - 1) % 12][0], "sign_hi": SIGNS[(asc_sign + h - 1) % 12][1],
         "planets": [p["name"] for p in planets if p["house"] == h]}
        for h in range(1, 13)
    ]

    now = now or datetime.utcnow()
    mahadashas = chart.mahadashas(cycles=2)
    current_md = next((m for m in mahadashas if m["start"] <= now < m["end"]), None)
    current_ad = None
    if current_md:
        current_ad = next((a for a in chart.antardashas(current_md) if a["start"] <= now < a["end"]), None)

    moon = next(p for p in planets if p["name"] == "Moon")
    panchang = chart.panchanga()
    return {
        "input": {"date": birth_date.isoformat(), "time": birth_time.strftime("%H:%M"), "tz": tz_name,
                  "utc_offset_hours": offset, "latitude": latitude, "longitude": longitude},
        "ayanamsa": {"system": "Lahiri", "value": round(aya, 4)},
        "ascendant": {**_position(asc_long), "nakshatra": None},
        "moon_sign": {"sign": moon["sign"], "sign_hi": moon["sign_hi"]},
        "birth_nakshatra": {"name": moon["nakshatra"], "name_hi": moon["nakshatra_hi"], "pada": moon["pada"]},
        "planets": planets,
        "houses": houses,
        "dasha": {
            "mahadasha": _period(current_md) if current_md else None,
            "antardasha": _period(current_ad) if current_ad else None,
            "sequence": [_period(m) for m in mahadashas[:9]],
        },
        "sade_sati": chart.sade_sati(now, 0.0),
        "panchang_at_birth": _plain(panchang),
    }


def _plain(value):
    """Recursively turn enums into strings so the result is JSON-serialisable."""
    if isinstance(value, dict):
        return {k: _plain(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_plain(v) for v in value]
    return _name(value)


def panchang_now(latitude: float, longitude: float, tz_name: str, when: datetime | None = None) -> dict:
    """Panchang (tithi, nakshatra, yoga, karana, vara) for a moment at a place — today by default."""
    from jyotipy import BirthChart

    local = (when or datetime.now(ZoneInfo(tz_name))).astimezone(ZoneInfo(tz_name))
    utc = local.astimezone(timezone.utc).replace(tzinfo=None)
    p = _plain(BirthChart(utc, 0.0, latitude, longitude).panchanga())
    p["vara"] = local.strftime("%A")  # civil weekday at the place, not UTC's
    p["date"] = local.date().isoformat()
    if isinstance(p.get("nakshatra"), dict) and "index" in p["nakshatra"]:
        p["nakshatra"]["name_hi"] = NAKSHATRAS_HI[p["nakshatra"]["index"]]
    return p

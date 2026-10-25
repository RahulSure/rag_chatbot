"""
Accuracy tests for the chart engine. Run from platform/:
    python -m pytest services/astro/tests -q

The JPL comparison runs only when data/ephemeris/de421.bsp is present
(downloaded by Skyfield on first use; ~17 MB, free from NASA JPL).
"""

from __future__ import annotations

import math
from datetime import date, datetime, time
from pathlib import Path

import pytest

from services.astro.chart import compute_chart, local_to_utc, tropical_ascendant
from services.astro.names import SIGNS

DE421 = Path(__file__).resolve().parents[4] / "data" / "ephemeris" / "de421.bsp"

CASES = [  # (UTC datetime, latitude, longitude)
    (datetime(1950, 3, 1, 4, 0), 28.61, 77.21),    # New Delhi
    (datetime(1969, 7, 20, 20, 17), 40.71, -74.0),  # New York
    (datetime(1985, 11, 2, 23, 45), -33.87, 151.21),  # Sydney
    (datetime(1990, 5, 15, 5, 0), 19.08, 72.88),   # Mumbai
    (datetime(2012, 8, 30, 9, 10), 51.51, -0.13),  # London
    (datetime(2026, 10, 24, 6, 0), 26.29, 73.02),  # Jodhpur
]

VIMSHOTTARI_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]


def _altitude_and_hour_angle(utc: datetime, lat: float, lon: float, ecl_lon: float) -> tuple[float, float]:
    """Altitude and hour angle (degrees) of an ecliptic point, by plain spherical astronomy."""
    jd = utc.timestamp() / 86400.0 + 2440587.5 if utc.tzinfo else (
        (utc - datetime(1970, 1, 1)).total_seconds() / 86400.0 + 2440587.5
    )
    t = (jd - 2451545.0) / 36525
    gmst = (280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360
    eps = math.radians(23.4392911 - 0.0130042 * t)
    lam = math.radians(ecl_lon)
    ra = math.atan2(math.sin(lam) * math.cos(eps), math.cos(lam))
    dec = math.asin(math.sin(lam) * math.sin(eps))
    hour_angle = math.radians((gmst + lon) % 360) - ra
    phi = math.radians(lat)
    alt = math.asin(math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.cos(hour_angle))
    return math.degrees(alt), (math.degrees(hour_angle) + 180) % 360 - 180


@pytest.mark.parametrize("utc,lat,lon", CASES)
def test_ascendant_is_on_the_eastern_horizon(utc, lat, lon):
    asc = tropical_ascendant(utc, lat, lon)
    alt, hour_angle = _altitude_and_hour_angle(utc, lat, lon, asc)
    assert abs(alt) < 0.5, f"ascendant should be on the horizon, altitude {alt:.2f}"
    assert -180 < hour_angle < 0, "negative hour angle = east of the meridian = rising (not the descendant)"


def test_houses_are_whole_sign_from_the_ascendant():
    c = compute_chart(date(1990, 5, 15), time(10, 30), "Asia/Kolkata", 28.6139, 77.2090)
    assert c["houses"][0]["sign"] == c["ascendant"]["sign"]
    asc_sign = [s for s, _ in SIGNS].index(c["ascendant"]["sign"])
    for p in c["planets"]:
        planet_sign = [s for s, _ in SIGNS].index(p["sign"])
        assert p["house"] == (planet_sign - asc_sign) % 12 + 1


def test_first_mahadasha_is_ruled_by_the_moon_nakshatra_lord():
    c = compute_chart(date(1990, 5, 15), time(10, 30), "Asia/Kolkata", 28.6139, 77.2090)
    moon = next(p for p in c["planets"] if p["name"] == "Moon")
    assert c["dasha"]["sequence"][0]["lord"] == VIMSHOTTARI_LORDS[moon["nakshatra_index"] % 9]


def test_historical_time_zone_rules_apply():
    # India kept "war time" (UTC+6:30) from September 1942 to October 1945
    _, offset = local_to_utc(date(1943, 1, 1), time(12, 0), "Asia/Kolkata")
    assert offset == 6.5
    _, offset = local_to_utc(date(1990, 5, 15), time(12, 0), "Asia/Kolkata")
    assert offset == 5.5


@pytest.mark.skipif(not DE421.exists(), reason="JPL DE421 ephemeris not downloaded")
@pytest.mark.parametrize("utc,lat,lon", CASES)
def test_planet_positions_match_nasa_jpl(utc, lat, lon):
    from jyotipy import ayanamsa, ephemeris
    from skyfield.api import Loader
    from skyfield.framelib import ecliptic_frame

    load = Loader(str(DE421.parent))
    eph, ts = load("de421.bsp"), load.timescale(builtin=True)
    t = ts.utc(utc.year, utc.month, utc.day, utc.hour, utc.minute)
    aya = ayanamsa.get_ayanamsa(ephemeris.epoch_from_datetime(utc, 0.0), ayanamsa.AyanamsaSystem.LAHIRI)

    c = compute_chart(utc.date(), utc.time(), "UTC", lat, lon, now=utc)
    targets = {"Sun": "sun", "Moon": "moon", "Mercury": "mercury", "Venus": "venus", "Mars": "mars",
               "Jupiter": "jupiter barycenter", "Saturn": "saturn barycenter"}
    for p in c["planets"]:
        if p["name"] not in targets:
            continue
        _, elon, _ = eph["earth"].at(t).observe(eph[targets[p["name"]]]).apparent().frame_latlon(ecliptic_frame)
        expected = (elon.degrees - aya) % 360
        error = abs((p["longitude"] - expected + 180) % 360 - 180)
        assert error < 0.02, f"{p['name']} off by {error:.4f} deg"

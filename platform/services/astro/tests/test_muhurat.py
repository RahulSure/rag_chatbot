"""
Tests for sunrise and the day's muhurat. Run from platform/:
    python -m pytest services/astro/tests -q

The sunrise comparison with JPL DE421 runs only when data/ephemeris/de421.bsp is present.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

from services.astro.muhurat import muhurat, muhurat_now, sun_times

DE421 = Path(__file__).resolve().parents[4] / "data" / "ephemeris" / "de421.bsp"

PLACES = [  # (name, latitude, longitude)
    ("Jodhpur", 26.26841, 73.00594),
    ("New Delhi", 28.6139, 77.209),
    ("London", 51.5074, -0.1278),
    ("Sydney", -33.8688, 151.2093),
    ("New York", 40.7128, -74.006),
    ("Tokyo", 35.6762, 139.6503),
]
DATES = [date(2026, 1, 15), date(2026, 3, 20), date(2026, 6, 21), date(2026, 10, 25)]


@pytest.mark.skipif(not DE421.exists(), reason="JPL DE421 ephemeris not downloaded")
@pytest.mark.parametrize("name,lat,lon", PLACES)
def test_sunrise_matches_jpl(name, lat, lon):
    from skyfield import almanac
    from skyfield.api import Loader, wgs84

    load = Loader(str(DE421.parent))
    eph = load("de421.bsp")
    ts = load.timescale(builtin=True)
    observer = eph["earth"] + wgs84.latlon(lat, lon)
    for on in DATES:
        rise, set_ = sun_times(on, lat, lon)
        window = ts.from_datetime(rise - timedelta(hours=3)), ts.from_datetime(rise + timedelta(hours=3))
        times, ok = almanac.find_risings(observer, eph["sun"], *window)
        assert ok.all() and len(times) == 1, (name, on)
        assert abs((times[0].utc_datetime() - rise).total_seconds()) < 30, (name, on, "sunrise")
        window = ts.from_datetime(set_ - timedelta(hours=3)), ts.from_datetime(set_ + timedelta(hours=3))
        times, ok = almanac.find_settings(observer, eph["sun"], *window)
        assert abs((times[0].utc_datetime() - set_).total_seconds()) < 30, (name, on, "sunset")


def test_sunrise_falls_on_the_local_morning():
    for name, lat, lon in PLACES:
        tz = {"Jodhpur": "Asia/Kolkata", "New Delhi": "Asia/Kolkata", "London": "Europe/London",
              "Sydney": "Australia/Sydney", "New York": "America/New_York", "Tokyo": "Asia/Tokyo"}[name]
        for on in DATES:
            rise, set_ = sun_times(on, lat, lon)
            local_rise, local_set = rise.astimezone(ZoneInfo(tz)), set_.astimezone(ZoneInfo(tz))
            assert local_rise.date() == on and 4 <= local_rise.hour <= 8, (name, on, local_rise)
            assert local_set.date() == on and 16 <= local_set.hour <= 21, (name, on, local_set)


def test_day_is_divided_evenly():
    m = muhurat(date(2026, 10, 25), 26.26841, 73.00594, "Asia/Kolkata")
    assert m["weekday"] == "Sunday"
    assert len(m["horas"]) == 24 and len(m["choghadiya"]) == 16
    # The day's first hora belongs to its weekday lord; the next day's first would be the Moon's.
    assert m["horas"][0]["lord"] == "Sun"
    assert m["horas"][0]["start"] == m["sunrise"] and m["horas"][11]["end"] == m["sunset"]
    assert m["horas"][23]["end"] == m["next_sunrise"]
    lords_after = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"]
    assert [h["lord"] for h in m["horas"][:7]] == lords_after
    # Sunday: day begins Udveg, night begins Shubh; Rahu Kaal is the last eighth of the day.
    assert m["choghadiya"][0]["name"] == "Udveg" and m["choghadiya"][7]["name"] == "Udveg"
    assert m["choghadiya"][8]["name"] == "Shubh"
    assert m["rahu_kaal"]["end"] == m["sunset"]


@pytest.mark.parametrize("weekday_date,first_day,first_night", [
    (date(2026, 10, 26), "Amrit", "Char"),   # Monday
    (date(2026, 10, 27), "Rog", "Kaal"),     # Tuesday
    (date(2026, 10, 28), "Labh", "Udveg"),   # Wednesday
    (date(2026, 10, 29), "Shubh", "Amrit"),  # Thursday
    (date(2026, 10, 30), "Char", "Rog"),     # Friday
    (date(2026, 10, 31), "Kaal", "Labh"),    # Saturday
])
def test_choghadiya_start_by_weekday(weekday_date, first_day, first_night):
    m = muhurat(weekday_date, 26.26841, 73.00594, "Asia/Kolkata")
    assert m["choghadiya"][0]["name"] == first_day
    assert m["choghadiya"][8]["name"] == first_night


def test_before_dawn_belongs_to_the_previous_day():
    tz = ZoneInfo("Asia/Kolkata")
    m = muhurat_now(26.26841, 73.00594, "Asia/Kolkata", datetime(2026, 10, 26, 4, 0, tzinfo=tz))
    assert m["date"] == "2026-10-25"
    m = muhurat_now(26.26841, 73.00594, "Asia/Kolkata", datetime(2026, 10, 26, 9, 0, tzinfo=tz))
    assert m["date"] == "2026-10-26"


def test_polar_night_is_reported():
    with pytest.raises(ValueError):
        sun_times(date(2026, 12, 21), 78.22, 15.65)  # Svalbard

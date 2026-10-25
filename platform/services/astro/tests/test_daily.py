"""Tests for navtara, the vrat calendar and the Varshaphal. Run from platform/."""

from __future__ import annotations

from datetime import date, time

from services.astro.daily import day_outlook, month_calendar, navtara_chakra, tara_of, varshaphal

JODHPUR = (26.26841, 73.00594, "Asia/Kolkata")
BIRTH = {"date": date(1990, 5, 15), "time": time(10, 30), "tz": "Asia/Kolkata", "latitude": 28.6139, "longitude": 77.209}


def test_taras_repeat_every_nine():
    assert [tara_of(0, n) for n in range(10)] == [1, 2, 3, 4, 5, 6, 7, 8, 9, 1]
    assert tara_of(20, 26) == 7  # Uttara Ashadha to Revati is Naidhana
    chakra = navtara_chakra(5)
    assert all(len(g["nakshatras"]) == 3 for g in chakra)
    assert sorted(n["index"] for g in chakra for n in g["nakshatras"]) == list(range(27))


def test_october_2026_observances():
    days = {d["date"]: d["events"] for d in month_calendar(2026, 10, *JODHPUR)["days"]}
    assert len(days) == 31
    assert "Tula Sankranti" in days["2026-10-17"]  # the Sun enters sidereal Libra on 17 October
    assert "Purnima" in days["2026-10-25"]           # Sharad Purnima
    every = [e for events in days.values() for e in events]
    assert every.count("Shukla Ekadashi") == 1 and every.count("Krishna Ekadashi") == 1
    assert every.count("Amavasya") == 1 and every.count("Purnima") == 1


def test_day_outlook_and_varshaphal():
    o = day_outlook(BIRTH, *JODHPUR, days=3)
    assert o["natal"]["nakshatra"] == "Uttara Ashadha" and o["natal"]["lagna"] == "Cancer"
    assert len(o["week"]) == 3 and all(1 <= w["moon_house"] <= 12 for w in o["week"])
    v = varshaphal(BIRTH, 2026)
    assert v["age"] == 36 and v["pravesh"].startswith("2026-05-15")
    assert v["muntha"]["sign"] == "Cancer" and 1 <= v["muntha"]["house"] <= 12

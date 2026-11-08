"""Tests for divisional charts, Jaimini karakas, Mangal dosha, Ashtakavarga and guna milan."""

from __future__ import annotations

import random

import pytest

from services.astro.jyotish import (
    BAV_TABLE, DIVISIONS, SEVEN, ashtakavarga, chara_karakas, ishta_devata, mangal_dosha,
    varga_sign, vargas, western,
)
from services.astro.matching import GANA_POINTS, NAKSHATRA_NADI, VASHYA_POINTS, YONI_POINTS, match, maitri_points

DEG = 1e-6


def _navamsa_by_rule(lon: float) -> int:
    """Parashara's wording: movable signs start from themselves, fixed from the 9th, dual from the 5th."""
    s, d = int(lon // 30), lon % 30
    start = (s, s + 8, s + 4)[s % 3]
    return (start + int(d // (10 / 3))) % 12


@pytest.mark.parametrize("lon,div,expected", [
    (0.5, 9, 0), (3.5, 9, 1), (29.9, 9, 8), (30.1, 9, 9), (60.1, 9, 6),  # Aries, Taurus, Gemini navamsas
    (10, 2, 4), (20, 2, 3), (40, 2, 3), (50, 2, 4),                       # hora: Leo / Cancer halves
    (15, 3, 4), (25, 3, 8), (45, 3, 5),                                    # drekkana: 5th and 9th
    (4, 10, 1), (30.5, 10, 9),                                             # dashamsha: even signs start from the 9th
    (3, 30, 0), (33, 30, 1), (57, 30, 7),                                  # trimshamsha
    (0.4, 60, 0), (0.6, 60, 1),                                            # shashtiamsha
])
def test_varga_examples(lon, div, expected):
    assert varga_sign(lon, div) == expected


def test_navamsa_formula_matches_the_rule():
    rng = random.Random(7)
    for _ in range(5000):
        lon = rng.uniform(0, 360)
        assert varga_sign(lon, 9) == _navamsa_by_rule(lon)


def test_every_varga_stays_in_range_and_d1_is_the_sign():
    rng = random.Random(11)
    for _ in range(2000):
        lon = rng.uniform(0, 360)
        assert varga_sign(lon, 1) == int(lon // 30)
        for div in DIVISIONS:
            assert 0 <= varga_sign(lon, div) < 12
        assert varga_sign(29.999999, 60) == 11  # the last half-degree of Aries is 59 signs on from Aries


def _random_chart(seed: int) -> tuple[dict[str, float], float]:
    rng = random.Random(seed)
    lons = {n: rng.uniform(0, 360) for n in SEVEN}
    lons["Rahu"] = rng.uniform(0, 360)
    lons["Ketu"] = (lons["Rahu"] + 180) % 360
    return lons, rng.uniform(0, 360)


def test_vargas_place_every_planet_once():
    lons, asc = _random_chart(1)
    for chart in vargas(lons, asc).values():
        placed = [p for h in chart["houses"] for p in h["planets"]]
        assert sorted(placed) == sorted(lons)


def test_karakas_rank_by_degree_in_sign():
    lons = {"Sun": 10.0, "Moon": 45.0, "Mars": 99.0, "Mercury": 121.0, "Jupiter": 200.0, "Venus": 17.5, "Saturn": 359.0}
    order = [k["planet"] for k in chara_karakas(lons)]
    # degrees within the sign: Saturn 29, Jupiter 20, Venus 17.5, Moon 15, Sun 10, Mars 9, Mercury 1
    assert order == ["Saturn", "Jupiter", "Venus", "Moon", "Sun", "Mars", "Mercury"]


def test_ishta_devata_uses_the_twelfth_from_karakamsha():
    # Saturn at 29° Pisces is the Atmakaraka; its navamsa is Pisces, so the 12th is Aquarius.
    lons = {"Sun": 10.0, "Moon": 45.0, "Mars": 99.0, "Mercury": 121.0, "Jupiter": 200.0, "Venus": 17.5,
            "Saturn": 359.0, "Rahu": 100.0, "Ketu": 280.0}
    result = ishta_devata(lons)
    assert result["atmakaraka"] == "Saturn" and result["karakamsha"] == "Pisces" and result["twelfth"] == "Aquarius"
    in_aquarius = [n for n, lon in lons.items() if varga_sign(lon, 9) == 10]
    assert result["planets_in_twelfth"] == in_aquarius
    assert result["significator"] == (in_aquarius[0] if in_aquarius else "Saturn")


def test_mangal_dosha_houses_and_cancellation():
    # Jupiter in Taurus does not aspect Libra (6th from it), so nothing cancels the first case.
    base = {"Sun": 0.0, "Moon": 5.0, "Mercury": 0.0, "Jupiter": 35.0, "Venus": 5.0, "Saturn": 0.0}
    seventh = mangal_dosha({**base, "Mars": 185.0}, ascendant=5.0)  # Libra, 7th from an Aries lagna
    assert seventh["from_lagna"] == {"house": 7, "dosha": True} and seventh["manglik"]
    assert seventh["effective"]
    third = mangal_dosha({**base, "Mars": 65.0}, ascendant=5.0)  # Gemini, 3rd: no dosha
    assert not third["manglik"] and not third["effective"]
    own = mangal_dosha({**base, "Mars": 215.0}, ascendant=5.0)  # Scorpio, 8th but in its own sign
    assert own["manglik"] and "own_sign" in own["cancellations"] and not own["effective"]


def test_ashtakavarga_totals_are_fixed():
    expected = {"Sun": 48, "Moon": 49, "Mars": 39, "Mercury": 54, "Jupiter": 56, "Venus": 52, "Saturn": 39}
    for planet, total in expected.items():
        assert sum(len(h) for h in BAV_TABLE[planet].values()) == total
    for seed in range(20):
        lons, asc = _random_chart(seed)
        av = ashtakavarga(lons, asc)
        assert {p: sum(v) for p, v in av["bav"].items()} == expected
        assert av["total"] == 337 and all(0 <= b <= 8 for v in av["bav"].values() for b in v)


def test_western_adds_the_ayanamsa():
    lons, asc = _random_chart(3)
    w = western(lons, asc, 24.1)
    sun = next(p for p in w["planets"] if p["name"] == "Sun")
    assert abs(sun["longitude"] - (lons["Sun"] + 24.1) % 360) < 1e-3
    for a in w["aspects"]:
        assert a["orb"] <= 8


def test_matching_tables_are_symmetric_where_they_should_be():
    for table in (YONI_POINTS, VASHYA_POINTS):
        assert all(table[i][j] == table[j][i] for i in range(len(table)) for j in range(len(table)))
    assert GANA_POINTS[0][0] == GANA_POINTS[1][1] == GANA_POINTS[2][2] == 6
    assert NAKSHATRA_NADI[:6] == ["Adi", "Madhya", "Antya", "Antya", "Madhya", "Adi"]
    assert maitri_points("Sun", "Moon") == 5 and maitri_points("Sun", "Venus") == 0


def test_same_nakshatra_scores_28_with_nadi_dosha():
    m = match(100.0, 100.5)  # both Moons in Pushya, Cancer
    assert m["total"] == 28
    assert m["doshas"]["nadi"]["present"] and not m["doshas"]["nadi"]["cancelled"]


def test_bhakoot_dosha_for_six_eight():
    m = match(5.0, 215.0)  # Aries and Scorpio: 6/8 from each other
    bhakoot = next(k for k in m["kootas"] if k["koota"] == "Bhakoot")
    assert bhakoot["points"] == 0 and m["doshas"]["bhakoot"]["present"]
    assert 0 <= m["total"] <= 36

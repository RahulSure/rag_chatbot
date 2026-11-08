"""
Classical calculations on a finished chart: the sixteen divisional charts
(Parashara's shodashavarga), Jaimini's chara karakas and the Ishta Devata,
Mangal dosha, Ashtakavarga, and the tropical (Western) view of the same sky.

Everything works on sidereal longitudes in degrees (0 = 0° Aries) and sign
indices (0 = Aries … 11 = Pisces).
"""

from __future__ import annotations

from services.astro.names import SIGNS, sign_index

SIGN_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
             "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"]

SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
NINE = SEVEN + ["Rahu", "Ketu"]


# ── Divisional charts ──────────────────────────────────────────────────────

def _odd(s: int) -> bool:
    return s % 2 == 0  # Aries (index 0) is the first, odd sign


def _part(d: float, n: int) -> int:
    return min(int(d // (30 / n)), n - 1)


def varga_sign(longitude: float, division: int) -> int:
    """Sign index of a sidereal longitude in the given divisional chart."""
    lon = longitude % 360
    s, d = sign_index(lon), lon % 30
    modality = s % 3  # 0 movable, 1 fixed, 2 dual
    if division == 1:
        return s
    if division == 2:  # Parashara's hora: the Sun's half is Leo, the Moon's Cancer
        first_half = d < 15
        return (4 if first_half else 3) if _odd(s) else (3 if first_half else 4)
    if division == 3:
        return (s + 4 * _part(d, 3)) % 12
    if division == 4:
        return (s + 3 * _part(d, 4)) % 12
    if division == 7:
        return (s + (0 if _odd(s) else 6) + _part(d, 7)) % 12
    if division == 9:
        return int(lon // (10 / 3)) % 12
    if division == 10:
        return (s + (0 if _odd(s) else 8) + _part(d, 10)) % 12
    if division == 12:
        return (s + _part(d, 12)) % 12
    if division == 16:
        return ((0, 4, 8)[modality] + _part(d, 16)) % 12
    if division == 20:
        return ((0, 8, 4)[modality] + _part(d, 20)) % 12
    if division == 24:
        return ((4 if _odd(s) else 3) + _part(d, 24)) % 12
    if division == 27:
        return ((0, 3, 6, 9)[s % 4] + _part(d, 27)) % 12
    if division == 30:
        if _odd(s):
            return 0 if d < 5 else 10 if d < 10 else 8 if d < 18 else 2 if d < 25 else 6
        return 1 if d < 5 else 5 if d < 12 else 11 if d < 20 else 9 if d < 25 else 7
    if division == 40:
        return ((0 if _odd(s) else 6) + _part(d, 40)) % 12
    if division == 45:
        return ((0, 4, 8)[modality] + _part(d, 45)) % 12
    if division == 60:
        return (s + _part(d, 60)) % 12
    raise ValueError(f"Unsupported division D{division}")


DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]


def vargas(longitudes: dict[str, float], ascendant: float) -> dict[str, dict]:
    """Every divisional chart as whole-sign houses from its own lagna."""
    out = {}
    for div in DIVISIONS:
        lagna = varga_sign(ascendant, div)
        signs = {name: varga_sign(lon, div) for name, lon in longitudes.items()}
        out[f"D{div}"] = {
            "lagna": SIGNS[lagna][0],
            "lagna_hi": SIGNS[lagna][1],
            "positions": {name: SIGNS[s][0] for name, s in signs.items()},
            "houses": [
                {"house": h, "sign": SIGNS[(lagna + h - 1) % 12][0], "sign_hi": SIGNS[(lagna + h - 1) % 12][1],
                 "planets": [n for n in NINE if n in signs and signs[n] == (lagna + h - 1) % 12]}
                for h in range(1, 13)
            ],
        }
    return out


# ── Jaimini: chara karakas and the Ishta Devata ───────────────────────────

KARAKAS = ["Atmakaraka", "Amatyakaraka", "Bhratrikaraka", "Matrikaraka", "Putrakaraka", "Gnatikaraka", "Darakaraka"]


def chara_karakas(longitudes: dict[str, float]) -> list[dict]:
    """The seven planets ranked by degree within their sign, highest first (the seven-karaka scheme)."""
    ranked = sorted(SEVEN, key=lambda n: longitudes[n] % 30, reverse=True)
    return [{"karaka": k, "planet": p, "degree": round(longitudes[p] % 30, 4)} for k, p in zip(KARAKAS, ranked)]


def ishta_devata(longitudes: dict[str, float]) -> dict:
    """Karakamsha is the Atmakaraka's navamsa sign; the 12th from it, in the navamsa, shows the Ishta Devata."""
    ak = chara_karakas(longitudes)[0]["planet"]
    karakamsha = varga_sign(longitudes[ak], 9)
    twelfth = (karakamsha + 11) % 12
    in_twelfth = [n for n in NINE if varga_sign(longitudes[n], 9) == twelfth]
    return {
        "atmakaraka": ak,
        "karakamsha": SIGNS[karakamsha][0],
        "karakamsha_hi": SIGNS[karakamsha][1],
        "twelfth": SIGNS[twelfth][0],
        "twelfth_hi": SIGNS[twelfth][1],
        "planets_in_twelfth": in_twelfth,
        "twelfth_lord": SIGN_LORD[twelfth],
        # Planets in the 12th decide; if it is empty, its lord does.
        "significator": in_twelfth[0] if in_twelfth else SIGN_LORD[twelfth],
    }


# ── Mangal dosha ──────────────────────────────────────────────────────────

DOSHA_HOUSES = {1, 2, 4, 7, 8, 12}


def _house_from(sign: int, reference: int) -> int:
    return (sign - reference) % 12 + 1


def mangal_dosha(longitudes: dict[str, float], ascendant: float) -> dict:
    """Mars in the 1st, 2nd, 4th, 7th, 8th or 12th from the lagna, the Moon or Venus, with the classic cancellations."""
    mars = sign_index(longitudes["Mars"])
    jupiter = sign_index(longitudes["Jupiter"])
    from_lagna = _house_from(mars, sign_index(ascendant))
    from_moon = _house_from(mars, sign_index(longitudes["Moon"]))
    from_venus = _house_from(mars, sign_index(longitudes["Venus"]))
    cancellations = []
    if mars in (0, 7):
        cancellations.append("own_sign")
    if mars == 9:
        cancellations.append("exalted")
    # Jupiter with Mars or aspecting it (Jupiter sees the 5th, 7th and 9th signs from itself).
    if _house_from(mars, jupiter) in (1, 5, 7, 9):
        cancellations.append("jupiter")
    present = from_lagna in DOSHA_HOUSES or from_moon in DOSHA_HOUSES
    return {
        "from_lagna": {"house": from_lagna, "dosha": from_lagna in DOSHA_HOUSES},
        "from_moon": {"house": from_moon, "dosha": from_moon in DOSHA_HOUSES},
        "from_venus": {"house": from_venus, "dosha": from_venus in DOSHA_HOUSES},
        "manglik": present,
        "cancellations": cancellations if present else [],
        "effective": present and not cancellations,
    }


# ── Ashtakavarga ──────────────────────────────────────────────────────────

# Houses, counted from each contributor, in which it gives a planet a benefic point (Parashara).
BAV_TABLE: dict[str, dict[str, list[int]]] = {
    "Sun": {"Sun": [1, 2, 4, 7, 8, 9, 10, 11], "Moon": [3, 6, 10, 11], "Mars": [1, 2, 4, 7, 8, 9, 10, 11],
            "Mercury": [3, 5, 6, 9, 10, 11, 12], "Jupiter": [5, 6, 9, 11], "Venus": [6, 7, 12],
            "Saturn": [1, 2, 4, 7, 8, 9, 10, 11], "Lagna": [3, 4, 6, 10, 11, 12]},
    "Moon": {"Sun": [3, 6, 7, 8, 10, 11], "Moon": [1, 3, 6, 7, 10, 11], "Mars": [2, 3, 5, 6, 9, 10, 11],
             "Mercury": [1, 3, 4, 5, 7, 8, 10, 11], "Jupiter": [1, 4, 7, 8, 10, 11, 12], "Venus": [3, 4, 5, 7, 9, 10, 11],
             "Saturn": [3, 5, 6, 11], "Lagna": [3, 6, 10, 11]},
    "Mars": {"Sun": [3, 5, 6, 10, 11], "Moon": [3, 6, 11], "Mars": [1, 2, 4, 7, 8, 10, 11],
             "Mercury": [3, 5, 6, 11], "Jupiter": [6, 10, 11, 12], "Venus": [6, 8, 11, 12],
             "Saturn": [1, 4, 7, 8, 9, 10, 11], "Lagna": [1, 3, 6, 10, 11]},
    "Mercury": {"Sun": [5, 6, 9, 11, 12], "Moon": [2, 4, 6, 8, 10, 11], "Mars": [1, 2, 4, 7, 8, 9, 10, 11],
                "Mercury": [1, 3, 5, 6, 9, 10, 11, 12], "Jupiter": [6, 8, 11, 12], "Venus": [1, 2, 3, 4, 5, 8, 9, 11],
                "Saturn": [1, 2, 4, 7, 8, 9, 10, 11], "Lagna": [1, 2, 4, 6, 8, 10, 11]},
    "Jupiter": {"Sun": [1, 2, 3, 4, 7, 8, 9, 10, 11], "Moon": [2, 5, 7, 9, 11], "Mars": [1, 2, 4, 7, 8, 10, 11],
                "Mercury": [1, 2, 4, 5, 6, 9, 10, 11], "Jupiter": [1, 2, 3, 4, 7, 8, 10, 11], "Venus": [2, 5, 6, 9, 10, 11],
                "Saturn": [3, 5, 6, 12], "Lagna": [1, 2, 4, 5, 6, 7, 9, 10, 11]},
    "Venus": {"Sun": [8, 11, 12], "Moon": [1, 2, 3, 4, 5, 8, 9, 11, 12], "Mars": [3, 5, 6, 9, 11, 12],
              "Mercury": [3, 5, 6, 9, 11], "Jupiter": [5, 8, 9, 10, 11], "Venus": [1, 2, 3, 4, 5, 8, 9, 10, 11],
              "Saturn": [3, 4, 5, 8, 9, 10, 11], "Lagna": [1, 2, 3, 4, 5, 8, 9, 11]},
    "Saturn": {"Sun": [1, 2, 4, 7, 8, 10, 11], "Moon": [3, 6, 11], "Mars": [3, 5, 6, 10, 11, 12],
               "Mercury": [6, 8, 9, 10, 11, 12], "Jupiter": [5, 6, 11, 12], "Venus": [6, 11, 12],
               "Saturn": [3, 5, 6, 11], "Lagna": [1, 3, 4, 6, 10, 11]},
}


def ashtakavarga(longitudes: dict[str, float], ascendant: float) -> dict:
    """Bhinnashtakavarga of the seven planets and the Sarvashtakavarga, by sign from Aries."""
    where = {n: sign_index(longitudes[n]) for n in SEVEN}
    where["Lagna"] = sign_index(ascendant)
    bav = {}
    for planet, rows in BAV_TABLE.items():
        bav[planet] = [sum(1 for c, houses in rows.items() if _house_from(sign, where[c]) in houses) for sign in range(12)]
    sav = [sum(bav[p][s] for p in SEVEN) for s in range(12)]
    return {"bav": bav, "sav": sav, "total": sum(sav)}


# ── The same sky in the tropical zodiac ───────────────────────────────────

ASPECTS = [("conjunction", 0, 8), ("sextile", 60, 5), ("square", 90, 7), ("trine", 120, 7), ("opposition", 180, 8)]


def western(longitudes: dict[str, float], ascendant: float, ayanamsa: float) -> dict:
    """Tropical signs (sidereal + ayanamsa) and the major aspects between the seven planets."""
    tropical = {n: (lon + ayanamsa) % 360 for n, lon in longitudes.items() if n in SEVEN}
    asc = (ascendant + ayanamsa) % 360
    aspects = []
    for i, a in enumerate(SEVEN):
        for b in SEVEN[i + 1:]:
            sep = abs((tropical[a] - tropical[b] + 180) % 360 - 180)
            for name, angle, orb in ASPECTS:
                if abs(sep - angle) <= orb:
                    aspects.append({"a": a, "b": b, "aspect": name, "orb": round(abs(sep - angle), 2)})
    return {
        "ascendant": {"longitude": round(asc, 4), "sign": SIGNS[sign_index(asc)][0], "degree_in_sign": round(asc % 30, 4)},
        "planets": [{"name": n, "longitude": round(tropical[n], 4), "sign": SIGNS[sign_index(tropical[n])][0],
                     "degree_in_sign": round(tropical[n] % 30, 4)} for n in SEVEN],
        "aspects": aspects,
    }

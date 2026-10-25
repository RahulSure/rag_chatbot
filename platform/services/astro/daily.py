"""
Readings that move with time: the day's tara and chandra bala for a person,
the Varshaphal (Tajik solar-return year), and the month's vrat calendar.
"""

from __future__ import annotations

import calendar as _calendar
from datetime import date, datetime, time, timedelta, timezone
from functools import lru_cache
from zoneinfo import ZoneInfo

from services.astro.chart import compute_chart, sidereal_longitudes
from services.astro.muhurat import sun_times
from services.astro.names import NAKSHATRAS_HI, SIGNS, nakshatra_index, sign_index

# ── Navtara and chandra bala ──────────────────────────────────────────────

TARAS = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyak", "Sadhana", "Naidhana", "Mitra", "Parama Mitra"]
TARA_QUALITY = ["mixed", "good", "avoid", "good", "avoid", "good", "avoid", "good", "good"]
# Moon's transit house from the natal Moon: good in these, hard in 4, 8 (chandrashtama) and 12.
CHANDRA_GOOD = {1, 3, 6, 7, 10, 11}
CHANDRA_HARD = {4, 8, 12}

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]


def tara_of(birth_nak: int, nak: int) -> int:
    """1-9: the tara of a nakshatra counted from the birth nakshatra."""
    return ((nak - birth_nak) % 27) % 9 + 1


def navtara_chakra(birth_nak: int) -> list[dict]:
    """The nine taras, each holding the three nakshatras that fall in it."""
    return [
        {"tara": TARAS[t], "number": t + 1, "quality": TARA_QUALITY[t],
         "nakshatras": [{"index": n, "name": NAKSHATRAS[n], "name_hi": NAKSHATRAS_HI[n]}
                        for n in range(27) if tara_of(birth_nak, n) == t + 1]}
        for t in range(9)
    ]


def _naive(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def _moon_reading(birth_nak: int, birth_moon_sign: int, moon: float) -> dict:
    n = nakshatra_index(moon)
    t = tara_of(birth_nak, n)
    house = (sign_index(moon) - birth_moon_sign) % 12 + 1
    return {
        "nakshatra": NAKSHATRAS[n], "nakshatra_hi": NAKSHATRAS_HI[n], "nakshatra_index": n,
        "moon_sign": SIGNS[sign_index(moon)][0], "moon_sign_hi": SIGNS[sign_index(moon)][1],
        "tara": TARAS[t - 1], "tara_number": t, "tara_quality": TARA_QUALITY[t - 1],
        "moon_house": house,
        "chandra": "good" if house in CHANDRA_GOOD else "hard" if house in CHANDRA_HARD else "neutral",
        "chandrashtama": house == 8,
    }


def day_outlook(birth: dict, latitude: float, longitude: float, tz_name: str, days: int = 7,
                now: datetime | None = None) -> dict:
    """Today and the coming days, read against the birth Moon: tara at each sunrise, and right now."""
    natal = compute_chart(birth["date"], birth["time"], birth["tz"], birth["latitude"], birth["longitude"], now=now)
    moon = next(p for p in natal["planets"] if p["name"] == "Moon")
    birth_nak, birth_sign = moon["nakshatra_index"], sign_index(moon["longitude"])

    tz = ZoneInfo(tz_name)
    current = (now.replace(tzinfo=timezone.utc) if now and now.tzinfo is None else now or datetime.now(timezone.utc)).astimezone(tz)
    week = []
    for i in range(days):
        on = current.date() + timedelta(days=i)
        try:
            rise, _ = sun_times(on, latitude, longitude)
        except ValueError:  # polar day or night: read the Moon at local 6 am instead
            rise = datetime.combine(on, time(6), tz)
        week.append({"date": on.isoformat(), "sunrise": rise.astimezone(tz).isoformat(),
                     **_moon_reading(birth_nak, birth_sign, sidereal_longitudes(_naive(rise))["Moon"])})

    return {
        "natal": {
            "nakshatra": NAKSHATRAS[birth_nak], "nakshatra_hi": NAKSHATRAS_HI[birth_nak], "nakshatra_index": birth_nak,
            "pada": moon["pada"], "moon_sign": moon["sign"], "moon_sign_hi": moon["sign_hi"],
            "lagna": natal["ascendant"]["sign"], "lagna_hi": natal["ascendant"]["sign_hi"],
        },
        "now": {"at": current.isoformat(), **_moon_reading(birth_nak, birth_sign, sidereal_longitudes(_naive(current))["Moon"])},
        "week": week,
        "chakra": navtara_chakra(birth_nak),
        "dasha": natal["dasha"],
        "sade_sati": natal["sade_sati"],
    }


# ── Varshaphal ────────────────────────────────────────────────────────────

MUNTHA_GOOD = {1, 2, 3, 5, 9, 10, 11}


def solar_return(natal_sun: float, around: datetime) -> datetime:
    """UTC moment near `around` when the sidereal Sun is back at its birth longitude."""
    guess = around
    for _ in range(8):
        sun = sidereal_longitudes(guess)["Sun"]
        diff = (natal_sun - sun + 180) % 360 - 180
        if abs(diff) < 1e-6:
            break
        guess += timedelta(days=diff / 0.9856)
    return guess


def varshaphal(birth: dict, year: int, latitude: float | None = None, longitude: float | None = None,
               tz_name: str | None = None) -> dict:
    """The Tajik year chart: cast for the solar return in `year`, at the given place (the birthplace by default)."""
    lat = latitude if latitude is not None else birth["latitude"]
    lon = longitude if longitude is not None else birth["longitude"]
    tz = tz_name or birth["tz"]
    natal = compute_chart(birth["date"], birth["time"], birth["tz"], birth["latitude"], birth["longitude"])
    natal_sun = next(p for p in natal["planets"] if p["name"] == "Sun")["longitude"]
    birth_utc = datetime.combine(birth["date"], birth["time"]).replace(tzinfo=ZoneInfo(birth["tz"])).astimezone(timezone.utc)
    years = year - birth["date"].year
    around = birth_utc.replace(year=year, day=min(birth_utc.day, 28) if birth_utc.month == 2 else birth_utc.day)
    moment = solar_return(natal_sun, _naive(around)).replace(tzinfo=timezone.utc).astimezone(ZoneInfo(tz))
    chart = compute_chart(moment.date(), moment.time().replace(microsecond=0), tz, lat, lon)

    natal_lagna = sign_index(natal["ascendant"]["longitude"])
    varsha_lagna = sign_index(chart["ascendant"]["longitude"])
    muntha = (natal_lagna + years) % 12
    muntha_house = (muntha - varsha_lagna) % 12 + 1
    return {
        "year": year,
        "age": years,
        "pravesh": moment.isoformat(),
        "place": {"latitude": lat, "longitude": lon, "tz": tz},
        "varsha_lagna": {"sign": SIGNS[varsha_lagna][0], "sign_hi": SIGNS[varsha_lagna][1]},
        "muntha": {"sign": SIGNS[muntha][0], "sign_hi": SIGNS[muntha][1], "house": muntha_house,
                   "favourable": muntha_house in MUNTHA_GOOD},
        "chart": {k: chart[k] for k in ("ascendant", "planets", "houses", "moon_sign", "birth_nakshatra")},
    }


# ── The month's vrat calendar ─────────────────────────────────────────────

SANKRANTI = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
             "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]


def _tithi(sun: float, moon: float) -> int:
    return int(((moon - sun) % 360) // 12) + 1  # 1-30: 1-15 Shukla, 16-30 Krishna (30 = Amavasya)


def _elongation(sun: float, moon: float) -> float:
    return (moon - sun) % 360


def _between(prev: int, cur: int) -> list[int]:
    """Tithis that began after one sunrise and ended before the next (kshaya tithis)."""
    steps = (cur - prev) % 30
    return [(prev + k - 1) % 30 + 1 for k in range(1, steps)]


@lru_cache(maxsize=64)
def month_calendar(year: int, month: int, latitude: float, longitude: float, tz_name: str) -> dict:
    """Each day's tithi at sunrise, and the monthly observances that fall on it."""
    tz = ZoneInfo(tz_name)
    first = date(year, month, 1)
    n_days = _calendar.monthrange(year, month)[1]
    # Read one day before and after the month so the first and last days can be judged too.
    dates = [first + timedelta(days=i) for i in range(-1, n_days + 1)]
    rows = []
    for on in dates:
        rise, set_ = sun_times(on, latitude, longitude)
        at_rise, at_set = sidereal_longitudes(_naive(rise)), sidereal_longitudes(_naive(set_))
        rows.append({"date": on, "rise": rise, "set": set_, "sun_rise": at_rise["Sun"], "moon_rise": at_rise["Moon"],
                     "sun_set": at_set["Sun"], "moon_set": at_set["Moon"]})

    def midway(a: float, b: float, frac: float) -> float:
        return (a + ((b - a) % 360) * frac) % 360

    days = []
    for i in range(1, len(rows) - 1):
        prev, row, nxt = rows[i - 1], rows[i], rows[i + 1]
        t_prev = _tithi(prev["sun_rise"], prev["moon_rise"])
        t_rise = _tithi(row["sun_rise"], row["moon_rise"])
        t_next = _tithi(nxt["sun_rise"], nxt["moon_rise"])
        t_set = _tithi(row["sun_set"], row["moon_set"])
        t_set_prev = _tithi(prev["sun_set"], prev["moon_set"])
        e_rise, e_set = _elongation(row["sun_rise"], row["moon_rise"]), _elongation(row["sun_set"], row["moon_set"])
        e_next = _elongation(nxt["sun_rise"], nxt["moon_rise"])
        t_noon = int(midway(e_rise, e_set, 0.5) // 12) + 1
        t_midnight = int(midway(e_set, e_next, 0.5) // 12) + 1

        events = []

        def sunrise_rule(target: int, name: str) -> None:
            # Observed on the day the tithi holds at sunrise; a tithi that never meets a sunrise belongs to the day it ran in.
            if (t_rise == target and t_prev != target) or target in _between(t_rise, t_next):
                events.append(name)

        for target, name in ((11, "Shukla Ekadashi"), (26, "Krishna Ekadashi"), (30, "Amavasya")):
            sunrise_rule(target, name)
        # Pradosh is kept at dusk, and the Purnima fast on the evening the full Moon rises in its tithi.
        for target, name in ((13, "Shukla Pradosh"), (28, "Krishna Pradosh"), (15, "Purnima")):
            if t_set == target and t_set_prev != target:
                events.append(name)
        if t_midnight == 29:
            events.append("Masik Shivaratri")
        if t_noon == 4:
            events.append("Vinayaka Chaturthi")
        sign_today, sign_next = sign_index(row["sun_rise"]), sign_index(nxt["sun_rise"])
        if sign_today != sign_next:
            events.append(f"{SANKRANTI[sign_next]} Sankranti")

        days.append({
            "date": row["date"].isoformat(),
            "weekday": row["date"].strftime("%A"),
            "sunrise": row["rise"].astimezone(tz).isoformat(),
            "tithi": t_rise,
            "paksha": "Shukla" if t_rise <= 15 else "Krishna",
            "nakshatra": NAKSHATRAS[nakshatra_index(row["moon_rise"])],
            "nakshatra_hi": NAKSHATRAS_HI[nakshatra_index(row["moon_rise"])],
            # 0 = new moon, 0.5 = full moon: for drawing the phase
            "phase": round(e_rise / 360, 4),
            "events": events,
        })
    return {"year": year, "month": month, "tz": tz_name, "days": days}

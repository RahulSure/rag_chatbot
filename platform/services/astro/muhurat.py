"""
Sunrise and sunset, and the day's muhurat: hora, choghadiya, Rahu Kaal,
Yamaganda, Gulika, Abhijit and Brahma muhurta.

Sunrise uses the NOAA solar equations (centre of the Sun 0.833° below the
horizon: refraction plus the Sun's radius), good to about a minute; the tests
check it against JPL DE421. The Vedic day runs from sunrise to the next
sunrise, so before dawn the night of the previous day is still running.
"""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

WEEKDAY_LORD = {
    "Sunday": "Sun", "Monday": "Moon", "Tuesday": "Mars", "Wednesday": "Mercury",
    "Thursday": "Jupiter", "Friday": "Venus", "Saturday": "Saturn",
}

# Each hora is ruled by the next planet in this order (slowest to fastest).
HORA_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]

# Choghadiya follow these cycles by day and by night; each name belongs to a planet.
CHOGHADIYA_DAY = ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"]
CHOGHADIYA_NIGHT = ["Shubh", "Amrit", "Char", "Rog", "Kaal", "Labh", "Udveg"]
CHOGHADIYA_LORD = {
    "Udveg": "Sun", "Char": "Venus", "Labh": "Mercury", "Amrit": "Moon",
    "Kaal": "Saturn", "Shubh": "Jupiter", "Rog": "Mars",
}
CHOGHADIYA_QUALITY = {
    "Amrit": "best", "Shubh": "good", "Labh": "good", "Char": "neutral",
    "Udveg": "avoid", "Kaal": "avoid", "Rog": "avoid",
}
# The day begins with the weekday lord's choghadiya; the night with that of the weekday four days on.
CHOGHADIYA_DAY_START = {
    "Sunday": "Udveg", "Monday": "Amrit", "Tuesday": "Rog", "Wednesday": "Labh",
    "Thursday": "Shubh", "Friday": "Char", "Saturday": "Kaal",
}
CHOGHADIYA_NIGHT_START = {
    "Sunday": "Shubh", "Monday": "Char", "Tuesday": "Kaal", "Wednesday": "Udveg",
    "Thursday": "Amrit", "Friday": "Rog", "Saturday": "Labh",
}

# Which eighth of the daytime each inauspicious period occupies (1 = first).
RAHU_KAAL_PART = {"Monday": 2, "Saturday": 3, "Friday": 4, "Wednesday": 5, "Thursday": 6, "Tuesday": 7, "Sunday": 8}
YAMAGANDA_PART = {"Sunday": 5, "Monday": 4, "Tuesday": 3, "Wednesday": 2, "Thursday": 1, "Friday": 7, "Saturday": 6}
GULIKA_PART = {"Sunday": 7, "Monday": 6, "Tuesday": 5, "Wednesday": 4, "Thursday": 3, "Friday": 2, "Saturday": 1}

SUN_ALTITUDE = -0.833


def _solar(jd: float) -> tuple[float, float]:
    """Solar declination (radians) and equation of time (minutes) at a Julian Day."""
    t = (jd - 2451545.0) / 36525
    l0 = math.radians((280.46646 + t * (36000.76983 + t * 0.0003032)) % 360)
    m = math.radians(357.52911 + t * (35999.05029 - 0.0001537 * t))
    e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
    c = (math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t))
         + math.sin(2 * m) * (0.019993 - 0.000101 * t) + math.sin(3 * m) * 0.000289)
    omega = math.radians(125.04 - 1934.136 * t)
    lam = math.radians(math.degrees(l0) + c - 0.00569 - 0.00478 * math.sin(omega))
    eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
    eps = math.radians(eps0 + 0.00256 * math.cos(omega))
    decl = math.asin(math.sin(eps) * math.sin(lam))
    y = math.tan(eps / 2) ** 2
    eq = 4 * math.degrees(
        y * math.sin(2 * l0) - 2 * e * math.sin(m) + 4 * e * y * math.sin(m) * math.cos(2 * l0)
        - 0.5 * y * y * math.sin(4 * l0) - 1.25 * e * e * math.sin(2 * m)
    )
    return decl, eq


def _event(on: date, latitude: float, longitude: float, rising: bool) -> datetime | None:
    """UTC time of sunrise or sunset on a civil date at a place; None in polar day or night."""
    midnight = datetime(on.year, on.month, on.day, tzinfo=timezone.utc)
    jd0 = (midnight - datetime(2000, 1, 1, 12, tzinfo=timezone.utc)).total_seconds() / 86400 + 2451545.0
    minutes = 720 - 4 * longitude  # first guess: local solar noon
    for _ in range(3):  # refine with the Sun's position at the estimated moment
        decl, eq = _solar(jd0 + minutes / 1440)
        lat = math.radians(latitude)
        cos_h = (math.cos(math.radians(90 - SUN_ALTITUDE)) / (math.cos(lat) * math.cos(decl))
                 - math.tan(lat) * math.tan(decl))
        if not -1 <= cos_h <= 1:
            return None
        h = math.degrees(math.acos(cos_h))
        minutes = 720 - 4 * (longitude + (h if rising else -h)) - eq
    return midnight + timedelta(minutes=minutes)


def sun_times(on: date, latitude: float, longitude: float) -> tuple[datetime, datetime]:
    """(sunrise, sunset) in UTC for a civil date. Raises ValueError where the Sun does not rise or set."""
    rise = _event(on, latitude, longitude, rising=True)
    set_ = _event(on, latitude, longitude, rising=False)
    if rise is None or set_ is None:
        raise ValueError("The Sun does not rise and set at this place on this date.")
    return rise, set_


def _span(start: datetime, length: timedelta, part: int, parts: int, tz: ZoneInfo) -> dict:
    """The part-th of `parts` equal slices of a span (1-based)."""
    s = start + length * (part - 1) / parts
    return {"start": s.astimezone(tz).isoformat(), "end": (s + length / parts).astimezone(tz).isoformat()}


def muhurat(on: date, latitude: float, longitude: float, tz_name: str) -> dict:
    """Every period of the Vedic day that begins at sunrise on the civil date `on`."""
    tz = ZoneInfo(tz_name)
    sunrise, sunset = sun_times(on, latitude, longitude)
    next_sunrise, _ = sun_times(on + timedelta(days=1), latitude, longitude)
    weekday = WEEKDAYS[on.weekday()]
    day, night = sunset - sunrise, next_sunrise - sunset

    horas = []
    lord = HORA_ORDER.index(WEEKDAY_LORD[weekday])
    for i in range(24):
        is_day = i < 12
        span = _span(sunrise if is_day else sunset, day if is_day else night, i % 12 + 1, 12, tz)
        horas.append({**span, "lord": HORA_ORDER[(lord + i) % 7], "day": is_day})

    choghadiya = []
    for is_day, cycle, first, base, length in (
        (True, CHOGHADIYA_DAY, CHOGHADIYA_DAY_START[weekday], sunrise, day),
        (False, CHOGHADIYA_NIGHT, CHOGHADIYA_NIGHT_START[weekday], sunset, night),
    ):
        k = cycle.index(first)
        for i in range(8):
            name = cycle[(k + i) % 7]
            choghadiya.append({**_span(base, length, i + 1, 8, tz), "name": name,
                               "lord": CHOGHADIYA_LORD[name], "quality": CHOGHADIYA_QUALITY[name], "day": is_day})

    night_muhurta = night / 15
    return {
        "date": on.isoformat(),
        "weekday": weekday,
        "weekday_lord": WEEKDAY_LORD[weekday],
        "tz": tz_name,
        "sunrise": sunrise.astimezone(tz).isoformat(),
        "sunset": sunset.astimezone(tz).isoformat(),
        "next_sunrise": next_sunrise.astimezone(tz).isoformat(),
        # Two muhurtas (each a fifteenth of the night) before sunrise.
        "brahma_muhurta": {"start": (next_sunrise - 2 * night_muhurta).astimezone(tz).isoformat(),
                           "end": (next_sunrise - night_muhurta).astimezone(tz).isoformat()},
        # The eighth of the fifteen muhurtas of the day, around local noon.
        "abhijit": _span(sunrise, day, 8, 15, tz),
        "rahu_kaal": _span(sunrise, day, RAHU_KAAL_PART[weekday], 8, tz),
        "yamaganda": _span(sunrise, day, YAMAGANDA_PART[weekday], 8, tz),
        "gulika": _span(sunrise, day, GULIKA_PART[weekday], 8, tz),
        "horas": horas,
        "choghadiya": choghadiya,
    }


def muhurat_now(latitude: float, longitude: float, tz_name: str, when: datetime | None = None) -> dict:
    """Muhurat of the Vedic day running now: before sunrise that is still yesterday's day."""
    tz = ZoneInfo(tz_name)
    now = (when or datetime.now(tz)).astimezone(tz)
    today = now.date()
    sunrise, _ = sun_times(today, latitude, longitude)
    on = today - timedelta(days=1) if now < sunrise.astimezone(tz) else today
    return muhurat(on, latitude, longitude, tz_name)

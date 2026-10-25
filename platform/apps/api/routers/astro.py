"""
Astrology router — birth chart, today's panchang and birthplace lookup.

Stateless: birth details arrive with each request and are not stored (there are
no user accounts yet), so no personal data is kept on the server.
"""

from __future__ import annotations

import threading
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException, Query

from packages.shared.schemas import BirthDetails, DayRequest, MatchRequest, VarshaphalRequest
from services.astro import places
from services.astro.chart import compute_chart, panchang_now
from services.astro.daily import day_outlook, month_calendar, varshaphal
from services.astro.matching import match
from services.astro.muhurat import muhurat_now

router = APIRouter(prefix="/astro", tags=["Astrology"])

# Parsing ~30k places takes a few seconds; do it in the background at startup
# so the first birthplace search is instant.
threading.Thread(target=places._places, daemon=True).start()


def _zone(tz: str) -> str:
    try:
        ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(status_code=422, detail=f"Unknown time zone: {tz}")
    return tz


@router.get("/places")
def find_places(q: str = Query(..., min_length=2, max_length=80), limit: int = Query(8, ge=1, le=20)):
    """Birthplace suggestions (GeoNames, CC BY 4.0) with coordinates and time zone."""
    return places.search(q, limit)


@router.post("/chart")
def birth_chart(req: BirthDetails):
    """Sidereal (Lahiri) birth chart: ascendant, planets, houses, nakshatra, dasha, sade sati."""
    chart = compute_chart(req.date, req.time, _zone(req.tz), req.latitude, req.longitude)
    chart["input"]["place"] = req.place
    return chart


@router.get("/panchang")
def panchang(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    tz: str = Query("Asia/Kolkata"),
):
    """Today's panchang (tithi, nakshatra, yoga, karana, vara) at a place."""
    return panchang_now(lat, lon, _zone(tz))


@router.get("/muhurat")
def muhurat(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    tz: str = Query("Asia/Kolkata"),
):
    """The Vedic day running now at a place: sunrise, hora, choghadiya, Rahu Kaal and the good muhurtas."""
    try:
        return muhurat_now(lat, lon, _zone(tz))
    except ValueError as e:  # polar day or night
        raise HTTPException(status_code=422, detail=str(e))


def _person(b: BirthDetails) -> dict:
    return {"date": b.date, "time": b.time, "tz": _zone(b.tz), "latitude": b.latitude, "longitude": b.longitude}


def _summary(chart: dict) -> dict:
    return {k: chart[k] for k in ("ascendant", "moon_sign", "birth_nakshatra", "mangal_dosha")}


@router.post("/match")
def kundli_match(req: MatchRequest):
    """Ashtakoot guna milan (out of 36) and Mangal dosha of both partners."""
    charts = [compute_chart(p.date, p.time, _zone(p.tz), p.latitude, p.longitude) for p in (req.groom, req.bride)]
    moons = [next(x for x in c["planets"] if x["name"] == "Moon")["longitude"] for c in charts]
    result = match(*moons)
    manglik = [c["mangal_dosha"]["effective"] for c in charts]
    result["mangal"] = {
        "groom": charts[0]["mangal_dosha"], "bride": charts[1]["mangal_dosha"],
        # When both partners carry the dosha it is traditionally held to cancel out.
        "balanced": manglik[0] == manglik[1],
    }
    result["groom"], result["bride"] = _summary(charts[0]), _summary(charts[1])
    return result


@router.post("/day")
def my_day(req: DayRequest):
    """The coming week read against the birth Moon: tara, chandra bala, chandrashtama, plus the navtara chakra."""
    lat = req.latitude if req.latitude is not None else req.birth.latitude
    lon = req.longitude if req.longitude is not None else req.birth.longitude
    return day_outlook(_person(req.birth), lat, lon, _zone(req.tz or req.birth.tz))


@router.post("/varshaphal")
def year_chart(req: VarshaphalRequest):
    """Tajik Varshaphal: the solar-return chart for a year, with its lagna and muntha."""
    return varshaphal(_person(req.birth), req.year, req.latitude, req.longitude, _zone(req.tz) if req.tz else None)


@router.get("/calendar")
def vrat_calendar(
    year: int = Query(..., ge=1900, le=2100),
    month: int = Query(..., ge=1, le=12),
    lat: float = Query(..., ge=-66, le=66),
    lon: float = Query(..., ge=-180, le=180),
    tz: str = Query("Asia/Kolkata"),
):
    """The month's tithis at sunrise and its observances: Ekadashi, Pradosh, Purnima, Amavasya, Shivaratri, Chaturthi, Sankranti."""
    return month_calendar(year, month, round(lat, 2), round(lon, 2), _zone(tz))

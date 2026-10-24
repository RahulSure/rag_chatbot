"""
Astrology router — birth chart, today's panchang and birthplace lookup.

Stateless: birth details arrive with each request and are not stored (there are
no user accounts yet), so no personal data is kept on the server.
"""

from __future__ import annotations

import threading
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException, Query

from packages.shared.schemas import BirthDetails
from services.astro import places
from services.astro.chart import compute_chart, panchang_now

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

from fastapi import APIRouter, Query
from app.services.weather import fetch_weather

router = APIRouter()


@router.get("")
async def current_weather(
    lat: float = Query(...),
    lng: float = Query(...),
):
    data = await fetch_weather(lat, lng)
    if data is None:
        return {"error": "weather unavailable"}
    return data

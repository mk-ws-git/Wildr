import httpx
from app.core.config import settings

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


async def fetch_weather(lat: float, lng: float) -> dict | None:
    if not settings.OPENWEATHER_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(OPENWEATHER_URL, params={
                "lat": lat,
                "lon": lng,
                "appid": settings.OPENWEATHER_API_KEY,
                "units": "metric",
            })
            if r.status_code != 200:
                return None
            d = r.json()
            return {
                "temp_c": round(d["main"]["temp"], 1),
                "feels_like_c": round(d["main"]["feels_like"], 1),
                "temp_min_c": round(d["main"]["temp_min"], 1),
                "temp_max_c": round(d["main"]["temp_max"], 1),
                "humidity": d["main"]["humidity"],
                "pressure_hpa": d["main"]["pressure"],
                "description": d["weather"][0]["description"].capitalize(),
                "icon_code": d["weather"][0]["icon"],
                "wind_kph": round(d["wind"]["speed"] * 3.6, 1),
                "wind_gust_kph": round(d["wind"].get("gust", 0) * 3.6, 1),
                "wind_deg": d["wind"].get("deg"),
                "cloud_cover_pct": d["clouds"]["all"],
                "visibility_m": d.get("visibility"),
                "rain_1h_mm": d.get("rain", {}).get("1h"),
                "snow_1h_mm": d.get("snow", {}).get("1h"),
                "sunrise": d["sys"]["sunrise"],
                "sunset": d["sys"]["sunset"],
            }
    except Exception:
        return None

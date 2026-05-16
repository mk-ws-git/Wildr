import asyncio
from datetime import date
import httpx
from fastapi import APIRouter, Depends, Query
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()

UNSPLASH_RANDOM_URL = "https://api.unsplash.com/photos/random"

NATURE_QUERIES = [
    "wildlife nature forest",
    "wildflowers meadow",
    "bird nature wildlife",
    "woodland nature uk",
    "coastal wildlife seabird",
    "hedgehog fox nature",
    "butterfly insect nature",
]

FALLBACK_PHOTOS = [
    {
        "photo_url": "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1600&q=80",
        "description": "Red fox in morning light",
        "photographer": "Ray Hennessy",
        "photographer_url": "https://unsplash.com/@rayhennessy",
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1466921583968-f07aa80c526e?w=1600&q=80",
        "description": "Misty forest at dawn",
        "photographer": "Casey Horner",
        "photographer_url": "https://unsplash.com/@mischievous_penguins",
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1600&q=80",
        "description": "Barn owl in flight",
        "photographer": "Chris Rhoads",
        "photographer_url": "https://unsplash.com/@chrisrhoads",
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=1600&q=80",
        "description": "Deer in woodland",
        "photographer": "Vincent van Zalinge",
        "photographer_url": "https://unsplash.com/@vincentvanzalinge",
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1516934024742-b461fba47600?w=1600&q=80",
        "description": "Wildflower meadow in summer",
        "photographer": "Yoksel Zok",
        "photographer_url": "https://unsplash.com/@yoksel",
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1497206365907-f5e630693df0?w=1600&q=80",
        "description": "Kingfisher on branch",
        "photographer": "David Clode",
        "photographer_url": "https://unsplash.com/@davidclode",
    },
    {
        "photo_url": "https://images.unsplash.com/photo-1490750967868-88df5691cc0a?w=1600&q=80",
        "description": "Hedgehog in garden leaves",
        "photographer": "Piotr Łaskawski",
        "photographer_url": "https://unsplash.com/@piotrl",
    },
]


async def _trigger_download(download_location: str) -> None:
    """Notify Unsplash that this photo was used — required by their API guidelines."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.get(
                download_location,
                headers={"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"},
            )
    except Exception:
        pass


async def _fetch_unsplash_photo(query: str) -> dict | None:
    if not settings.UNSPLASH_ACCESS_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(
                UNSPLASH_RANDOM_URL,
                params={"query": query, "orientation": "landscape", "content_filter": "high"},
                headers={"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"},
            )
        if r.status_code != 200:
            return None
        data = r.json()
        photo_url = data.get("urls", {}).get("regular", "")
        if not photo_url:
            return None

        download_location = data.get("links", {}).get("download_location", "")
        if download_location:
            asyncio.create_task(_trigger_download(download_location))

        user = data.get("user", {})
        return {
            "photo_url": photo_url,
            "description": data.get("alt_description") or data.get("description") or "",
            "photographer": user.get("name", ""),
            "photographer_url": f"https://unsplash.com/@{user.get('username', '')}",
            "source": "unsplash",
        }
    except Exception:
        return None


PAGE_QUERIES = {
    "splash":   "misty valley landscape panoramic wide",
    "login":    "open meadow landscape golden hour wide",
    "register": "serene lake reflection landscape wide",
    "forgot":   "foggy mountain landscape wide panoramic",
    "reset":    "sunrise hills landscape minimalist wide",
}

# Per-page, per-day cache
_auth_panel_cache: dict = {}


@router.get("/auth-panel")
async def auth_panel_photo(page: str = "default"):
    global _auth_panel_cache
    today = date.today()
    cache_key = f"{today}_{page}"
    if cache_key in _auth_panel_cache:
        return _auth_panel_cache[cache_key]

    query = PAGE_QUERIES.get(page, "nature wildlife forest")
    seed_idx = abs(hash(page + str(today.toordinal()))) % len(FALLBACK_PHOTOS)

    photo = await _fetch_unsplash_photo(query)
    if not photo:
        photo = {**FALLBACK_PHOTOS[seed_idx], "source": "unsplash"}

    _auth_panel_cache[cache_key] = photo
    return photo


@router.get("/daily")
async def daily_photo(
    lat: float = Query(...),
    lng: float = Query(...),
    _: User = Depends(get_current_user),
):
    day_seed = date.today().toordinal()
    query = NATURE_QUERIES[day_seed % len(NATURE_QUERIES)]

    photo = await _fetch_unsplash_photo(query)
    if photo:
        return photo

    fallback = FALLBACK_PHOTOS[day_seed % len(FALLBACK_PHOTOS)]
    return {**fallback, "source": "unsplash"}

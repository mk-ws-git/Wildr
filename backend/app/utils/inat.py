import httpx
from app.core.config import settings

INAT_VISION_URL = "https://api.inaturalist.org/v1/computervision/score_image"
INAT_TAXA_URL = "https://api.inaturalist.org/v1/taxa"


async def identify_photo(image_bytes: bytes) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            INAT_VISION_URL,
            files={"image": ("photo.jpg", image_bytes, "image/jpeg")},
            headers={"Authorization": f"Bearer {settings.INAT_API_TOKEN}"},
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for result in data.get("results", []):
        taxon = result.get("taxon", {})
        raw_score = result.get("combined_score", 0)
        results.append({
            "common_name": taxon.get("preferred_common_name", ""),
            "scientific_name": taxon.get("name", ""),
            "score": round(raw_score / 100, 4),
            "taxon_id": taxon.get("id"),
            "iconic_taxon": taxon.get("iconic_taxon_name", ""),
        })

    return results


async def get_taxon_photos(scientific_name: str, taxon_id: int | None = None) -> list[str]:
    """
    Return up to 6 iNaturalist taxon photo URLs for a species.
    Uses taxon_id if available (faster), falls back to name search.
    Returns an empty list if nothing is found.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if taxon_id:
                resp = await client.get(
                    f"{INAT_TAXA_URL}/{taxon_id}",
                    headers={"User-Agent": "Wildr/1.0"},
                )
            else:
                resp = await client.get(
                    INAT_TAXA_URL,
                    params={"q": scientific_name, "per_page": 1, "rank": "species"},
                    headers={"User-Agent": "Wildr/1.0"},
                )
            if resp.status_code != 200:
                return []
            data = resp.json()
            # Direct taxon lookup returns a single object under "results" list
            results = data.get("results", [])
            if not results:
                return []
            taxon = results[0]
            photos = []
            # taxon_photos array (richer, multiple images)
            for tp in taxon.get("taxon_photos", [])[:6]:
                url = tp.get("photo", {}).get("medium_url") or tp.get("photo", {}).get("url")
                if url:
                    photos.append(url)
            # Fall back to default_photo if taxon_photos is empty
            if not photos:
                default = taxon.get("default_photo", {})
                url = default.get("medium_url") or default.get("url")
                if url:
                    photos.append(url)
            return photos
    except Exception:
        return []
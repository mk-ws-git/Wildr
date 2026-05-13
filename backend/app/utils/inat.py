import httpx

INAT_VISION_URL = "https://api.inaturalist.org/v2/computervision/score_image"


async def identify_photo(image_bytes: bytes) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            INAT_VISION_URL,
            files={"image": ("photo.jpg", image_bytes, "image/jpeg")},
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for result in data.get("results", []):
        taxon = result.get("taxon", {})
        results.append({
            "common_name": taxon.get("preferred_common_name", ""),
            "scientific_name": taxon.get("name", ""),
            "score": result.get("combined_score", 0),
            "taxon_id": taxon.get("id"),
            "iconic_taxon": taxon.get("iconic_taxon_name", ""),
        })

    return results
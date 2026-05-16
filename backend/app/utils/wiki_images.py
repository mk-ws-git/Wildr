"""
Fetch place images from Wikipedia / Wikimedia Commons.
No API key required.
Returns a list of direct image URLs (JPEG/PNG), up to max_images.
"""

import httpx

_HEADERS = {"User-Agent": "Wildr/1.0 (nature app; contact@wildr.app)"}


async def get_place_images(name: str, max_images: int = 6) -> list[str]:
    """
    Try Wikipedia article images first, then a direct Wikimedia Commons search.
    Returns list of direct image URLs, empty list on failure.
    """
    if not name:
        return []

    images = await _wiki_article_images(name, max_images)
    if images:
        return images

    # Fallback: search Commons directly
    return await _commons_search_images(name, max_images)


async def _wiki_article_images(name: str, max_images: int) -> list[str]:
    """
    Get images from the Wikipedia article for this place name.
    Uses the pageimages + images prop to find the lead photo + gallery.
    """
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            # Step 1: find the article title via search
            search_resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": name,
                    "srlimit": 3,
                    "format": "json",
                },
                headers=_HEADERS,
            )
            if search_resp.status_code != 200:
                return []
            results = search_resp.json().get("query", {}).get("search", [])
            if not results:
                return []
            title = results[0]["title"]

            # Step 2: get images listed in the article
            img_resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "titles": title,
                    "prop": "images|pageimages",
                    "imlimit": "20",
                    "pithumbsize": "800",
                    "format": "json",
                },
                headers=_HEADERS,
            )
            if img_resp.status_code != 200:
                return []
            pages = img_resp.json().get("query", {}).get("pages", {})
            page = next(iter(pages.values()), {})

            image_titles = []
            # Lead image (pageimages prop)
            lead = page.get("thumbnail", {}).get("source")
            if lead:
                return [lead]  # Fast path: lead image is already a direct URL

            # Fall back to images list
            for img in page.get("images", []):
                fname = img.get("title", "")
                if any(fname.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp")):
                    if not any(skip in fname.lower() for skip in ("icon", "logo", "flag", "symbol", "map", "locator", "blank", "red_dot")):
                        image_titles.append(fname)
                if len(image_titles) >= max_images:
                    break

            if not image_titles:
                return []

            # Step 3: resolve image titles to direct URLs
            return await _resolve_image_urls(image_titles, max_images)
    except Exception:
        return []


async def _resolve_image_urls(titles: list[str], max_images: int) -> list[str]:
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "titles": "|".join(titles[:max_images]),
                    "prop": "imageinfo",
                    "iiprop": "url",
                    "iiurlwidth": "800",
                    "format": "json",
                },
                headers=_HEADERS,
            )
            if resp.status_code != 200:
                return []
            pages = resp.json().get("query", {}).get("pages", {})
            urls = []
            for page in pages.values():
                for ii in page.get("imageinfo", []):
                    url = ii.get("thumburl") or ii.get("url")
                    if url:
                        urls.append(url)
            return urls[:max_images]
    except Exception:
        return []


async def _commons_search_images(query: str, max_images: int) -> list[str]:
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "generator": "search",
                    "gsrnamespace": "6",  # File namespace
                    "gsrsearch": f"{query} nature",
                    "gsrlimit": str(max_images),
                    "prop": "imageinfo",
                    "iiprop": "url",
                    "iiurlwidth": "800",
                    "format": "json",
                },
                headers=_HEADERS,
            )
            if resp.status_code != 200:
                return []
            pages = resp.json().get("query", {}).get("pages", {})
            urls = []
            for page in pages.values():
                for ii in page.get("imageinfo", []):
                    url = ii.get("thumburl") or ii.get("url")
                    if url and any(url.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png")):
                        urls.append(url)
            return urls[:max_images]
    except Exception:
        return []

"""
Wikipedia summary fetcher with Claude verification and fallback.

Strategy:
1. Search Wikipedia with disambiguated query (name + place_type) to avoid
   wrong-article matches (e.g. "Plötzensee" returning the prison, not the lake).
2. Quick Claude sanity-check: does the returned extract actually describe
   something matching the place type? If not, try Claude-generated text.
3. Final fallback: Claude writes a description from scratch.

No API key required for Wikipedia.
"""

import httpx
from anthropic import AsyncAnthropic

_claude = AsyncAnthropic()

# Map OSM/Wildr place types to natural-language search hints
_TYPE_HINTS = {
    "lake": "lake",
    "river": "river",
    "pond": "pond",
    "reservoir": "reservoir",
    "park": "park nature",
    "nature_reserve": "nature reserve",
    "forest": "forest",
    "wood": "woodland forest",
    "heath": "heath nature",
    "meadow": "meadow nature",
    "wetland": "wetland nature",
    "garden": "garden park",
    "beach": "beach",
    "bay": "bay",
}


async def get_place_summary(name: str | None, place_type: str | None) -> tuple[str | None, str]:
    """
    Returns (summary_text, source) where source is 'wikipedia' or 'claude'.
    Returns (None, 'none') if name is missing and Claude also fails.
    """
    if not name:
        return None, "none"

    type_hint = _TYPE_HINTS.get(place_type or "", place_type or "")

    # 1. Try Wikipedia with type-hinted query first, then bare name
    for query in _build_queries(name, type_hint):
        article = await _search_wikipedia(query)
        if article:
            # 2. Verify the article actually matches the place type
            if await _verify_match(article, name, place_type):
                return article, "wikipedia"

    # 3. Fallback: Claude generates a description
    claude_summary = await _fetch_claude(name, place_type)
    if claude_summary:
        return claude_summary, "claude"

    return None, "none"


def _build_queries(name: str, type_hint: str) -> list[str]:
    """Return candidate search queries, most-specific first."""
    queries = []
    if type_hint and type_hint.lower() not in name.lower():
        queries.append(f"{name} {type_hint}")
    queries.append(name)
    return queries


async def _search_wikipedia(query: str) -> str | None:
    """
    Use Wikipedia's opensearch + summary API to find and fetch an article.
    Tries direct title lookup first, then search API.
    """
    # Direct title lookup (fastest path)
    direct = await _fetch_summary_by_title(query.replace(" ", "_"))
    if direct:
        return direct

    # Search API fallback
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": query,
                    "srlimit": 3,
                    "format": "json",
                },
                headers={"User-Agent": "Wildr/1.0 (nature app)"},
            )
            if resp.status_code != 200:
                return None
            results = resp.json().get("query", {}).get("search", [])
            for r in results:
                title = r.get("title", "")
                summary = await _fetch_summary_by_title(title)
                if summary:
                    return summary
    except Exception:
        pass
    return None


async def _fetch_summary_by_title(title: str) -> str | None:
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Wildr/1.0 (nature app)"})
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("type") == "disambiguation":
                return None
            extract = data.get("extract", "").strip()
            return extract if len(extract) > 50 else None
    except Exception:
        return None


async def _verify_match(text: str, name: str, place_type: str | None) -> bool:
    """
    Ask Claude whether the Wikipedia extract actually describes
    a place matching the given name and type. Fast Haiku call, single token answer.
    """
    if not place_type:
        return True  # No type to check against — accept anything

    # Quick heuristic first (avoid Claude call if obvious)
    type_words = place_type.replace("_", " ").lower().split()
    text_lower = text.lower()
    if any(w in text_lower for w in type_words):
        return True

    # Potentially wrong — ask Claude to verify
    try:
        resp = await _claude.messages.create(
            model="claude-haiku-4-5",
            max_tokens=10,
            messages=[{
                "role": "user",
                "content": (
                    f"Does this Wikipedia text describe a {place_type.replace('_', ' ')} "
                    f"named '{name}'? Reply only YES or NO.\n\n"
                    f"Text: {text[:400]}"
                ),
            }],
        )
        answer = resp.content[0].text.strip().upper()
        return answer.startswith("Y")
    except Exception:
        return True  # Default to accepting if Claude unavailable


async def _fetch_claude(name: str, place_type: str | None) -> str | None:
    kind = place_type.replace("_", " ") if place_type else "green space"
    try:
        response = await _claude.messages.create(
            model="claude-haiku-4-5",
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": (
                    f"Write a 2-sentence factual description of {name}, a {kind}. "
                    "Focus on what makes it notable for nature — wildlife, habitats, or ecology. "
                    "If you don't know this specific place, say so briefly. Be concise."
                ),
            }],
        )
        text = response.content[0].text.strip()
        return text if text else None
    except Exception:
        return None

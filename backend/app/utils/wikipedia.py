"""
Wikipedia summary fetcher with Claude fallback.
Tries Wikipedia REST API first (free, no key).
Falls back to Claude if no article found.
"""

import httpx
from anthropic import AsyncAnthropic

_claude = AsyncAnthropic()


async def get_place_summary(name: str | None, place_type: str | None) -> tuple[str | None, str]:
    """
    Returns (summary_text, source) where source is 'wikipedia' or 'claude'.
    Returns (None, 'none') if name is missing and Claude also fails.
    """
    if not name:
        return None, "none"

    # 1. Try Wikipedia
    wiki_summary = await _fetch_wikipedia(name)
    if wiki_summary:
        return wiki_summary, "wikipedia"

    # 2. Fallback to Claude
    claude_summary = await _fetch_claude(name, place_type)
    if claude_summary:
        return claude_summary, "claude"

    return None, "none"


async def _fetch_wikipedia(name: str) -> str | None:
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{name.replace(' ', '_')}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Wildr/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                # Skip disambiguation pages
                if data.get("type") == "disambiguation":
                    return None
                extract = data.get("extract", "").strip()
                return extract if len(extract) > 50 else None
    except Exception:
        pass
    return None


async def _fetch_claude(name: str, place_type: str | None) -> str | None:
    kind = place_type or "green space"
    try:
        response = await _claude.messages.create(
            model="claude-haiku-4-5",
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": (
                    f"Write a 2-sentence description of {name}, a {kind} in Germany. "
                    "Focus on what makes it notable for nature lovers — wildlife, habitats, or ecology. "
                    "Be factual and concise. If you don't know this specific place, say so briefly."
                ),
            }],
        )
        text = response.content[0].text.strip()
        return text if text else None
    except Exception:
        return None

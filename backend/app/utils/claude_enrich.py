import json
import logging
from anthropic import AsyncAnthropic
from app.core.config import settings

logger = logging.getLogger(__name__)

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def enrich_species(common_name: str, scientific_name: str) -> dict:
    prompt = f"""You are a naturalist. Return a JSON object with exactly these four fields for {common_name} ({scientific_name}):
- fun_fact: one surprising or delightful fact (1–2 sentences)
- habitat: where it typically lives (1 sentence)
- behaviour: a notable behaviour (1 sentence)
- seasonal_note: when/how it appears across seasons (1 sentence)

Respond with only the JSON object, no extra text."""

    try:
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error("Claude enrichment JSON parse failed for %s: %s", scientific_name, e)
        return {}
    except Exception as e:
        logger.error("Claude enrichment failed for %s: %s", scientific_name, e)
        return {}
import base64
import io
import json
import logging
import numpy as np
import soundfile as sf
import librosa
import librosa.display
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from anthropic import AsyncAnthropic
from app.core.config import settings

logger = logging.getLogger(__name__)

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


def _spectrogram_png(audio_bytes: bytes) -> bytes:
    y, sr = sf.read(io.BytesIO(audio_bytes))
    if y.ndim > 1:
        y = y.mean(axis=1)
    y = y.astype(np.float32)
    S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
    S_db = librosa.power_to_db(S, ref=np.max)
    fig, ax = plt.subplots(figsize=(6, 3), dpi=80)
    librosa.display.specshow(S_db, sr=sr, x_axis="time", y_axis="mel", ax=ax, fmax=8000)
    ax.set(xlabel="", ylabel="", title="")
    ax.axis("off")
    fig.tight_layout(pad=0)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    return buf.getvalue()


async def analyze_audio_claude(audio_bytes: bytes) -> list[dict]:
    try:
        png = _spectrogram_png(audio_bytes)
    except Exception as e:
        logger.error("Spectrogram generation failed: %s", e)
        return []

    b64 = base64.standard_b64encode(png).decode()

    prompt = (
        "This is a mel spectrogram of a field recording. "
        "Identify up to three bird species most likely present. "
        "Return ONLY a JSON array, no other text. Each object must have: "
        "common_name (string), scientific_name (string), confidence (float 0-1). "
        "If no birds are detectable return an empty array []."
    )

    try:
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}},
                    {"type": "text", "text": prompt},
                ],
            }],
        )
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        detections = json.loads(text)
    except Exception as e:
        logger.error("Claude audio ID failed: %s", e)
        return []

    results = []
    for d in detections:
        if not isinstance(d, dict):
            continue
        results.append({
            "common_name": d.get("common_name", ""),
            "scientific_name": d.get("scientific_name", ""),
            "confidence": round(float(d.get("confidence", 0)), 3),
            "time_start": 0.0,
            "time_end": 0.0,
        })
    return results

import asyncio
import io
import tempfile
import os
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer

_analyzer = None

def get_analyzer() -> Analyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = Analyzer()
    return _analyzer


async def analyze_audio(audio_bytes: bytes) -> list[dict]:
    def _run():
        analyzer = get_analyzer()
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        try:
            recording = Recording(
                analyzer,
                tmp_path,
                min_conf=0.25,
            )
            recording.analyze()
            results = []
            for d in recording.detections:
                results.append({
                    "common_name": d["common_name"],
                    "scientific_name": d["scientific_name"],
                    "confidence": round(d["confidence"], 3),
                    "time_start": d["start_time"],
                    "time_end": d["end_time"],
                })
            return results
        finally:
            os.unlink(tmp_path)

    return await asyncio.to_thread(_run)
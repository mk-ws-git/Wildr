import io
import numpy as np
from pydub import AudioSegment


def generate_waveform(audio_bytes: bytes, num_points: int = 200) -> list[float]:
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
    samples = np.array(audio.get_array_of_samples(), dtype=float)

    if audio.channels == 2:
        samples = samples.reshape(-1, 2).mean(axis=1)

    chunk_size = max(1, len(samples) // num_points)
    waveform = []
    for i in range(num_points):
        chunk = samples[i * chunk_size : (i + 1) * chunk_size]
        if len(chunk) > 0:
            waveform.append(round(float(np.abs(chunk).mean()), 2))
        else:
            waveform.append(0.0)

    max_val = max(waveform) or 1.0
    return [round(v / max_val, 3) for v in waveform]
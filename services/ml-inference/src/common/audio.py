import base64
import math
import struct
import wave
from pathlib import Path


def decode_audio_base64(audio_base64: str) -> bytes:
    try:
        return base64.b64decode(audio_base64, validate=True)
    except ValueError as exc:
        raise ValueError("Invalid base64 audio payload") from exc


def estimate_energy(audio_bytes: bytes) -> float:
    if len(audio_bytes) < 2:
        return 0.0

    sample_count = min(len(audio_bytes) // 2, 16000)
    if sample_count == 0:
        return 0.0

    total = 0
    for index in range(sample_count):
        sample = struct.unpack_from("<h", audio_bytes, index * 2)[0]
        total += abs(sample)

    return total / sample_count / 32768


def write_tone_wav(
    path: Path,
    sample_rate_hz: int = 22050,
    duration_s: float = 0.35,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    frame_count = int(sample_rate_hz * duration_s)

    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate_hz)

        for frame in range(frame_count):
            value = int(
                32767 * 0.18 * math.sin(2 * math.pi * 440 * frame / sample_rate_hz)
            )
            wav_file.writeframesraw(struct.pack("<h", value))

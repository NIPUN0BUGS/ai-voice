from pathlib import Path

from src.common.audio import write_tone_wav
from src.common.schemas import TextToSpeechRequest


class TextToSpeechService:
    def __init__(self, audio_dir: Path | None = None):
        self.audio_dir = audio_dir or Path("storage/audio")

    def synthesize(self, request: TextToSpeechRequest) -> dict:
        output_path = self.audio_dir / f"{request.session_id}.wav"
        write_tone_wav(output_path)

        return {
            "audio_url": f"/audio/{request.session_id}.wav",
            "duration_ms": 350,
        }

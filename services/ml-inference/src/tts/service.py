from src.common.schemas import TextToSpeechRequest


class TextToSpeechService:
    def synthesize(self, request: TextToSpeechRequest) -> dict:
        # Placeholder: replace with a local TTS model such as VITS or FastSpeech2.
        return {
            "audio_url": f"/audio/{request.session_id}.wav",
            "duration_ms": 1000,
        }

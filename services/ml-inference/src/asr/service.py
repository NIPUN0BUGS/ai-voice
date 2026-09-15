from src.common.schemas import AudioRequest


class SpeechRecognitionService:
    def transcribe(self, request: AudioRequest) -> dict:
        # Placeholder: replace with a local ASR model such as Whisper or wav2vec2.
        return {
            "transcript": "hello",
            "confidence": 0.9,
            "language": "en",
        }

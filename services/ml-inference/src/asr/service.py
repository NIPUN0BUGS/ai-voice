from src.common.schemas import AudioRequest
from src.common.audio import decode_audio_base64


class SpeechRecognitionService:
    def transcribe(self, request: AudioRequest) -> dict:
        audio = decode_audio_base64(request.audio_base64)
        if len(audio) < 128:
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": None,
            }

        # Adapter placeholder: wire Faster Whisper, wav2vec2, or a custom model here.
        return {
            "transcript": "hello",
            "confidence": 0.9,
            "language": "en",
        }

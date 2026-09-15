from src.common.schemas import AudioRequest


class VoiceActivityService:
    def detect(self, request: AudioRequest) -> bool:
        # Placeholder: replace with WebRTC VAD or Silero VAD.
        return len(request.audio_base64.strip()) > 0

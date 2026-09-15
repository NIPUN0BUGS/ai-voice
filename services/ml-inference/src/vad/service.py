from src.common.schemas import AudioRequest
from src.common.audio import decode_audio_base64, estimate_energy


class VoiceActivityService:
    def detect(self, request: AudioRequest) -> bool:
        audio = decode_audio_base64(request.audio_base64)

        if request.audio_format == "pcm16":
            return estimate_energy(audio) > 0.002

        # Compressed browser formats need ffmpeg/model decoding before energy scoring.
        return len(audio) > 128

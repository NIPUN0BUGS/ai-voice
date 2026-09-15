from pydantic import BaseModel, Field


class AudioRequest(BaseModel):
    audio_base64: str = Field(min_length=1)
    sample_rate_hz: int = Field(ge=8000, le=48000)
    audio_format: str


class TextToSpeechRequest(BaseModel):
    session_id: str = Field(min_length=1)
    text: str = Field(min_length=1, max_length=4000)
    voice_id: str | None = None

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class StartVoiceSessionRequest(ApiModel):
    user_id: str = Field(min_length=1, alias="userId")
    language: str = Field(pattern="^(en|si|ta)$")
    consent_accepted: bool = Field(alias="consentAccepted")


class AudioRequest(ApiModel):
    audio_base64: str = Field(min_length=1)
    sample_rate_hz: int = Field(ge=8000, le=48000)
    audio_format: str


class TextToSpeechRequest(ApiModel):
    session_id: str = Field(min_length=1)
    text: str = Field(min_length=1, max_length=4000)
    voice_id: str | None = None


class VoiceTurnRequest(AudioRequest):
    session_id: str = Field(min_length=1, alias="sessionId")
    audio_base64: str = Field(min_length=1, alias="audioBase64")
    sample_rate_hz: int = Field(ge=8000, le=48000, alias="sampleRateHz")
    audio_format: str = Field(alias="audioFormat")

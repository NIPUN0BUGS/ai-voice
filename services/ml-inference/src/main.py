from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Local Voice AI Inference")


class AudioRequest(BaseModel):
    audio_base64: str = Field(min_length=1)
    sample_rate_hz: int = Field(ge=8000, le=48000)
    audio_format: str


class TextToSpeechRequest(BaseModel):
    session_id: str = Field(min_length=1)
    text: str = Field(min_length=1, max_length=4000)
    voice_id: str | None = None


@app.post("/vad")
def detect_voice_activity(request: AudioRequest):
    if not request.audio_base64.strip():
        raise HTTPException(status_code=400, detail="audio_base64 is required")
    return {"has_speech": True}


@app.post("/asr")
def transcribe(request: AudioRequest):
    if not request.audio_base64.strip():
        raise HTTPException(status_code=400, detail="audio_base64 is required")
    return {"transcript": "hello", "confidence": 0.9, "language": "en"}


@app.post("/tts")
def synthesize(request: TextToSpeechRequest):
    return {
        "audio_url": f"/audio/{request.session_id}.wav",
        "duration_ms": 1000,
    }

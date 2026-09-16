from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4
import base64
import math
import os
import struct
import tempfile
import wave

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

load_dotenv()


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class StartVoiceSessionRequest(ApiModel):
    user_id: str = Field(min_length=1, alias="userId")
    language: str = Field(pattern="^(en|si|ta)$")
    consent_accepted: bool = Field(alias="consentAccepted")


class AudioRequest(ApiModel):
    audio_base64: str = Field(min_length=1, alias="audioBase64")
    sample_rate_hz: int = Field(ge=8000, le=48000, alias="sampleRateHz")
    audio_format: str = Field(alias="audioFormat")


class VoiceTurnRequest(AudioRequest):
    session_id: str = Field(min_length=1, alias="sessionId")


class TextToSpeechRequest(ApiModel):
    session_id: str = Field(min_length=1, alias="sessionId")
    text: str = Field(min_length=1, max_length=4000)
    voice_id: str | None = Field(default=None, alias="voiceId")


app = FastAPI(title="Voice AI Backend")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin] if frontend_origin != "*" else ["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["content-type"],
)

audio_dir = Path(os.getenv("AUDIO_STORAGE_PATH", "/tmp/voice-audio"))
app.mount("/api/audio", StaticFiles(directory=audio_dir, check_dir=False), name="audio")
app.mount("/audio", StaticFiles(directory=audio_dir, check_dir=False), name="audio-root")

sessions: dict[str, datetime] = {}
asr_model = None


@app.get("/")
@app.get("/index")
@app.get("/api")
@app.get("/api/index")
def root():
    return {
        "service": "voice-ai-backend",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "voice-ai-backend"}


@app.post("/voice-sessions")
@app.post("/api/voice-sessions")
def start_voice_session(request: StartVoiceSessionRequest):
    if not request.consent_accepted:
        raise HTTPException(status_code=400, detail="Recording consent is required")

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    session_id = str(uuid4())
    sessions[session_id] = expires_at

    return {
        "sessionId": session_id,
        "expiresAt": expires_at.isoformat(),
    }


@app.post("/voice-turns")
@app.post("/api/voice-turns")
def process_voice_turn(request: VoiceTurnRequest):
    expires_at = sessions.get(request.session_id)
    if expires_at is None or expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Voice session was not found or has expired",
        )

    audio = decode_audio_base64(request.audio_base64)
    if len(audio) == 0 or len(audio) > 6 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio payload must be 1 byte to 6 MB")

    if not has_speech(audio, request.audio_format):
        return fallback_response(request.session_id, "No speech detected")

    transcript = transcribe_audio(audio)
    if not transcript:
        return fallback_response(request.session_id, "Low transcription confidence")

    response_text = create_response(transcript)
    audio_url = synthesize_audio(request.session_id)

    return {
        "sessionId": request.session_id,
        "transcript": transcript,
        "responseText": response_text,
        "confidence": 0.9,
        "audioUrl": audio_url,
    }


@app.post("/vad")
@app.post("/api/vad")
def detect_voice_activity(request: AudioRequest):
    audio = decode_audio_base64(request.audio_base64)
    return {"has_speech": has_speech(audio, request.audio_format)}


@app.post("/asr")
@app.post("/api/asr")
def transcribe(request: AudioRequest):
    audio = decode_audio_base64(request.audio_base64)
    transcript = transcribe_audio(audio)
    return {"transcript": transcript, "confidence": 0.9 if transcript else 0, "language": "en"}


@app.post("/tts")
@app.post("/api/tts")
def synthesize(request: TextToSpeechRequest):
    audio_url = synthesize_audio(request.session_id)
    return {"audioUrl": audio_url, "durationMs": 350}


def decode_audio_base64(audio_base64: str) -> bytes:
    try:
        return base64.b64decode(audio_base64, validate=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 audio payload") from exc


def has_speech(audio: bytes, audio_format: str) -> bool:
    if audio_format == "pcm16":
        return estimate_energy(audio) > 0.002

    return len(audio) > 128


def estimate_energy(audio: bytes) -> float:
    sample_count = min(len(audio) // 2, 16000)
    if sample_count == 0:
        return 0.0

    total = 0
    for index in range(sample_count):
        sample = struct.unpack_from("<h", audio, index * 2)[0]
        total += abs(sample)

    return total / sample_count / 32768


def transcribe_audio(audio: bytes) -> str:
    if len(audio) < 128:
        return ""

    if os.getenv("ASR_PROVIDER", "mock") != "faster-whisper":
        return "hello"

    model = get_asr_model()
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as audio_file:
        audio_file.write(audio)
        audio_path = audio_file.name

    try:
        segments, _info = model.transcribe(audio_path, beam_size=1)
        transcript = " ".join(segment.text.strip() for segment in segments)
        return transcript.strip()
    finally:
        try:
            os.remove(audio_path)
        except OSError:
            pass


def get_asr_model():
    global asr_model

    if asr_model is None:
        from faster_whisper import WhisperModel

        asr_model = WhisperModel(
            os.getenv("ASR_MODEL_SIZE", "tiny"),
            device=os.getenv("ASR_DEVICE", "cpu"),
            compute_type=os.getenv("ASR_COMPUTE_TYPE", "int8"),
        )

    return asr_model


def create_response(transcript: str) -> str:
    normalized = transcript.strip().lower()
    if "hello" in normalized or "hi" in normalized:
        return "Hello. How can I help you today?"

    return "I understood your message. The next step is to connect this to your domain use cases."


def synthesize_audio(session_id: str) -> str:
    audio_dir.mkdir(parents=True, exist_ok=True)
    output_path = audio_dir / f"{session_id}.wav"
    write_tone_wav(output_path)
    return f"/api/audio/{session_id}.wav"


def write_tone_wav(path: Path, sample_rate_hz: int = 22050, duration_s: float = 0.35):
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


def fallback_response(session_id: str, reason: str):
    return {
        "sessionId": session_id,
        "transcript": "",
        "responseText": "I could not hear that clearly. Please try again.",
        "confidence": 0,
        "fallbackReason": reason,
    }

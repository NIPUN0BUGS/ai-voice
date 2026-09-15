from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from src.asr.service import SpeechRecognitionService
from src.common.schemas import (
    AudioRequest,
    StartVoiceSessionRequest,
    TextToSpeechRequest,
    VoiceTurnRequest,
)
from src.tts.service import TextToSpeechService
from src.vad.service import VoiceActivityService

app = FastAPI(title="Local Voice AI Inference")
app.mount(
    "/audio",
    StaticFiles(directory="/tmp/voice-audio", check_dir=False),
    name="audio",
)

vad_service = VoiceActivityService()
asr_service = SpeechRecognitionService()
tts_service = TextToSpeechService()
sessions: dict[str, datetime] = {}


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ml-inference"}


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
        raise HTTPException(status_code=400, detail="Voice session was not found or has expired")

    try:
        has_speech = vad_service.detect(request)
        if not has_speech:
            return {
                "sessionId": request.session_id,
                "transcript": "",
                "responseText": "I could not hear that clearly. Please try again.",
                "confidence": 0,
                "fallbackReason": "No speech detected",
            }

        recognition = asr_service.transcribe(request)
        transcript = recognition["transcript"]
        confidence = recognition["confidence"]
        response_text = (
            "Hello. How can I help you today?"
            if "hello" in transcript.lower() or "hi" in transcript.lower()
            else "I understood your message. The next step is to connect this to your domain use cases."
        )
        speech = tts_service.synthesize(
            TextToSpeechRequest(session_id=request.session_id, text=response_text)
        )

        return {
            "sessionId": request.session_id,
            "transcript": transcript,
            "responseText": response_text,
            "confidence": confidence,
            "audioUrl": f"/api{speech['audio_url']}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/vad")
@app.post("/api/vad")
def detect_voice_activity(request: AudioRequest):
    if not request.audio_base64.strip():
        raise HTTPException(status_code=400, detail="audio_base64 is required")
    try:
        return {"has_speech": vad_service.detect(request)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/asr")
@app.post("/api/asr")
def transcribe(request: AudioRequest):
    if not request.audio_base64.strip():
        raise HTTPException(status_code=400, detail="audio_base64 is required")
    try:
        return asr_service.transcribe(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/tts")
@app.post("/api/tts")
def synthesize(request: TextToSpeechRequest):
    return tts_service.synthesize(request)

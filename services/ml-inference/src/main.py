from fastapi import FastAPI, HTTPException

from src.asr.service import SpeechRecognitionService
from src.common.schemas import AudioRequest, TextToSpeechRequest
from src.tts.service import TextToSpeechService
from src.vad.service import VoiceActivityService

app = FastAPI(title="Local Voice AI Inference")

vad_service = VoiceActivityService()
asr_service = SpeechRecognitionService()
tts_service = TextToSpeechService()


@app.post("/vad")
def detect_voice_activity(request: AudioRequest):
    if not request.audio_base64.strip():
        raise HTTPException(status_code=400, detail="audio_base64 is required")
    return {"has_speech": vad_service.detect(request)}


@app.post("/asr")
def transcribe(request: AudioRequest):
    if not request.audio_base64.strip():
        raise HTTPException(status_code=400, detail="audio_base64 is required")
    return asr_service.transcribe(request)


@app.post("/tts")
def synthesize(request: TextToSpeechRequest):
    return tts_service.synthesize(request)

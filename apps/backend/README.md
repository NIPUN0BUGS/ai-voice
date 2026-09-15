# Voice AI Backend

Standalone FastAPI backend for the deployed web app.

This service exposes the frontend contract under `/api`:

- `GET /api/health`
- `POST /api/voice-sessions`
- `POST /api/voice-turns`
- `POST /api/vad`
- `POST /api/asr`
- `POST /api/tts`

## Run Locally

```powershell
cd apps\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Then set the frontend env variable:

```text
VITE_API_BASE_URL=http://localhost:8000/api
```

## Deploy

Recommended hosting for this backend:

- Vercel for the quickest no-card lightweight API deploy
- Railway for no-credit-card trial deploys
- Render for the quickest managed deploy
- Fly.io or VPS/Docker when you need more control
- GPU/container host later when real local AI models are added

Vercel can host the frontend. Keep model inference outside Vercel once heavy model files or GPU dependencies are needed.

## Vercel

Use these settings for a separate backend project:

```text
Root Directory: apps/backend
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
Install Command: pip install -r requirements.txt
```

Environment variables:

```text
FRONTEND_ORIGIN=https://your-vercel-frontend-url.vercel.app
ASR_PROVIDER=mock
AUDIO_STORAGE_PATH=/tmp/voice-audio
```

This deploys the backend contract, but not real Whisper transcription. For real local Whisper, deploy with `requirements-asr.txt` on a container host that has enough CPU/RAM.

After deploy, test:

```text
https://your-backend-vercel-url.vercel.app/api/health
```

The backend includes `api/index.py` and `api/[...path].py` so Vercel routes `/api/health`, `/api/voice-sessions`, and `/api/voice-turns` into the same FastAPI app.

## Railway

Use these settings:

```text
Root Directory: apps/backend
Builder: Dockerfile
Health Check Path: /api/health
```

Environment variables:

```text
FRONTEND_ORIGIN=https://your-vercel-frontend-url.vercel.app
ASR_PROVIDER=mock
AUDIO_STORAGE_PATH=/tmp/voice-audio
```

Start with `ASR_PROVIDER=mock` on free/trial hosting. Switch to `faster-whisper` only after the backend deploy is stable.

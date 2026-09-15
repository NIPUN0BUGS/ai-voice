# Voice AI Platform

Local-first voice AI platform for building speech-to-text, conversation orchestration, and text-to-speech without third-party AI APIs.

## Architecture

```text
apps/
  web/                 React voice client
  backend/             Standalone deployable FastAPI backend
  api-node/            Node.js realtime orchestration API
  api-spring/          Optional Spring Boot enterprise API boundary
services/
  ml-inference/        Local ASR, TTS, and VAD inference service
  ml-training/         Model training pipelines and experiment configs
packages/
  contracts/           Shared DTOs and API contracts
  audio-codecs/        Audio format helpers
  observability/       Logging, metrics, tracing helpers
infra/
  docker/              Local runtime composition
  k8s/                 Kubernetes manifests
  terraform/           Cloud or bare-metal provisioning
docs/
  architecture/        System design notes
  adr/                 Architecture decision records
  runbooks/            Production operations guides
```

## Recommended First Milestone

Build the smallest local pipeline:

```text
Browser microphone
  -> WebSocket audio stream
  -> Node.js VoiceSession use case
  -> Local ML inference service
  -> Transcript and response
  -> Local TTS audio
  -> Browser playback
```

The current starter uses HTTP for the first vertical slice. WebSocket streaming can be added after the model path is stable.

## Current Capabilities

- Browser recording through `MediaRecorder`
- Session creation with consent validation
- Node.js use-case orchestration with repository and model ports
- In-memory session repository for local development
- Python VAD payload validation and basic PCM energy detection
- Python ASR adapter boundary ready for a local model
- Python TTS placeholder that writes a local WAV response file

## Run Locally

Install Node.js 22+ and Python 3.12+, then run:

```powershell
npm install
```

Terminal 1:

```powershell
cd services\ml-inference
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2:

```powershell
npm run dev:api
```

Terminal 3:

```powershell
npm run dev:web
```

Open:

```text
http://localhost:5173
```

## Deploy To Vercel

This repo includes a root `vercel.json` for Vercel Services:

- `apps/web` deploys as the Vite frontend
- `services/ml-inference` deploys under `/api` as the lightweight FastAPI backend

For the full multi-service deployment, set the Vercel project **Root Directory** to the repository root, not `apps/web`.

If you deploy only `apps/web`, Vercel will deploy the frontend service only. The browser UI will load, but `/api` calls need a separate backend URL or a full Services deployment.

For a frontend-only Vercel deployment, set `VITE_API_BASE_URL` to a deployed backend URL when one exists. Without that variable, the web app falls back to demo mode so the UI remains usable.

## Recommended Backend Deployment

Use `apps/backend` as the deployable backend service. It is a standalone FastAPI app with the same `/api` contract the React app expects.

Recommended setup:

```text
Frontend: Vercel project rooted at apps/web
Backend: Render/Railway/Fly/VPS project rooted at apps/backend
Frontend env: VITE_API_BASE_URL=https://your-backend-domain/api
Backend env: FRONTEND_ORIGIN=https://your-frontend-domain
```

This keeps the UI fast on Vercel and leaves the backend free to move to Docker/GPU infrastructure when real local ASR/TTS models are added.

The Vercel backend is intentionally lightweight. Real local AI model serving with large model files or GPU dependencies should run on dedicated container/GPU infrastructure and be called through the existing model-client port.

## Boundaries

- Controllers are thin and only validate/translate transport input.
- Application use cases orchestrate one user action.
- Domain services contain core business rules.
- Infrastructure adapters call local ML services, databases, queues, storage, and external systems.
- DTOs live outside domain entities to keep contracts stable.

## Security Baseline

- Require recording consent.
- Do not store raw voice by default.
- Encrypt stored audio and transcripts.
- Add request size limits and rate limits.
- Keep model confidence and fallback paths observable.

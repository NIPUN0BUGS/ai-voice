# Local Development Runbook

## Startup Order

1. Start `apps/backend`.
2. Start `apps/web`.
3. Use `apps/api-node` later when you need the Node orchestration/WebSocket layer.

## Commands

```powershell
npm install
```

`.env.example` files are templates. Copy them to real `.env` files before running services.

Terminal 1:

```powershell
cd apps\backend
Copy-Item .env.example .env -ErrorAction SilentlyContinue
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2:

```powershell
cd apps\web
Copy-Item .env.example .env.local -ErrorAction SilentlyContinue
cd ..\..
npm run dev:web
```

Open `http://localhost:5173`.

Expected result:

- Status shows `backend connected` after starting a session.
- Demo mode disappears.
- Recorded audio is sent to `http://localhost:8000/api`.

Smoke test:

```powershell
.\scripts\smoke-test-backend.ps1
```

## Debugging Checklist

- Confirm microphone permission in the browser.
- Check WebSocket connection state.
- Log audio chunk duration, sample rate, and byte size.
- Track ASR confidence and empty-transcript responses.
- Add fallback response when model confidence is below the application threshold.

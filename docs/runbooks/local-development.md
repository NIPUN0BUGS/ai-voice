# Local Development Runbook

## Startup Order

1. Start infrastructure dependencies.
2. Start `services/ml-inference`.
3. Start `apps/api-node`.
4. Start `apps/web`.

## Commands

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

Smoke test:

```powershell
.\scripts\smoke-test-api.ps1
```

## Debugging Checklist

- Confirm microphone permission in the browser.
- Check WebSocket connection state.
- Log audio chunk duration, sample rate, and byte size.
- Track ASR confidence and empty-transcript responses.
- Add fallback response when model confidence is below the application threshold.

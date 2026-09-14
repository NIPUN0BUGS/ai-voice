# Local Development Runbook

## Startup Order

1. Start infrastructure dependencies.
2. Start `services/ml-inference`.
3. Start `apps/api-node`.
4. Start `apps/web`.

## Debugging Checklist

- Confirm microphone permission in the browser.
- Check WebSocket connection state.
- Log audio chunk duration, sample rate, and byte size.
- Track ASR confidence and empty-transcript responses.
- Add fallback response when model confidence is below the application threshold.

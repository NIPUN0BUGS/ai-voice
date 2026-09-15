# Development Roadmap

## Phase 1: Local Runnable Product

- React microphone recording
- Node.js voice session orchestration
- Python local inference endpoints
- Generated local audio playback
- Request validation and fallback responses

## Phase 2: Real Local Models

- Replace placeholder ASR with a local speech-to-text model
- Replace generated tone TTS with a local text-to-speech model
- Add model configuration by environment
- Track confidence, latency, and fallback reason

## Phase 3: Streaming

- Add WebSocket audio transport
- Add server-side chunk buffering
- Add partial transcripts
- Add interruption and barge-in handling

## Phase 4: Persistence and Operations

- PostgreSQL session repository
- Transcript audit records
- Structured logs and metrics
- Integration tests and load testing
- Docker/Kubernetes production manifests

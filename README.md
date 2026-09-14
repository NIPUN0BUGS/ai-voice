# Voice AI Platform

Local-first voice AI platform for building speech-to-text, conversation orchestration, and text-to-speech without third-party AI APIs.

## Architecture

```text
apps/
  web/                 React voice client
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

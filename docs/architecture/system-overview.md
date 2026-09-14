# System Overview

## Runtime Flow

1. React captures microphone audio with the Web Audio API.
2. The browser streams audio chunks over WebSocket.
3. The Node.js API creates a voice session and validates audio metadata.
4. Application use cases call outbound ports for VAD, ASR, business response generation, and TTS.
5. Infrastructure adapters call the local ML inference service.
6. Responses are returned as transcript, confidence, intent, response text, and optional audio URL.

## Clean Architecture Layers

```text
presentation -> application -> domain
application -> outbound ports -> infrastructure
```

Domain code must not import presentation, infrastructure, framework, database, or model-serving code.

## Initial Model Strategy

Use local open-source models for the first working version, then fine-tune on owned data:

- VAD: local lightweight voice activity detection
- ASR: local speech-to-text model
- TTS: local text-to-speech model

Training from scratch should wait until there is enough labeled audio and a clear accuracy or ownership requirement.

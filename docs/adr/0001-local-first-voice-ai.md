# ADR 0001: Local-First Voice AI

## Status

Accepted

## Context

The platform must not depend on third-party AI APIs for speech recognition, language understanding, or speech synthesis.

## Decision

Run model inference through internal services and access them through application-layer ports.

## Consequences

- The API remains stable while model implementations change.
- Latency and scaling must be owned by the platform.
- Data privacy improves because raw audio does not leave controlled infrastructure.
- Model quality depends on dataset quality, evaluation, and continuous tuning.

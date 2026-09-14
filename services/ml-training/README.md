# ML Training

Training is separated from runtime inference to keep production serving small and predictable.

## ASR

Use `services/ml-training/asr` for speech-to-text experiments, dataset manifests, and evaluation reports.

Track:

- Dataset version
- Language and accent coverage
- Word Error Rate
- Noise robustness
- Model checkpoint

## TTS

Use `services/ml-training/tts` for text-to-speech experiments and speaker datasets.

Track:

- Speaker consent
- Recording quality
- Text normalization rules
- Pronunciation failures
- Mean opinion score or internal review score

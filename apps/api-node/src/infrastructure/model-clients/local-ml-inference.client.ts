import type {
  SpeechRecognitionPort,
  SpeechRecognitionResult,
} from "../../application/ports/outbound/speech-recognition.port.js";
import type {
  TextToSpeechPort,
  SpeechSynthesisResult,
} from "../../application/ports/outbound/text-to-speech.port.js";
import type { VoiceActivityPort } from "../../application/ports/outbound/voice-activity.port.js";

export class LocalMlInferenceClient
  implements SpeechRecognitionPort, TextToSpeechPort, VoiceActivityPort
{
  constructor(private readonly baseUrl: string) {}

  async hasSpeech(input: {
    audio: Buffer;
    audioFormat: string;
    sampleRateHz: number;
  }): Promise<boolean> {
    const response = await this.post<{ has_speech: boolean }>("/vad", {
      audio_base64: input.audio.toString("base64"),
      sample_rate_hz: input.sampleRateHz,
      audio_format: input.audioFormat,
    });

    return response.has_speech;
  }

  async transcribe(input: {
    audio: Buffer;
    audioFormat: string;
    sampleRateHz: number;
  }): Promise<SpeechRecognitionResult> {
    const response = await this.post<{
      transcript: string;
      confidence: number;
      language?: string;
    }>("/asr", {
      audio_base64: input.audio.toString("base64"),
      sample_rate_hz: input.sampleRateHz,
      audio_format: input.audioFormat,
    });

    return {
      transcript: response.transcript,
      confidence: response.confidence,
      language: response.language,
    };
  }

  async synthesize(input: {
    sessionId: string;
    text: string;
    voiceId?: string;
  }): Promise<SpeechSynthesisResult> {
    const response = await this.post<{
      audio_url: string;
      duration_ms?: number;
    }>("/tts", {
      session_id: input.sessionId,
      text: input.text,
      voice_id: input.voiceId,
    });

    return {
      audioUrl: `${this.baseUrl}${response.audio_url}`,
      durationMs: response.duration_ms,
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ML inference request failed: ${response.status} ${errorBody}`);
    }

    return (await response.json()) as T;
  }
}

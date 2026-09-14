import type {
  SpeechRecognitionPort,
  SpeechRecognitionResult,
} from "../../application/ports/outbound/speech-recognition.port";
import type {
  TextToSpeechPort,
  SpeechSynthesisResult,
} from "../../application/ports/outbound/text-to-speech.port";
import type { VoiceActivityPort } from "../../application/ports/outbound/voice-activity.port";

export class LocalMlInferenceClient
  implements SpeechRecognitionPort, TextToSpeechPort, VoiceActivityPort
{
  constructor(private readonly baseUrl: string) {}

  async hasSpeech(): Promise<boolean> {
    // Replace with POST /vad when the Python service is implemented.
    return true;
  }

  async transcribe(): Promise<SpeechRecognitionResult> {
    // Replace with POST /asr when the Python service is implemented.
    return {
      transcript: "hello",
      confidence: 0.9,
      language: "en",
    };
  }

  async synthesize(input: { sessionId: string }): Promise<SpeechSynthesisResult> {
    // Replace with POST /tts when the Python service is implemented.
    return {
      audioUrl: `${this.baseUrl}/audio/${input.sessionId}.wav`,
    };
  }
}

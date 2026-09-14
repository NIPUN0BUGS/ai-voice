import type {
  ProcessVoiceTurnInput,
  ProcessVoiceTurnOutput,
} from "../dto/voice-session.dto";
import type { SpeechRecognitionPort } from "../ports/outbound/speech-recognition.port";
import type { TextToSpeechPort } from "../ports/outbound/text-to-speech.port";
import type { VoiceActivityPort } from "../ports/outbound/voice-activity.port";
import { ConversationDomainService } from "../../domain/services/conversation-domain.service";

const MIN_CONFIDENCE = 0.55;

export class ProcessVoiceTurnUseCase {
  constructor(
    private readonly voiceActivity: VoiceActivityPort,
    private readonly speechRecognition: SpeechRecognitionPort,
    private readonly textToSpeech: TextToSpeechPort,
    private readonly conversation: ConversationDomainService,
  ) {}

  async execute(input: ProcessVoiceTurnInput): Promise<ProcessVoiceTurnOutput> {
    if (!input.sessionId?.trim()) {
      throw new Error("sessionId is required");
    }

    if (!input.audioBase64?.trim()) {
      throw new Error("audioBase64 is required");
    }

    if (input.sampleRateHz < 8000 || input.sampleRateHz > 48000) {
      throw new Error("sampleRateHz must be between 8000 and 48000");
    }

    const audio = Buffer.from(input.audioBase64, "base64");
    const hasSpeech = await this.voiceActivity.hasSpeech({
      audio,
      sampleRateHz: input.sampleRateHz,
    });

    if (!hasSpeech) {
      return this.fallback(input.sessionId, "No speech detected");
    }

    const recognition = await this.speechRecognition.transcribe({
      audio,
      audioFormat: input.audioFormat,
      sampleRateHz: input.sampleRateHz,
    });

    if (!recognition.transcript || recognition.confidence < MIN_CONFIDENCE) {
      return this.fallback(input.sessionId, "Low transcription confidence");
    }

    const responseText = this.conversation.respondToTranscript(
      recognition.transcript,
    );

    const speech = await this.textToSpeech.synthesize({
      sessionId: input.sessionId,
      text: responseText,
    });

    return {
      sessionId: input.sessionId,
      transcript: recognition.transcript,
      responseText,
      confidence: recognition.confidence,
      audioUrl: speech.audioUrl,
    };
  }

  private fallback(sessionId: string, reason: string): ProcessVoiceTurnOutput {
    return {
      sessionId,
      transcript: "",
      responseText: "I could not hear that clearly. Please try again.",
      confidence: 0,
      fallbackReason: reason,
    };
  }
}

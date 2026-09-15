import type { ProcessVoiceTurnUseCase } from "../../../application/use-cases/process-voice-turn.use-case";
import type { ProcessVoiceTurnInput } from "../../../application/dto/voice-session.dto";

export class VoiceSessionController {
  constructor(private readonly processVoiceTurn: ProcessVoiceTurnUseCase) {}

  async processTurn(requestBody: unknown) {
    if (!requestBody || typeof requestBody !== "object") {
      throw new Error("Invalid request body");
    }

    const input = requestBody as Partial<ProcessVoiceTurnInput>;

    if (!input.sessionId || !input.audioBase64 || !input.audioFormat) {
      throw new Error("sessionId, audioBase64, and audioFormat are required");
    }

    return this.processVoiceTurn.execute(input as ProcessVoiceTurnInput);
  }
}

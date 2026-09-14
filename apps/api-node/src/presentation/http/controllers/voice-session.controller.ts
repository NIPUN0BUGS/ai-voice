import type { ProcessVoiceTurnUseCase } from "../../../application/use-cases/process-voice-turn.use-case";

export class VoiceSessionController {
  constructor(private readonly processVoiceTurn: ProcessVoiceTurnUseCase) {}

  async processTurn(requestBody: unknown) {
    if (!requestBody || typeof requestBody !== "object") {
      throw new Error("Invalid request body");
    }

    return this.processVoiceTurn.execute(requestBody as never);
  }
}

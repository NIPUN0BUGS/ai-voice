import { randomUUID } from "node:crypto";
import type {
  StartVoiceSessionInput,
  StartVoiceSessionOutput,
} from "../dto/voice-session.dto.js";
import type { VoiceSessionRepositoryPort } from "../ports/outbound/voice-session-repository.port.js";
import { VoiceSession } from "../../domain/entities/voice-session.entity.js";

const SESSION_TTL_MS = 30 * 60 * 1000;
const SUPPORTED_LANGUAGES = new Set(["en", "si", "ta"]);

export class StartVoiceSessionUseCase {
  constructor(private readonly sessions: VoiceSessionRepositoryPort) {}

  async execute(input: StartVoiceSessionInput): Promise<StartVoiceSessionOutput> {
    if (!input.userId?.trim()) {
      throw new Error("userId is required");
    }

    if (input.consentAccepted !== true) {
      throw new Error("Recording consent is required");
    }

    if (!SUPPORTED_LANGUAGES.has(input.language)) {
      throw new Error("Unsupported language");
    }

    const now = new Date();
    const session = new VoiceSession({
      id: randomUUID(),
      userId: input.userId,
      language: input.language,
      consentAccepted: input.consentAccepted,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    });

    await this.sessions.save(session);

    return {
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString(),
    };
  }
}

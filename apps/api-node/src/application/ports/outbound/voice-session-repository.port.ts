import type { VoiceSession } from "../../../domain/entities/voice-session.entity.js";

export interface VoiceSessionRepositoryPort {
  save(session: VoiceSession): Promise<void>;
  findById(sessionId: string): Promise<VoiceSession | null>;
}

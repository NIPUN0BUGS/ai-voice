import type { VoiceSessionRepositoryPort } from "../../application/ports/outbound/voice-session-repository.port.js";
import { VoiceSession } from "../../domain/entities/voice-session.entity.js";

export class InMemoryVoiceSessionRepository
  implements VoiceSessionRepositoryPort
{
  private readonly sessions = new Map<string, VoiceSession>();

  async save(session: VoiceSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async findById(sessionId: string): Promise<VoiceSession | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (session.isExpired()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }
}

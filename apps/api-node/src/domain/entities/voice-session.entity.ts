export type VoiceSessionProps = {
  id: string;
  userId: string;
  language: string;
  consentAccepted: boolean;
  createdAt: Date;
  expiresAt: Date;
};

export class VoiceSession {
  constructor(private readonly props: VoiceSessionProps) {
    if (!props.id.trim()) {
      throw new Error("Voice session id is required");
    }

    if (!props.userId.trim()) {
      throw new Error("Voice session user id is required");
    }

    if (!props.consentAccepted) {
      throw new Error("Recording consent is required");
    }
  }

  get id() {
    return this.props.id;
  }

  get userId() {
    return this.props.userId;
  }

  get language() {
    return this.props.language;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  isExpired(now = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  toSnapshot(): VoiceSessionProps {
    return { ...this.props };
  }
}

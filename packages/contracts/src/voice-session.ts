export type SupportedLanguage = "en" | "si" | "ta";

export type StartVoiceSessionRequest = {
  userId: string;
  language: SupportedLanguage;
  consentAccepted: boolean;
};

export type StartVoiceSessionResponse = {
  sessionId: string;
  expiresAt: string;
};

export type VoiceTurnRequest = {
  sessionId: string;
  audioFormat: "pcm16" | "wav" | "webm";
  sampleRateHz: number;
  audioBase64: string;
};

export type VoiceTurnResponse = {
  sessionId: string;
  transcript: string;
  responseText: string;
  confidence: number;
  intent?: string;
  audioUrl?: string;
  fallbackReason?: string;
};

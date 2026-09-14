export type SpeechSynthesisResult = {
  audioUrl: string;
  durationMs?: number;
};

export interface TextToSpeechPort {
  synthesize(input: {
    sessionId: string;
    text: string;
    voiceId?: string;
  }): Promise<SpeechSynthesisResult>;
}

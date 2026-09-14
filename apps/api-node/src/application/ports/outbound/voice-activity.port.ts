export interface VoiceActivityPort {
  hasSpeech(input: {
    audio: Buffer;
    sampleRateHz: number;
  }): Promise<boolean>;
}

export interface VoiceActivityPort {
  hasSpeech(input: {
    audio: Buffer;
    audioFormat: string;
    sampleRateHz: number;
  }): Promise<boolean>;
}

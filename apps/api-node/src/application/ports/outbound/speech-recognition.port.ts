export type SpeechRecognitionResult = {
  transcript: string;
  confidence: number;
  language?: string;
};

export interface SpeechRecognitionPort {
  transcribe(input: {
    audio: Buffer;
    audioFormat: string;
    sampleRateHz: number;
  }): Promise<SpeechRecognitionResult>;
}

export class ConversationDomainService {
  respondToTranscript(transcript: string): string {
    const normalized = transcript.trim().toLowerCase();

    if (!normalized) {
      return "I could not hear that clearly. Please try again.";
    }

    if (normalized.includes("hello") || normalized.includes("hi")) {
      return "Hello. How can I help you today?";
    }

    return "I understood your message. The next step is to connect this to your domain use cases.";
  }
}

import type {
  StartVoiceSessionRequest,
  StartVoiceSessionResponse,
  VoiceTurnRequest,
  VoiceTurnResponse,
} from "@voice/contracts";

export type StartVoiceSessionInput = StartVoiceSessionRequest;
export type StartVoiceSessionOutput = StartVoiceSessionResponse;
export type ProcessVoiceTurnInput = VoiceTurnRequest;
export type ProcessVoiceTurnOutput = VoiceTurnResponse;

import type {
  StartVoiceSessionRequest,
  StartVoiceSessionResponse,
  VoiceTurnRequest,
  VoiceTurnResponse,
} from "../../../../../packages/contracts/src/voice-session";

export type StartVoiceSessionInput = StartVoiceSessionRequest;
export type StartVoiceSessionOutput = StartVoiceSessionResponse;
export type ProcessVoiceTurnInput = VoiceTurnRequest;
export type ProcessVoiceTurnOutput = VoiceTurnResponse;

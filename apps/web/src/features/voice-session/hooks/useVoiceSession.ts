import { useCallback, useRef, useState } from "react";

type VoiceSessionState = "idle" | "connecting" | "recording" | "error";

export function useVoiceSession() {
  const socketRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback((sessionId: string) => {
    if (!sessionId.trim()) {
      setError("Session id is required");
      setState("error");
      return;
    }

    setState("connecting");
    const socket = new WebSocket(`/voice-sessions/${sessionId}/stream`);
    socketRef.current = socket;

    socket.onopen = () => setState("recording");
    socket.onerror = () => {
      setError("Voice connection failed");
      setState("error");
    };
    socket.onclose = () => setState("idle");
  }, []);

  const stop = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setState("idle");
  }, []);

  return {
    state,
    error,
    start,
    stop,
  };
}

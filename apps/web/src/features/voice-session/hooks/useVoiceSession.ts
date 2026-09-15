import { useCallback, useRef, useState } from "react";

type VoiceSessionState = "idle" | "connecting" | "recording" | "processing" | "error";

type StartSessionResponse = {
  sessionId: string;
  expiresAt: string;
};

type VoiceTurnResponse = {
  transcript: string;
  responseText: string;
  audioUrl?: string;
};

export function useVoiceSession() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");

  const startSession = useCallback(async () => {
    setError(null);
    setState("connecting");

    try {
      const response = await fetch("/api/voice-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "local-user",
          language: "en",
          consentAccepted: true,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as StartSessionResponse;
      sessionIdRef.current = data.sessionId;
      setState("idle");
    } catch (sessionError) {
      setError(toErrorMessage(sessionError));
      setState("error");
    }
  }, []);

  const recordTurn = useCallback(async () => {
    setError(null);

    if (!sessionIdRef.current) {
      await startSession();
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone recording is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        setError("Recording failed");
        setState("error");
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setState("processing");

        try {
          const audioBlob = new Blob(chunksRef.current, {
            type: mimeType || "application/octet-stream",
          });
          const audioBase64 = await blobToBase64(audioBlob);
          const response = await fetch("/api/voice-turns", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              audioFormat: mimeType.includes("webm") ? "webm" : "pcm16",
              sampleRateHz: 48000,
              audioBase64,
            }),
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const data = (await response.json()) as VoiceTurnResponse;
          setTranscript(data.transcript);
          setResponseText(data.responseText);

          if (data.audioUrl) {
            new Audio(data.audioUrl).play().catch(() => undefined);
          }

          setState("idle");
        } catch (turnError) {
          setError(toErrorMessage(turnError));
          setState("error");
        }
      };

      recorder.start();
      setState("recording");
    } catch (recordingError) {
      setError(toErrorMessage(recordingError));
      setState("error");
    }
  }, [startSession]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  return {
    state,
    error,
    transcript,
    responseText,
    startSession,
    recordTurn,
    stopRecording,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read audio"));
    reader.onloadend = () => {
      const value = String(reader.result);
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.readAsDataURL(blob);
  });
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected voice session error";
}

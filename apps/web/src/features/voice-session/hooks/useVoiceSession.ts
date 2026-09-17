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

type ConnectionStatus = "unknown" | "connected" | "demo";

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function useVoiceSession() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("unknown");
  const [notice, setNotice] = useState(
    "Connect the backend to transcribe spoken words.",
  );

  const startSession = useCallback(async () => {
    setError(null);
    setState("connecting");

    try {
      const data = await requestJson<StartSessionResponse>("/voice-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "local-user",
          language: "en",
          consentAccepted: true,
        }),
      });
      sessionIdRef.current = data.sessionId;
      setIsDemoMode(false);
      setConnectionStatus("connected");
      setNotice("Backend connected. Record a turn to transcribe speech.");
      setState("idle");
    } catch (sessionError) {
      const fallback = createDemoSession();
      sessionIdRef.current = fallback.sessionId;
      setIsDemoMode(true);
      setConnectionStatus("demo");
      setNotice(
        "Backend not connected. The browser can record audio, but real transcription needs the FastAPI backend.",
      );
      setTranscript("Waiting for a connected backend to transcribe your words.");
      setResponseText(getBackendFallbackMessage(sessionError));
      setState("idle");
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

        const audioBlob = new Blob(chunksRef.current, {
          type: mimeType || "application/octet-stream",
        });

        try {
          const audioBase64 = await blobToBase64(audioBlob);
          const data = await requestJson<VoiceTurnResponse>("/voice-turns", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              audioFormat: mimeType.includes("webm") ? "webm" : "pcm16",
              sampleRateHz: 48000,
              audioBase64,
            }),
          });
          setTranscript(data.transcript);
          setResponseText(data.responseText);
          setIsDemoMode(false);
          setConnectionStatus("connected");
          setNotice("Speech was sent to the backend and transcribed.");

          if (data.audioUrl) {
            new Audio(resolveBackendUrl(data.audioUrl))
              .play()
              .catch(() => undefined);
          }

          setState("idle");
        } catch (turnError) {
          const data = createDemoTurn(audioBlob.size);
          setIsDemoMode(true);
          setConnectionStatus("demo");
          setNotice(
            "Audio was captured locally, but no backend answered the transcription request.",
          );
          setTranscript(data.transcript);
          setResponseText(data.responseText);
          setState("idle");
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
    isDemoMode,
    connectionStatus,
    notice,
    startSession,
    recordTurn,
    stopRecording,
  };
}

function normalizeApiBaseUrl(value: string | undefined): string {
  return (value?.trim() || "/api").replace(/\/+$/, "");
}

function resolveBackendUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (!pathOrUrl.startsWith("/")) {
    return pathOrUrl;
  }

  if (apiBaseUrl.startsWith("/")) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, apiBaseUrl).toString();
}

async function requestJson<TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (isVercelAuthenticationPage(response, contentType, body)) {
    throw new Error(
      "Backend is protected by Vercel Authentication. Disable Deployment Protection for the backend project, or use a public backend URL for VITE_API_BASE_URL.",
    );
  }

  if (!response.ok) {
    throw new Error(body || `Backend request failed with ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Backend did not return JSON. Check that VITE_API_BASE_URL points to the public FastAPI backend, not a protected Vercel page.",
    );
  }

  return JSON.parse(body) as TResponse;
}

function isVercelAuthenticationPage(
  response: Response,
  contentType: string,
  body: string,
): boolean {
  return (
    response.status === 401 &&
    contentType.includes("text/html") &&
    (body.includes("vercel") || body.includes("/sso-api"))
  );
}

function getBackendFallbackMessage(error: unknown): string {
  const message = toErrorMessage(error);

  if (
    message.includes("did not return JSON") ||
    message.includes("Vercel Authentication")
  ) {
    return message;
  }

  return "Deploy apps/backend and set VITE_API_BASE_URL in Vercel to enable real speech-to-text.";
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

function createDemoSession(): StartSessionResponse {
  return {
    sessionId:
      globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now().toString(36)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

function createDemoTurn(audioBytes: number): VoiceTurnResponse {
  return {
    transcript:
      audioBytes > 0
        ? "Audio captured successfully. Real words are not available until the backend is connected."
        : "No audio was captured. Check microphone permission and try again.",
    responseText:
      "Next step: deploy apps/backend, then add VITE_API_BASE_URL=https://your-backend-url.com/api in the Vercel frontend environment.",
  };
}

import { Mic, Square } from "lucide-react";
import { useVoiceSession } from "../features/voice-session/hooks/useVoiceSession";

export function App() {
  const {
    state,
    error,
    transcript,
    responseText,
    isDemoMode,
    startSession,
    recordTurn,
    stopRecording,
  } = useVoiceSession();

  const isRecording = state === "recording";

  return (
    <main className="shell">
      <section className="voice-panel" aria-label="Voice AI session">
        <div>
          <p className="eyebrow">Local-first voice AI</p>
          <h1>Voice AI Console</h1>
        </div>

        <div className="status-row">
          <span className={`status-dot status-${state}`} />
          <span>{state}</span>
          {isDemoMode ? <span className="mode-pill">demo</span> : null}
        </div>

        <div className="actions">
          <button type="button" onClick={startSession}>
            Start session
          </button>
          <button
            type="button"
            className={isRecording ? "danger" : "primary"}
            onClick={isRecording ? stopRecording : recordTurn}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
            {isRecording ? "Stop" : "Record turn"}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="result-grid">
          <article>
            <h2>Transcript</h2>
            <p>{transcript || "No transcript yet."}</p>
          </article>
          <article>
            <h2>Response</h2>
            <p>{responseText || "No response yet."}</p>
          </article>
        </div>
      </section>
    </main>
  );
}

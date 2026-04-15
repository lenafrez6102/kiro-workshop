import { useState, useRef, useEffect } from 'react';

/**
 * Pure function: formats elapsed seconds as MM:SS (zero-padded).
 * @param {number} seconds - non-negative integer
 * @returns {string} formatted time string, e.g. "02:05"
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * SessionPanel — shows Start/Stop session controls, a timer,
 * and the live transcription display area.
 *
 * Props:
 *   sessionState      {string}   — 'idle' | 'active' | 'ended'
 *   transcription     {string}   — cumulative transcription text
 *   onStartSession    {function} — called after mic is granted and session begins
 *   onStopSession     {function} — called when session ends
 *   onTranscriptUpdate {function} — called with new transcript text to append
 *   onMicError        {function} — called with error message if mic is denied
 */
function SessionPanel({
  sessionState,
  transcription,
  onStartSession,
  onStopSession,
  onTranscriptUpdate,
  onMicError,
}) {
  const isActive = sessionState === 'active';

  // Elapsed seconds — managed locally in SessionPanel
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Microphone permission error message
  const [micError, setMicError] = useState(null);

  // Refs for cleanup
  const wsRef = useRef(null); // Will store SpeechRecognition instance
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Reset elapsed time when session becomes idle
  useEffect(() => {
    if (sessionState === 'idle') {
      setElapsedSeconds(0);
      setMicError(null);
    }
  }, [sessionState]);

  async function handleStart() {
    setMicError(null);

    // 1. Request microphone access (still needed for Web Speech API)
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      const msg = 'Microphone access was denied. Please enable microphone permissions and try again.';
      setMicError(msg);
      if (onMicError) onMicError(msg);
      return;
    }

    streamRef.current = stream;

    // 2. Use Web Speech API instead of WebSocket
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
      setMicError(msg);
      if (onMicError) onMicError(msg);
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results to avoid duplication
    recognition.lang = 'en-US';

    wsRef.current = recognition; // Store in wsRef for cleanup

    recognition.onresult = (event) => {
      // Get the latest result
      const lastResultIndex = event.results.length - 1;
      const transcript = event.results[lastResultIndex][0].transcript;
      
      if (transcript && onTranscriptUpdate) {
        onTranscriptUpdate(transcript + ' ');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (onTranscriptUpdate) {
        onTranscriptUpdate(`\n[Transcription error: ${event.error}]`);
      }
      stopSession();
    };

    recognition.onend = () => {
      // If session is still active, restart recognition (it stops after ~60s of silence)
      if (sessionState === 'active' && wsRef.current === recognition) {
        recognition.start();
      }
    };

    try {
      recognition.start();
    } catch (err) {
      const msg = `Failed to start speech recognition: ${err.message}`;
      setMicError(msg);
      if (onMicError) onMicError(msg);
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    // 3. Notify App that session has started
    onStartSession();

    // 4. Start the elapsed-time timer
    setElapsedSeconds(0);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }

  function stopSession() {
    // Clear the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop speech recognition
    if (wsRef.current && wsRef.current.stop) {
      try {
        wsRef.current.stop();
      } catch (err) {
        // Ignore errors when stopping
      }
      wsRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Notify App that session has ended (updates sessionState to 'ended')
    onStopSession();
  }

  function handleStop() {
    stopSession();
  }

  return (
    <section className="section" aria-label="Practice Session">
      <p className="section-label">Practice Session</p>

      <div className="session-controls">
        {isActive ? (
          <button className="btn" onClick={handleStop}>
            Stop Session
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={sessionState === 'active'}
          >
            Start Practice Session
          </button>
        )}

        {isActive && (
          <span className="timer" aria-live="off" aria-label={`Elapsed time: ${formatTime(elapsedSeconds)}`}>
            {formatTime(elapsedSeconds)}
          </span>
        )}
      </div>

      {micError && (
        <p className="error-message" role="alert">
          {micError}
        </p>
      )}

      <div
        className="transcription-display"
        aria-live="polite"
        aria-label="Transcription"
      >
        {transcription ? (
          <span>{transcription}</span>
        ) : (
          <span className="transcription-placeholder">
            {isActive
              ? 'Listening… start speaking.'
              : 'Transcription will appear here during your session.'}
          </span>
        )}
      </div>
    </section>
  );
}

export default SessionPanel;

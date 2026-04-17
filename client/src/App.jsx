import { useState, useEffect } from 'react';
import QuestionPanel from './QuestionPanel.jsx';
import SessionPanel from './SessionPanel.jsx';
import FeedbackPanel from './FeedbackPanel.jsx';

function App() {
  // Application state
  const [question, setQuestion] = useState(null);
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'active' | 'ended'
  const [transcription, setTranscription] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [noSpeech, setNoSpeech] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [error, setError] = useState(null);

  // When session ends, trigger analysis if transcription is non-empty
  useEffect(() => {
    if (sessionState !== 'ended') return;

    console.log('Session ended. Transcription:', transcription); // Debug log
    console.log('Transcription length:', transcription.length); // Debug log
    console.log('Transcription trimmed:', transcription.trim()); // Debug log

    if (!transcription.trim()) {
      // Req 4.7: no speech detected — don't call the analyzer
      setNoSpeech(true);
      return;
    }

    setNoSpeech(false);
    setIsLoadingFeedback(true);
    setError(null);

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, transcription }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          throw new Error(data.error || 'Failed to analyze response');
        }
        setFeedback(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to analyze response');
      })
      .finally(() => {
        setIsLoadingFeedback(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState]);

  async function handleGenerateQuestion() {
    // Reset everything when generating a new question
    setSessionState('idle');
    setTranscription('');
    setFeedback(null);
    setNoSpeech(false);
    setIsLoadingQuestion(true);
    setError(null);
    
    try {
      const res = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate question');
      }
      setQuestion(data.question);
    } catch (err) {
      setError(err.message || 'Failed to generate question');
    } finally {
      setIsLoadingQuestion(false);
    }
  }

  // Called by SessionPanel after mic is granted — updates sessionState to 'active'
  function handleStartSession() {
    setSessionState('active');
    setTranscription('');
    setFeedback(null);
    setNoSpeech(false);
    setError(null);
  }

  // Called by SessionPanel when the user stops the session — updates sessionState to 'ended'
  function handleStopSession() {
    setSessionState('ended');
  }

  // Called by SessionPanel with each new transcript chunk to append
  function handleTranscriptUpdate(text) {
    setTranscription((prev) => prev + text);
  }

  // Called by SessionPanel when microphone access is denied
  function handleMicError(msg) {
    setError(msg);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">AI Interview Coach</h1>
      </header>

      <main>
        <QuestionPanel
          question={question}
          isLoadingQuestion={isLoadingQuestion}
          error={error}
          sessionState={sessionState}
          onGenerateQuestion={handleGenerateQuestion}
        />

        <SessionPanel
          sessionState={sessionState}
          transcription={transcription}
          onStartSession={handleStartSession}
          onStopSession={handleStopSession}
          onTranscriptUpdate={handleTranscriptUpdate}
          onMicError={handleMicError}
        />

        <FeedbackPanel
          feedback={feedback}
          isLoadingFeedback={isLoadingFeedback}
          error={error}
          noSpeech={noSpeech}
        />
      </main>
    </div>
  );
}

export default App;

/**
 * FeedbackPanel — renders structured AI feedback after a session ends.
 *
 * Props:
 *   feedback          {object|null} — Feedback object, or null
 *   isLoadingFeedback {boolean}     — true while analysis is in flight
 *   error             {string|null} — error message to display, or null
 *   noSpeech          {boolean}     — true when session ended with no transcription
 */
function FeedbackPanel({ feedback, isLoadingFeedback, error, noSpeech }) {
  // Don't render the panel at all when there's nothing to show
  if (!isLoadingFeedback && !feedback && !error && !noSpeech) {
    return null;
  }

  return (
    <section className="section feedback-panel" aria-label="Feedback">
      <p className="section-label">Feedback</p>

      {isLoadingFeedback && (
        <div className="loading" aria-live="polite">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span>Analyzing your response…</span>
        </div>
      )}

      {error && !feedback && (
        <p className="error-message">{error}</p>
      )}

      {noSpeech && !feedback && !error && (
        <p className="error-message" aria-live="polite">
          No speech was detected. Please try again and speak clearly into your microphone.
        </p>
      )}

      {feedback && (
        <div>
          {/* STAR Analysis */}
          <div className="feedback-section">
            <p className="feedback-section-title">STAR Analysis</p>
            <div className="star-grid">
              {Object.entries(feedback.starAnalysis).map(([component, present]) => (
                <span
                  key={component}
                  className={`star-badge ${present ? 'star-badge--present' : 'star-badge--missing'}`}
                  aria-label={`${component}: ${present ? 'present' : 'missing'}`}
                >
                  {component}
                </span>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="feedback-section">
            <p className="feedback-section-title">Strengths</p>
            <ul className="feedback-list">
              {feedback.strengths.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="feedback-section">
            <p className="feedback-section-title">Areas for Improvement</p>
            <ul className="feedback-list">
              {feedback.areasForImprovement.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Actionable Tips */}
          <div className="feedback-section">
            <p className="feedback-section-title">Actionable Tips</p>
            <ul className="feedback-list">
              {feedback.actionableTips.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

export default FeedbackPanel;

/**
 * QuestionPanel — displays the current behavioral interview question
 * and the "Generate Question" button.
 *
 * Props:
 *   question          {string|null}  — current question text, or null
 *   isLoadingQuestion {boolean}      — true while fetching a question
 *   error             {string|null}  — error message to display, or null
 *   sessionState      {string}       — 'idle' | 'active' | 'ended'
 *   onGenerateQuestion {function}    — called when the button is clicked
 */
function QuestionPanel({ question, isLoadingQuestion, error, sessionState, onGenerateQuestion }) {
  const isDisabled = sessionState === 'active' || isLoadingQuestion;

  return (
    <section className="section" aria-label="Question">
      <p className="section-label">Interview Question</p>

      <button
        className="btn btn-primary"
        onClick={onGenerateQuestion}
        disabled={isDisabled}
        aria-busy={isLoadingQuestion}
      >
        Generate Question
      </button>

      {isLoadingQuestion && (
        <div className="loading" aria-live="polite" style={{ marginTop: '16px' }}>
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span>Generating question…</span>
        </div>
      )}

      <div className="question-display" aria-live="polite">
        {error && !question ? (
          <p className="error-message">{error}</p>
        ) : question ? (
          <p>{question}</p>
        ) : (
          <p className="question-placeholder">
            Your question will appear here.
          </p>
        )}
      </div>
    </section>
  );
}

export default QuestionPanel;

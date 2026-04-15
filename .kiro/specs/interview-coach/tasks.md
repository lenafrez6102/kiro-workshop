# Implementation Plan: AI Interview Coach

## Overview

Build a single-page React/Vite frontend and Node.js/Express backend that connects to AWS Bedrock for question generation and response analysis, and AWS Transcribe Streaming for real-time speech-to-text. All state is ephemeral — no database, no auth, no persistence.

## Tasks

- [x] 1. Initialize project structure
  - Scaffold a Vite + React frontend in a `client/` directory using `npm create vite@latest`
  - Scaffold a Node.js/Express backend in a `server/` directory with `npm init`
  - Install backend dependencies: `express`, `ws`, `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-transcribe-streaming`
  - Install frontend dependencies: none beyond Vite defaults (no extra UI libraries)
  - Create a root-level `.env` file with placeholder keys: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=us-east-1`
  - Create `server/index.js` with a minimal Express app that loads env vars and listens on port 3001
  - Add a `proxy` entry in `client/vite.config.js` so `/api` and `/ws` requests forward to `localhost:3001`
  - _Requirements: 6.4_

- [x] 2. Implement backend AWS service wrappers
  - [x] 2.1 Create `server/services/bedrock.js`
    - Instantiate `BedrockRuntimeClient` with region `us-east-1` and credentials from env vars
    - Implement `generateQuestion(category)` — builds the system+user prompt from the design, calls `InvokeModelCommand` with model `amazon.nova-pro-v1:0`, returns the question string
    - Implement `analyzeResponse(question, transcription)` — builds the analysis prompt, calls `InvokeModelCommand`, parses the JSON response body into a `Feedback` object, returns it
    - _Requirements: 1.1, 1.2, 4.2, 4.3, 6.4_
  - [x] 2.2 Create `server/services/transcribe.js`
    - Instantiate `TranscribeStreamingClient` with region `us-east-1` and credentials from env vars
    - Implement `startTranscriptionSession(audioStream)` as an async generator that calls `StartStreamTranscriptionCommand` (PCM 16-bit, 16kHz, mono) and yields `{ type: 'transcript', text }` events for each partial/final result
    - _Requirements: 3.1, 3.3, 6.4_

- [x] 3. Implement backend routes and WebSocket handler
  - [x] 3.1 Create `server/routes/question.js`
    - Handle `POST /api/question`, accept optional `category` in request body
    - Call `bedrock.generateQuestion(category)`, return `{ question }` on success
    - Return `500` with `{ error }` on AWS failure
    - _Requirements: 1.1, 6.1, 6.6_
  - [x] 3.2 Create `server/routes/analyze.js`
    - Handle `POST /api/analyze`, require `question` and `transcription` fields
    - Return `400` with descriptive message if either field is missing
    - Call `bedrock.analyzeResponse(question, transcription)`, return the `Feedback` object on success
    - Return `500` with `{ error }` on AWS failure
    - _Requirements: 4.2, 4.3, 6.2, 6.5, 6.6_
  - [x] 3.3 Add WebSocket handler in `server/index.js`
    - Use the `ws` package to upgrade connections at `/ws/transcribe`
    - On connection, pipe incoming binary frames into `transcribe.startTranscriptionSession`
    - Forward each yielded transcript event as a JSON message to the client
    - On Transcribe error, send `{ type: 'error', message }` and close the connection
    - On client disconnect, close the Transcribe session
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 6.3_

- [x] 4. Build core React component structure and state
  - Create `client/src/App.jsx` with all application state using `useState`:
    - `question`, `sessionState` (`'idle' | 'active' | 'ended'`), `transcription`, `feedback`, `isLoadingQuestion`, `isLoadingFeedback`, `error`
  - Create stub components: `QuestionPanel`, `SessionPanel`, `FeedbackPanel` — each accepts props from `App`
  - Wire the component tree: `App` renders `QuestionPanel`, `SessionPanel`, and `FeedbackPanel` in a single-column layout
  - Apply global CSS: black and white color scheme (`#000` / `#fff`), system font stack, generous white space, max-width centered layout for laptop screens
  - _Requirements: 5.1, 5.2, 5.6_

- [x] 5. Implement QuestionPanel and SessionPanel with session lifecycle
  - [x] 5.1 Implement `QuestionPanel`
    - Render "Generate Question" button; on click, call `POST /api/question` and update `question` state
    - Show a loading indicator while `isLoadingQuestion` is true
    - Display the returned question text in a styled display area
    - Disable the button when `sessionState === 'active'`
    - Display `error` message in place of question text on failure
    - _Requirements: 1.3, 1.4, 1.5, 5.3, 5.4, 5.7_
  - [x] 5.2 Implement `SessionPanel` with Timer and TranscriptionDisplay
    - Render "Start Practice Session" / "Stop Session" buttons, toggling based on `sessionState`
    - On "Start": request microphone via `getUserMedia`, on grant open a WebSocket to `/ws/transcribe`, start streaming PCM audio chunks (~100ms), start a `setInterval` timer counting elapsed seconds
    - On "Stop": close the WebSocket, stop the media stream, clear the interval, set `sessionState` to `'ended'`
    - Display elapsed time formatted as `MM:SS` using a pure formatting function
    - Display cumulative transcription text, appending each `transcript` WebSocket message
    - Show microphone permission error message if `getUserMedia` is denied
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.2, 3.4, 3.5, 3.6, 3.7_

- [x] 6. Implement FeedbackPanel and post-session analysis flow
  - In `App.jsx`, add a `useEffect` that fires when `sessionState` changes to `'ended'`: if `transcription` is non-empty, call `POST /api/analyze` with `question` and `transcription`, set `feedback` on success, set `error` on failure; if `transcription` is empty, set an informational message instead
  - Clear `feedback` and `transcription` when a new session starts (`sessionState` → `'active'`)
  - Implement `FeedbackPanel`:
    - Show a loading indicator while `isLoadingFeedback` is true
    - Render four sections: STAR Analysis, Strengths, Areas for Improvement, Actionable Tips
    - In STAR Analysis, render each of the four components with visually distinct styling for present (`true`) vs. missing (`false`) — e.g., filled vs. outlined badge
    - Render `strengths`, `areasForImprovement`, and `actionableTips` as simple lists
    - Display error message in the panel on analysis failure
    - Show "no speech detected" message when transcription was empty
  - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.7, 4.8, 5.5, 5.7_

- [x] 7. Final integration and wiring checkpoint
  - Verify the full session flow end-to-end: generate question → start session → speak → stop session → receive feedback
  - Confirm "Generate Question" is disabled during an active session and re-enabled after
  - Confirm feedback panel clears when a new session starts
  - Confirm AWS credentials are read from `.env` and never appear in source files
  - Confirm all UI elements are present on a single page with the black and white color scheme
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.4, 5.2, 5.5, 6.4_

## Notes

- Tasks are scoped for ~1 hour total implementation time — no unit tests, no auth, no persistence
- AWS credentials must be set in `.env` before running; the app will not start without them
- Audio format for Transcribe: PCM 16-bit signed, 16kHz, mono — capture this via `AudioWorklet` or `ScriptProcessorNode` in the browser
- The Bedrock `analyzeResponse` function must parse the model's text output as JSON; wrap the parse in a try/catch and surface a clear error if the model returns malformed JSON
- Keep all components in a single `src/` flat structure — no deep nesting needed for this scope

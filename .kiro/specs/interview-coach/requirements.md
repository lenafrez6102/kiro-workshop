# Requirements Document

## Introduction

The AI Interview Coach is a single-user, browser-based application that helps college students and entry-level candidates practice behavioral interview questions. The user generates a question, records a spoken response via microphone, sees a live transcription of their words, and receives AI-generated feedback that evaluates the response against the STAR format (Situation, Task, Action, Result). The application is ephemeral — no data is persisted between sessions. It uses AWS Bedrock (Amazon Nova Pro) for question generation and response analysis, and AWS Transcribe for real-time speech-to-text.

## Glossary

- **Application**: The AI Interview Coach web application as a whole.
- **Frontend**: The React/Vite single-page application running in the user's browser.
- **Backend**: The Node.js/Express server that mediates communication with AWS services.
- **Question_Generator**: The backend service that calls AWS Bedrock to produce a behavioral interview question.
- **Transcription_Service**: The backend service that opens a WebSocket connection to AWS Transcribe and streams audio from the browser.
- **Response_Analyzer**: The backend service that calls AWS Bedrock to evaluate a transcribed response.
- **Session**: A single practice attempt that begins when the user starts recording and ends when the user stops recording.
- **STAR_Format**: A structured response framework consisting of four components — Situation, Task, Action, and Result.
- **Transcription**: The text produced by AWS Transcribe from the user's spoken audio during a Session.
- **Feedback**: The structured analysis produced by the Response_Analyzer after a Session ends.
- **Timer**: The UI element that displays elapsed time since the Session started.
- **Behavioral_Question**: An interview question that asks the candidate to describe a past experience (e.g., "Tell me about a time when…").

---

## Requirements

### Requirement 1: Question Generation

**User Story:** As a college student, I want to generate a realistic behavioral interview question, so that I have a relevant prompt to practice answering.

#### Acceptance Criteria

1. WHEN the user clicks "Generate Question", THE Question_Generator SHALL send a request to AWS Bedrock using model `amazon.nova-pro-v1:0` in region `us-east-1`.
2. WHEN the user clicks "Generate Question", THE Question_Generator SHALL return a single Behavioral_Question drawn from one of the following categories: leadership, teamwork, conflict resolution, problem-solving, failure/learning, or time management.
3. WHEN a Behavioral_Question is returned, THE Frontend SHALL display the question text in the question display area.
4. WHEN the user clicks "Generate Question" while a Session is active, THE Frontend SHALL disable the "Generate Question" button so that the question cannot change mid-session.
5. IF the AWS Bedrock request fails, THEN THE Question_Generator SHALL return an error response, and THE Frontend SHALL display a user-readable error message in place of the question.
6. THE Question_Generator SHALL generate questions appropriate in scope and vocabulary for college students and entry-level candidates.

---

### Requirement 2: Practice Session Lifecycle

**User Story:** As a college student, I want to start and stop a timed practice session, so that I can record my spoken response at my own pace.

#### Acceptance Criteria

1. WHEN the user clicks "Start Practice Session", THE Frontend SHALL request microphone access from the browser.
2. WHEN microphone access is granted, THE Frontend SHALL begin a Session and start the Timer.
3. WHEN a Session is active, THE Frontend SHALL display the "Stop Session" button and hide the "Start Practice Session" button.
4. WHEN the user clicks "Stop Session", THE Frontend SHALL end the Session, stop the Timer, and stop audio capture.
5. WHILE a Session is active, THE Timer SHALL display the elapsed time in MM:SS format, updating every second.
6. IF microphone access is denied by the user, THEN THE Frontend SHALL display a message instructing the user to enable microphone permissions and SHALL NOT start a Session.
7. WHEN a Session ends, THE Frontend SHALL display the "Start Practice Session" button and hide the "Stop Session" button.

---

### Requirement 3: Real-Time Transcription

**User Story:** As a college student, I want to see my spoken words transcribed in real time, so that I can confirm my response is being captured correctly.

#### Acceptance Criteria

1. WHEN a Session starts, THE Transcription_Service SHALL open a WebSocket connection to AWS Transcribe Streaming in region `us-east-1`.
2. WHILE a Session is active, THE Frontend SHALL stream audio data from the microphone to the Backend over a WebSocket connection.
3. WHILE a Session is active, THE Transcription_Service SHALL forward audio chunks to AWS Transcribe and receive partial and final transcript results.
4. WHEN a transcript result is received from AWS Transcribe, THE Backend SHALL send the transcript text to the Frontend over the WebSocket connection.
5. WHEN transcript text is received by the Frontend, THE Frontend SHALL display the cumulative Transcription in the transcription display area, updating in real time.
6. WHEN a Session ends, THE Transcription_Service SHALL close the AWS Transcribe WebSocket connection.
7. IF the WebSocket connection to AWS Transcribe is interrupted during a Session, THEN THE Backend SHALL send an error event to the Frontend, and THE Frontend SHALL display a message indicating that transcription was interrupted.

---

### Requirement 4: AI Coach Feedback

**User Story:** As a college student, I want to receive structured feedback on my response after a session, so that I can understand how well I used the STAR format and how to improve.

#### Acceptance Criteria

1. WHEN a Session ends and a non-empty Transcription is available, THE Frontend SHALL automatically submit the Transcription and the current Behavioral_Question to the Response_Analyzer.
2. WHEN the Response_Analyzer receives a Transcription and Behavioral_Question, THE Response_Analyzer SHALL send a request to AWS Bedrock using model `amazon.nova-pro-v1:0` in region `us-east-1`.
3. WHEN the AWS Bedrock response is received, THE Response_Analyzer SHALL return a Feedback object containing the following fields:
   - `starAnalysis`: an object with four boolean or descriptive fields — `situation`, `task`, `action`, `result` — indicating whether each STAR component was present in the response.
   - `strengths`: a list of one or more specific things the user did well.
   - `areasForImprovement`: a list of specific gaps or weaknesses identified in the response.
   - `actionableTips`: a list of exactly two or three concrete, actionable suggestions for improvement.
4. WHEN Feedback is received by the Frontend, THE Frontend SHALL display the Feedback in the feedback panel, organized into the four sections: STAR Analysis, Strengths, Areas for Improvement, and Actionable Tips.
5. WHEN displaying the STAR Analysis, THE Frontend SHALL visually distinguish components that were present from components that were missing.
6. THE Response_Analyzer SHALL use an encouraging, coach-like tone in all generated text within the Feedback.
7. IF a Session ends with an empty Transcription, THEN THE Frontend SHALL display a message indicating that no speech was detected and SHALL NOT submit a request to the Response_Analyzer.
8. IF the AWS Bedrock request for analysis fails, THEN THE Response_Analyzer SHALL return an error response, and THE Frontend SHALL display a user-readable error message in the feedback panel.

---

### Requirement 5: User Interface Layout and Design

**User Story:** As a college student, I want a clean, simple interface, so that I can focus on practicing without distraction.

#### Acceptance Criteria

1. THE Frontend SHALL use a black and white color scheme throughout the Application.
2. THE Frontend SHALL present the following interactive elements on a single page: "Generate Question" button, question display area, "Start Practice Session" button, "Stop Session" button, transcription display area, Timer, and feedback panel.
3. WHILE no Session has been started and no question has been generated, THE Frontend SHALL display the "Generate Question" button as the primary call to action.
4. WHILE a Session is active, THE Frontend SHALL disable the "Generate Question" button.
5. WHILE a Session is active and the feedback panel contains content from a previous Session, THE Frontend SHALL clear the feedback panel.
6. THE Frontend SHALL use adequate white space and a minimalist layout optimized for laptop screen sizes.
7. WHEN the Application is loading a response from AWS Bedrock or AWS Transcribe, THE Frontend SHALL display a loading indicator to the user.

---

### Requirement 6: Backend API

**User Story:** As a developer, I want well-defined backend endpoints, so that the Frontend can reliably communicate with AWS services.

#### Acceptance Criteria

1. THE Backend SHALL expose a REST endpoint `POST /api/question` that accepts an optional category parameter and returns a generated Behavioral_Question.
2. THE Backend SHALL expose a REST endpoint `POST /api/analyze` that accepts a `question` string and a `transcription` string and returns a Feedback object.
3. THE Backend SHALL expose a WebSocket endpoint at `/ws/transcribe` that accepts audio data from the Frontend and streams transcript events back.
4. THE Backend SHALL load AWS credentials from environment variables and SHALL NOT hard-code credentials in source files.
5. IF a request to `POST /api/question` or `POST /api/analyze` is received with missing required fields, THEN THE Backend SHALL return an HTTP 400 response with a descriptive error message.
6. IF an AWS service call within any endpoint fails, THEN THE Backend SHALL return an appropriate HTTP error response with a descriptive error message.

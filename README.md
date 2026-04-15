# AI Interview Coach

A single-page web application that helps college students and entry-level candidates practice behavioral interview questions. Generate realistic interview questions, record spoken responses with real-time transcription, and receive AI-powered feedback based on the STAR framework (Situation, Task, Action, Result).

## Quick Start

```bash
# 1. Install Ollama
brew install ollama

# 2. Start Ollama and download model
ollama serve
ollama pull llama3.2

# 3. Install dependencies
npm run install:all

# 4. Start the application
npm run dev

# 5. Open http://localhost:5173 in Chrome or Edge
```

## Features

- **AI Question Generation** - Generate behavioral interview questions across multiple categories (leadership, teamwork, conflict resolution, problem-solving, failure/learning, time management)
- **Real-Time Speech Transcription** - Practice speaking your answers with live transcription using the Web Speech API
- **STAR Framework Analysis** - Get structured feedback analyzing your response against the STAR format
- **Actionable Coaching** - Receive encouraging feedback with specific strengths, areas for improvement, and 2-3 actionable tips
- **Session Timer** - Track your response time with a built-in timer
- **Clean, Minimalist UI** - Black and white design optimized for laptop screens with no distractions

## Tech Stack

### Frontend
- **React** with Vite
- **Web Speech API** for browser-based speech recognition
- Single-page application with ephemeral state (no persistence)

### Backend
- **Node.js** with Express
- **Ollama** for local AI inference (no API keys required!)
- REST API for question generation and response analysis

### AI Models
- **Ollama** running locally with llama3.2 (3.2B parameter model)
- Completely free and runs offline after initial model download

## Prerequisites

- **Node.js** (v18 or higher)
- **Ollama** (for local AI)
- **Chrome or Edge browser** (for Web Speech API support)

## Installation

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### 2. Start Ollama and download the model

```bash
# Start Ollama service (runs in background)
ollama serve

# Download llama3.2 model (~2GB)
ollama pull llama3.2
```

### 3. Install project dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install:all
```

Or install individually:

```bash
# Install concurrently for running both servers
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

## Running the Application

### Option 1: Start both servers at once (recommended)

```bash
# From the project root
npm run dev
```

This will start both the backend (port 3001) and frontend (port 5173) simultaneously.

### Option 2: Start servers separately

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run dev
```

### Open in browser

Navigate to **http://localhost:5173** in Chrome or Edge.

## Usage

1. **Generate a Question**
   - Click "Generate Question" to get a behavioral interview question
   - Questions are tailored for college students and entry-level candidates

2. **Start Practice Session**
   - Click "Start Practice Session" and grant microphone access
   - The timer will start counting
   - Begin speaking your answer

3. **See Live Transcription**
   - Your words appear in real-time as you speak
   - Only final transcripts are shown (no duplication)

4. **Stop and Get Feedback**
   - Click "Stop Session" when you're done
   - AI analyzes your response automatically
   - Review your STAR analysis, strengths, areas for improvement, and actionable tips

5. **Practice Again**
   - Generate a new question to start another practice session
   - Previous feedback clears when you start a new session

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── QuestionPanel.jsx
│   │   ├── SessionPanel.jsx
│   │   ├── FeedbackPanel.jsx
│   │   └── index.css
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── routes/
│   │   ├── question.js    # POST /api/question
│   │   └── analyze.js     # POST /api/analyze
│   ├── services/
│   │   └── ollama.js      # Ollama AI service wrapper
│   ├── index.js
│   └── package.json
│
└── .kiro/                  # Spec-driven development artifacts
    └── specs/
        └── interview-coach/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## API Endpoints

### `POST /api/question`

Generate a behavioral interview question.

**Request:**
```json
{
  "category": "leadership"  // optional
}
```

**Response:**
```json
{
  "question": "Tell me about a time when you had to lead a team through a difficult situation."
}
```

### `POST /api/analyze`

Analyze a candidate's response using the STAR framework.

**Request:**
```json
{
  "question": "Tell me about a time when...",
  "transcription": "Last year I was working on a project..."
}
```

**Response:**
```json
{
  "starAnalysis": {
    "situation": true,
    "task": false,
    "action": true,
    "result": true
  },
  "strengths": [
    "Clear description of the situation",
    "Specific actions taken"
  ],
  "areasForImprovement": [
    "Task component was not clearly stated"
  ],
  "actionableTips": [
    "Start by explicitly stating what your role was in the situation.",
    "End with a quantifiable result to make your answer more impactful."
  ]
}
```

## Testing

### Run property-based tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

Tests use **fast-check** for property-based testing with 100+ iterations per property.

## Design Principles

- **Ephemeral by design** - No database, no authentication, no persistence
- **Privacy-first** - All AI processing happens locally via Ollama
- **Minimal dependencies** - Lightweight stack with no unnecessary libraries
- **Encouraging tone** - Feedback is supportive and coach-like, not evaluative
- **Single-user focus** - Optimized for individual practice sessions

## Troubleshooting

### "Failed to generate question" error

- Make sure Ollama is running: `ollama serve`
- Check if llama3.2 is installed: `ollama list`
- Verify Ollama is accessible: `curl http://localhost:11434/api/tags`

### "Speech recognition is not supported" error

- Use Chrome or Edge browser
- Ensure you're accessing via `localhost` or HTTPS (required for microphone access)

### Microphone not working

- Grant microphone permissions when prompted
- Check browser settings: Settings → Privacy → Microphone
- Ensure no other application is using the microphone

### Slow AI responses

- First request loads the model into memory (~10-30 seconds)
- Subsequent requests are faster (~2-5 seconds)
- Consider using a smaller model if needed: `ollama pull llama3.2:1b`

## Alternative Configurations

### Using AWS Bedrock instead of Ollama

If you prefer cloud-based AI:

1. Set up AWS credentials
2. Replace `server/services/ollama.js` with AWS Bedrock client
3. Update environment variables in `.env`

### Using OpenAI instead of Ollama

1. Get an OpenAI API key
2. Replace Ollama calls with OpenAI API calls
3. Add `OPENAI_API_KEY` to `.env`

## Contributing

This project was built using spec-driven development. See `.kiro/specs/interview-coach/` for the full requirements, design, and implementation plan.

## Acknowledgments

- Built with [Ollama](https://ollama.ai) for local AI inference
- Uses [llama3.2](https://ollama.ai/library/llama3.2) by Meta
- Transcription powered by Web Speech API

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env from project root FIRST, before any other imports
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

// Now import everything else
import express from 'express'
import questionRouter from './routes/question.js'
import analyzeRouter from './routes/analyze.js'

const app = express()
const PORT = 3001

app.use(express.json())

// Register REST routes
app.use('/api/question', questionRouter)
app.use('/api/analyze', analyzeRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
  console.log('Using Ollama for AI (http://localhost:11434)')
  console.log('Using Web Speech API for transcription (browser-based)')
})

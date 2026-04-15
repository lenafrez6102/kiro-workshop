import express from 'express'
import { analyzeResponse } from '../services/ollama.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { question, transcription } = req.body || {}

  const missingFields = []
  if (!question) missingFields.push('question')
  if (!transcription) missingFields.push('transcription')

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`,
    })
  }

  try {
    const feedback = await analyzeResponse(question, transcription)
    res.json(feedback)
  } catch (err) {
    res.status(500).json({ error: `Failed to analyze response: ${err.message}` })
  }
})

export default router

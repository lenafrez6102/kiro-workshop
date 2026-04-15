import express from 'express'
import { generateQuestion } from '../services/ollama.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const { category } = req.body || {}

  try {
    const question = await generateQuestion(category)
    res.json({ question })
  } catch (err) {
    res.status(500).json({ error: `Failed to generate question: ${err.message}` })
  }
})

export default router

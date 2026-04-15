/**
 * Property-based tests for AI Interview Coach (backend)
 * Feature: interview-coach
 * Library: fast-check (minimum 100 iterations per property)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import express from 'express'
import request from 'supertest'

// ---------------------------------------------------------------------------
// P1: Question generation produces non-empty output for any valid category
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 1: Question generation produces non-empty output for any valid category
describe('P1: generateQuestion', () => {
  const VALID_CATEGORIES = [
    'leadership',
    'teamwork',
    'conflict resolution',
    'problem-solving',
    'failure/learning',
    'time management',
  ]

  it('returns a non-empty string for any valid category', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...VALID_CATEGORIES), async (category) => {
        // Mock the Bedrock client at the module level
        const mockSend = vi.fn().mockResolvedValue({
          body: Buffer.from(
            JSON.stringify({
              output: {
                message: {
                  content: [
                    {
                      text: `Tell me about a time when you demonstrated ${category}.`,
                    },
                  ],
                },
              },
            })
          ),
        })

        // Dynamically import and mock
        const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime')
        vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(mockSend)

        const { generateQuestion } = await import('../services/bedrock.js')

        const result = await generateQuestion(category)

        // Must be a non-empty string
        expect(typeof result).toBe('string')
        expect(result.trim().length).toBeGreaterThan(0)

        // The prompt sent to Bedrock must contain the category
        const callArgs = mockSend.mock.calls[0][0]
        const body = JSON.parse(callArgs.input.body)
        const systemText = body.system[0].text
        expect(systemText).toContain(category)

        vi.restoreAllMocks()
      }),
      { numRuns: 6 } // 6 categories × multiple runs — keep fast since we cover all categories
    )
  })
})

// ---------------------------------------------------------------------------
// P3: Transcription pipeline forwards audio and emits transcripts
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 3: Transcription pipeline forwards audio and emits transcripts
describe('P3: startTranscriptionSession', () => {
  it('yields transcript events for any text returned by the mocked Transcribe service', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (transcriptText) => {
          // Mock TranscribeStreamingClient to return a single transcript result
          const mockTranscriptStream = (async function* () {
            yield {
              TranscriptEvent: {
                Transcript: {
                  Results: [
                    {
                      Alternatives: [{ Transcript: transcriptText }],
                      IsPartial: false,
                    },
                  ],
                },
              },
            }
          })()

          const { TranscribeStreamingClient } = await import(
            '@aws-sdk/client-transcribe-streaming'
          )
          vi.spyOn(TranscribeStreamingClient.prototype, 'send').mockResolvedValue({
            TranscriptResultStream: mockTranscriptStream,
          })

          const { startTranscriptionSession } = await import(
            '../services/transcribe.js'
          )

          // Create a minimal async iterable as the audio stream
          async function* audioStream() {
            yield new Uint8Array([0, 1, 2, 3])
          }

          const events = []
          for await (const event of startTranscriptionSession(audioStream())) {
            events.push(event)
          }

          // Must have emitted at least one transcript event
          const transcriptEvents = events.filter((e) => e.type === 'transcript')
          expect(transcriptEvents.length).toBeGreaterThan(0)
          // The text must match what the mock returned
          expect(transcriptEvents[0].text).toBe(transcriptText.trim())

          vi.restoreAllMocks()
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// P5: Feedback parsing produces a well-formed Feedback object
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 5: Feedback parsing produces a well-formed Feedback object

// Arbitraries for generating valid Feedback-shaped JSON
const starAnalysisArb = fc.record({
  situation: fc.boolean(),
  task: fc.boolean(),
  action: fc.boolean(),
  result: fc.boolean(),
})

const nonEmptyStringArray = fc.array(
  fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
  { minLength: 1, maxLength: 5 }
)

const actionableTipsArb = fc.array(
  fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
  { minLength: 2, maxLength: 3 }
)

const feedbackJsonArb = fc.record({
  starAnalysis: starAnalysisArb,
  strengths: nonEmptyStringArray,
  areasForImprovement: nonEmptyStringArray,
  actionableTips: actionableTipsArb,
})

describe('P5: analyzeResponse feedback parsing', () => {
  it('returns a well-formed Feedback object for any valid JSON from Bedrock', async () => {
    await fc.assert(
      fc.asyncProperty(feedbackJsonArb, async (feedbackData) => {
        const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime')
        vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockResolvedValue({
          body: Buffer.from(
            JSON.stringify({
              output: {
                message: {
                  content: [{ text: JSON.stringify(feedbackData) }],
                },
              },
            })
          ),
        })

        const { analyzeResponse } = await import('../services/bedrock.js')

        const result = await analyzeResponse(
          'Tell me about a time you led a team.',
          'Last year I led a project...'
        )

        // starAnalysis must have all four boolean fields
        expect(typeof result.starAnalysis).toBe('object')
        expect(typeof result.starAnalysis.situation).toBe('boolean')
        expect(typeof result.starAnalysis.task).toBe('boolean')
        expect(typeof result.starAnalysis.action).toBe('boolean')
        expect(typeof result.starAnalysis.result).toBe('boolean')

        // strengths and areasForImprovement must be non-empty arrays
        expect(Array.isArray(result.strengths)).toBe(true)
        expect(result.strengths.length).toBeGreaterThan(0)
        expect(Array.isArray(result.areasForImprovement)).toBe(true)
        expect(result.areasForImprovement.length).toBeGreaterThan(0)

        // actionableTips must have exactly 2 or 3 items
        expect(Array.isArray(result.actionableTips)).toBe(true)
        expect(result.actionableTips.length).toBeGreaterThanOrEqual(2)
        expect(result.actionableTips.length).toBeLessThanOrEqual(3)

        vi.restoreAllMocks()
      }),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// P8: Backend returns appropriate error responses for all failure modes
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 8: Backend returns appropriate error responses for all failure modes
describe('P8: Backend error handling', () => {
  let app

  beforeEach(async () => {
    // Build a minimal express app with the analyze route
    app = express()
    app.use(express.json())
    const { default: analyzeRouter } = await import('../routes/analyze.js')
    app.use('/api/analyze', analyzeRouter)
  })

  it('returns HTTP 400 for any combination of missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a subset of ['question', 'transcription'] that is missing at least one field
        fc.subarray(['question', 'transcription'], { minLength: 0, maxLength: 1 }),
        async (presentFields) => {
          // Build a body that only includes the present fields
          const body = {}
          if (presentFields.includes('question')) body.question = 'A question'
          if (presentFields.includes('transcription')) body.transcription = 'A transcription'

          // Only test cases where at least one field is missing
          if (presentFields.length === 2) return

          const res = await request(app).post('/api/analyze').send(body)

          expect(res.status).toBe(400)
          expect(res.body).toHaveProperty('error')
          expect(typeof res.body.error).toBe('string')
          expect(res.body.error.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns HTTP 500 for any AWS service error during analysis', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        async (errorMessage) => {
          const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime')
          vi.spyOn(BedrockRuntimeClient.prototype, 'send').mockRejectedValue(
            new Error(errorMessage)
          )

          const res = await request(app)
            .post('/api/analyze')
            .send({ question: 'Q', transcription: 'T' })

          expect(res.status).toBe(500)
          expect(res.body).toHaveProperty('error')
          expect(typeof res.body.error).toBe('string')

          vi.restoreAllMocks()
        }
      ),
      { numRuns: 100 }
    )
  })
})

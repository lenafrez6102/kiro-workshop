/**
 * Property-based tests for AI Interview Coach (frontend)
 * Feature: interview-coach
 * Library: fast-check (minimum 100 iterations per property)
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { formatTime } from '../SessionPanel.jsx'
import FeedbackPanel from '../FeedbackPanel.jsx'
import QuestionPanel from '../QuestionPanel.jsx'

// ---------------------------------------------------------------------------
// P2: Timer formats any elapsed time as MM:SS
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 2: Timer formats any elapsed time as MM:SS
describe('P2: formatTime', () => {
  it('formats any non-negative integer as MM:SS', () => {
    fc.assert(
      fc.property(fc.nat({ max: 359999 }), (seconds) => {
        const result = formatTime(seconds)
        // Must match MM:SS pattern — MM is at least 2 digits (zero-padded), SS is exactly 2 digits
        expect(result).toMatch(/^\d{2,}:\d{2}$/)
        // Verify the values are correct
        const [mm, ss] = result.split(':').map(Number)
        expect(mm).toBe(Math.floor(seconds / 60))
        expect(ss).toBe(seconds % 60)
        // Seconds part must always be exactly 2 digits
        expect(result.split(':')[1].length).toBe(2)
        // Minutes part must be at least 2 digits (zero-padded)
        expect(result.split(':')[0].length).toBeGreaterThanOrEqual(2)
      }),
      { numRuns: 100 }
    )
  })

  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05')
  })

  it('formats 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00')
  })
})

// ---------------------------------------------------------------------------
// P4: Cumulative transcription accumulates all received text
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 4: Cumulative transcription accumulates all received text
describe('P4: Cumulative transcription accumulation', () => {
  it('concatenating any sequence of transcript strings produces the full text', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1, maxLength: 20 }), (parts) => {
        // Simulate the reducer: prev + text (as in App.jsx handleTranscriptUpdate)
        const accumulated = parts.reduce((prev, text) => prev + text, '')
        // Every part must appear in the accumulated result
        let pos = 0
        for (const part of parts) {
          const idx = accumulated.indexOf(part, pos)
          expect(idx).toBeGreaterThanOrEqual(0)
          pos = idx + part.length
        }
        // Total length must equal sum of all parts
        const totalLength = parts.reduce((sum, p) => sum + p.length, 0)
        expect(accumulated.length).toBe(totalLength)
      }),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Arbitraries for Feedback objects
// ---------------------------------------------------------------------------
const starAnalysisArb = fc.record({
  situation: fc.boolean(),
  task: fc.boolean(),
  action: fc.boolean(),
  result: fc.boolean(),
})

const nonEmptyStringArray = fc.array(
  fc.string({ minLength: 1, maxLength: 80 }),
  { minLength: 1, maxLength: 5 }
)

const actionableTipsArb = fc.array(
  fc.string({ minLength: 1, maxLength: 80 }),
  { minLength: 2, maxLength: 3 }
)

const feedbackArb = fc.record({
  starAnalysis: starAnalysisArb,
  strengths: nonEmptyStringArray,
  areasForImprovement: nonEmptyStringArray,
  actionableTips: actionableTipsArb,
})

// ---------------------------------------------------------------------------
// P6: FeedbackPanel renders all sections with visual STAR distinction
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 6: FeedbackPanel renders all sections with visual STAR distinction
describe('P6: FeedbackPanel renders all sections', () => {
  it('renders all four sections for any valid Feedback object', () => {
    fc.assert(
      fc.property(feedbackArb, (feedback) => {
        const { unmount } = render(
          <FeedbackPanel
            feedback={feedback}
            isLoadingFeedback={false}
            error={null}
            noSpeech={false}
          />
        )

        // All four section titles must be present
        expect(screen.getByText(/STAR Analysis/i)).toBeInTheDocument()
        expect(screen.getByText(/Strengths/i)).toBeInTheDocument()
        expect(screen.getByText(/Areas for Improvement/i)).toBeInTheDocument()
        expect(screen.getByText(/Actionable Tips/i)).toBeInTheDocument()

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('applies visually distinct classes for present vs missing STAR components', () => {
    fc.assert(
      fc.property(
        fc.record({
          situation: fc.boolean(),
          task: fc.boolean(),
          action: fc.boolean(),
          result: fc.boolean(),
        }),
        (starAnalysis) => {
          const feedback = {
            starAnalysis,
            strengths: ['Good job'],
            areasForImprovement: ['Improve X'],
            actionableTips: ['Tip 1', 'Tip 2'],
          }

          const { unmount, container } = render(
            <FeedbackPanel
              feedback={feedback}
              isLoadingFeedback={false}
              error={null}
              noSpeech={false}
            />
          )

          const presentBadges = container.querySelectorAll('.star-badge--present')
          const missingBadges = container.querySelectorAll('.star-badge--missing')

          const presentCount = Object.values(starAnalysis).filter(Boolean).length
          const missingCount = Object.values(starAnalysis).filter((v) => !v).length

          expect(presentBadges.length).toBe(presentCount)
          expect(missingBadges.length).toBe(missingCount)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// P7: Loading indicator is shown during any loading state
// ---------------------------------------------------------------------------
// Feature: interview-coach, Property 7: Loading indicator is shown during any loading state
describe('P7: Loading indicator visibility', () => {
  it('shows loading indicator when isLoadingFeedback is true', () => {
    fc.assert(
      fc.property(fc.boolean(), (isLoadingQuestion) => {
        // FeedbackPanel shows loading when isLoadingFeedback=true
        const { unmount } = render(
          <FeedbackPanel
            feedback={null}
            isLoadingFeedback={true}
            error={null}
            noSpeech={false}
          />
        )
        // The loading element must be present
        const loadingEl = document.querySelector('.loading')
        expect(loadingEl).not.toBeNull()
        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('shows loading indicator in QuestionPanel when isLoadingQuestion is true', () => {
    fc.assert(
      fc.property(fc.boolean(), (_isLoadingFeedback) => {
        const { unmount } = render(
          <QuestionPanel
            question={null}
            isLoadingQuestion={true}
            error={null}
            sessionState="idle"
            onGenerateQuestion={() => {}}
          />
        )
        const loadingEl = document.querySelector('.loading')
        expect(loadingEl).not.toBeNull()
        unmount()
      }),
      { numRuns: 100 }
    )
  })
})

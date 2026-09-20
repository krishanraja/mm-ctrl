import { describe, expect, it } from 'vitest'
import {
  projectPreparedStandardReview,
  StandardReviewProjectionError,
} from './contract'

const UUID = '11111111-1111-4111-8111-111111111111'
const SHA = 'a'.repeat(64)

function prepared() {
  return {
    action: 'prepare',
    result: {
      review_packet_id: UUID,
      review_packet_sha256: SHA,
      planned_standard_sha256: SHA,
      state: 'ready',
      active_standard_mutated: false,
      deploy_authorized: false,
      release_authorized: false,
      packet: {
        schema: 'ctrl.standard-change.owner-review.v1',
        presentation: {
          schema: 'ctrl.standard-change.owner-review.presentation.v1',
          question: 'Should this be your proposal rule?',
          headline: 'Two strong proposals waited for a review that changed nothing.',
          current_rule: 'Review every customer-facing proposal.',
          proposed_rule: 'Review proposals above £250,000 or changes to the company promise.',
          consequence: 'Routine proposals can move once the result, evidence and owner are named.',
          risk_if_wrong: 'A proposal below the threshold could still carry material brand risk.',
          validation: 'Review the next five proposals and inspect every exception.',
          alternative_explanations: ['The team may already be applying the standard inconsistently.'],
          evidence: [
            {
              source_id: 'review-1',
              label: 'Renewal proposal review',
              statement: 'A £90,000 renewal proposal waited 36 hours and needed no substantive change.',
              occurred_at: '2026-09-17T09:00:00+00:00',
              relationship: 'supports',
            },
            {
              source_id: 'review-2',
              label: 'Expansion proposal review',
              statement: 'A £120,000 expansion proposal waited a day and needed no substantive change.',
              occurred_at: '2026-09-18T09:00:00+00:00',
              relationship: 'supports',
            },
          ],
        },
        consequences: {
          new_active_standard_version: true,
          reversible_while_current_head: true,
          deploy_authorized: false,
          release_authorized: false,
        },
      },
    },
  }
}

describe('projectPreparedStandardReview', () => {
  it('projects a complete, authority-bound packet without inventing display copy', () => {
    const input = prepared()
    const view = projectPreparedStandardReview(input)

    expect(view.question).toBe(input.result.packet.presentation.question)
    expect(view.proposed_rule).toBe(input.result.packet.presentation.proposed_rule)
    expect(view.evidence).toEqual(input.result.packet.presentation.evidence)
    expect(view.reviewPacketSha256).toBe(SHA)
    expect(view.reversibleWhileCurrent).toBe(true)
  })

  it('rejects a legacy R116 packet that has authority but no presentation truth', () => {
    const input = prepared()
    delete (input.result.packet as { presentation?: unknown }).presentation

    expect(() => projectPreparedStandardReview(input)).toThrow(StandardReviewProjectionError)
  })

  it('rejects missing source language rather than filling it with generic advice', () => {
    const input = prepared()
    input.result.packet.presentation.evidence[0].statement = ''

    expect(() => projectPreparedStandardReview(input)).toThrow(StandardReviewProjectionError)
  })

  it('rejects a packet that suggests deployment or release authority', () => {
    const input = prepared()
    const consequences = input.result.packet.consequences as Record<string, unknown>
    consequences.deploy_authorized = true

    expect(() => projectPreparedStandardReview(input)).toThrow(StandardReviewProjectionError)
  })
})

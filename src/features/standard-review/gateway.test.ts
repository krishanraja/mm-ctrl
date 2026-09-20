import { describe, expect, it } from 'vitest'
import { StandardReviewGateway, StandardReviewGatewayError } from './gateway'

const UUID = '11111111-1111-4111-8111-111111111111'
const SHA = 'a'.repeat(64)

const packet = {
  action: 'prepare' as const,
  result: {
    review_packet_id: UUID,
    review_packet_sha256: SHA,
    planned_standard_sha256: SHA,
    state: 'ready' as const,
    active_standard_mutated: false as const,
    deploy_authorized: false as const,
    release_authorized: false as const,
    packet: {
      schema: 'ctrl.standard-change.owner-review.v1' as const,
      presentation: {
        schema: 'ctrl.standard-change.owner-review.presentation.v1' as const,
        question: 'Should this be your proposal rule?',
        headline: 'Two strong proposals waited for a review that changed nothing.',
        current_rule: 'Review every customer-facing proposal.',
        proposed_rule: 'Review only high-risk proposals.',
        consequence: 'Routine proposals move once the result, evidence and owner are named.',
        risk_if_wrong: 'A routine-looking proposal may still carry material brand risk.',
        validation: 'Inspect the next five proposals and every exception.',
        alternative_explanations: ['The standard may be applied inconsistently.'],
        evidence: [
          {
            source_id: 'review-1',
            label: 'Renewal proposal review',
            statement: 'A £90,000 proposal waited 36 hours and needed no substantive change.',
            occurred_at: '2026-09-17T09:00:00+00:00',
            relationship: 'supports' as const,
          },
          {
            source_id: 'review-2',
            label: 'Expansion proposal review',
            statement: 'A £120,000 proposal waited a day and needed no substantive change.',
            occurred_at: '2026-09-18T09:00:00+00:00',
            relationship: 'supports' as const,
          },
        ],
      },
      consequences: {
        new_active_standard_version: true as const,
        reversible_while_current_head: true as const,
        deploy_authorized: false as const,
        release_authorized: false as const,
      },
    },
  },
}

describe('StandardReviewGateway', () => {
  it('uses the presentation-bound function and returns exact packet copy', async () => {
    const calls: Array<{ functionName: string; body: Record<string, unknown> }> = []
    const gateway = new StandardReviewGateway({
      async invoke(functionName, options) {
        calls.push({ functionName, body: options.body })
        return { data: packet, error: null }
      },
    })

    const view = await gateway.prepare(UUID, SHA)
    expect(view.proposed_rule).toBe(packet.result.packet.presentation.proposed_rule)
    expect(calls).toEqual([{
      functionName: 'review-standard-change-v2',
      body: { action: 'prepare', check_id: UUID, expected_result_sha256: SHA },
    }])
  })

  it('binds an owner decision to the exact reviewed packet and planned standard hashes', async () => {
    const calls: Array<Record<string, unknown>> = []
    const gateway = new StandardReviewGateway({
      async invoke(_functionName, options) {
        calls.push(options.body)
        if (options.body.action === 'prepare') return { data: packet, error: null }
        return {
          data: {
            action: 'decide',
            result: {
              decision: 'approved',
              application_id: UUID,
              application_hash: SHA,
              active_standard_sha256: SHA,
              reversible_while_current_head: true,
            },
          },
          error: null,
        }
      },
    })

    const review = await gateway.prepare(UUID, SHA)
    await gateway.decide(review, 'approved', 'r118_decision_0001')
    expect(calls[1]).toMatchObject({
      action: 'decide',
      review_packet_id: UUID,
      expected_packet_sha256: SHA,
      expected_standard_sha256: SHA,
      decision: 'approved',
    })
  })

  it('does not turn transport failure into a fake review', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return { data: null, error: { message: 'offline' } }
      },
    })

    await expect(gateway.prepare(UUID, SHA)).rejects.toEqual(
      expect.objectContaining<Partial<StandardReviewGatewayError>>({ code: 'transport_failed' }),
    )
  })

  it('accepts only the receipt shape the reversal RPC actually returns', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return {
          data: {
            action: 'reverse',
            result: {
              restored: true,
              reversal_id: UUID,
              reversal_hash: SHA,
              active_standard_sha256: SHA,
              deploy_authorized: false,
              release_authorized: false,
            },
          },
          error: null,
        }
      },
    })

    await expect(gateway.reverse(UUID, SHA, SHA, 'r118_reversal_request_0001', 'Restore it.')).resolves.toBeUndefined()
  })

  it('rejects the old invented reversal field', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return { data: { action: 'reverse', result: { reversed: true } }, error: null }
      },
    })

    await expect(gateway.reverse(UUID, SHA, SHA, 'r118_reversal_request_0001', 'Restore it.')).rejects.toEqual(
      expect.objectContaining<Partial<StandardReviewGatewayError>>({ code: 'response_invalid' }),
    )
  })

  it('keeps a stale packet distinguishable from an ordinary transport failure', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return { data: null, error: { message: 'state_conflict', code: 'state_conflict' } }
      },
    })

    await expect(gateway.prepare(UUID, SHA)).rejects.toEqual(
      expect.objectContaining<Partial<StandardReviewGatewayError>>({ code: 'state_conflict' }),
    )
  })
})

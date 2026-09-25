import { describe, expect, it, vi } from 'vitest'
import {
  submitDecisionCandidateReview,
  type DecisionCandidateReviewInput,
  type DecisionCandidateReviewTransport,
} from './decisionCandidateReviewGateway'

const candidateId = '14700000-0000-4000-8000-000000000001'
const answerId = '14700000-0000-4000-8000-000000000003'
const base: DecisionCandidateReviewInput = {
  candidateId,
  disposition: 'confirmed',
  reviewedAt: '2026-09-25T06:30:00.000Z',
  idempotencyKey: 'r147:confirm:one',
}

function transport(data: unknown, error: unknown = null) {
  return { invoke: vi.fn().mockResolvedValue({ data, error }) } satisfies DecisionCandidateReviewTransport
}

describe('decision candidate review gateway', () => {
  it('confirms the exact candidate without asking the browser to repeat its text', async () => {
    const client = transport({
      action: 'review_candidate',
      result: { status: 'created', candidate_id: candidateId, candidate_disposition: 'confirmed', answer_id: answerId },
    })
    await expect(submitDecisionCandidateReview(client, base)).resolves.toMatchObject({ answer_id: answerId })
    expect(client.invoke).toHaveBeenCalledWith('decision-ingress-v1', { body: {
      action: 'review_candidate',
      candidateId,
      disposition: 'confirmed',
      reviewedAt: base.reviewedAt,
      idempotencyKey: base.idempotencyKey,
    } })
  })

  it('requires the leader wording for a correction', async () => {
    await expect(submitDecisionCandidateReview(transport(null), {
      ...base,
      disposition: 'corrected',
    })).rejects.toMatchObject({ code: 'invalid_input' })
  })

  it('accepts rejection only when no answer is created', async () => {
    const client = transport({
      action: 'review_candidate',
      result: { status: 'created', candidate_id: candidateId, disposition: 'rejected' },
    })
    await expect(submitDecisionCandidateReview(client, {
      ...base,
      disposition: 'rejected',
      idempotencyKey: 'r147:reject:one',
    })).resolves.toMatchObject({ disposition: 'rejected' })
  })

  it('fails closed when a rejection response contains an answer', async () => {
    const client = transport({
      action: 'review_candidate',
      result: { status: 'created', candidate_id: candidateId, disposition: 'rejected', answer_id: answerId },
    })
    await expect(submitDecisionCandidateReview(client, {
      ...base,
      disposition: 'rejected',
      idempotencyKey: 'r147:reject:two',
    })).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it.each([
    [{ message: 'state_conflict' }, 'state_conflict'],
    [{ message: 'forbidden' }, 'forbidden'],
    [{ message: 'offline' }, 'unavailable'],
  ] as const)('maps service error %s to %s', async (error, code) => {
    await expect(submitDecisionCandidateReview(transport(null, error), base)).rejects.toMatchObject({ code })
  })
})

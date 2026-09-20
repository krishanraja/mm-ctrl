import { describe, expect, it, vi } from 'vitest'
import { standardReviewPreparedFixture } from './fixture'
import { createAddressedStandardReviewGateway } from './addressGateway'

const UUID = '11111111-1111-4111-8111-111111111111'
const SHA = 'a'.repeat(64)

describe('stable standard review address gateway', () => {
  it('opens the frozen packet by its owner-private address without a check hash', async () => {
    const opened = structuredClone(standardReviewPreparedFixture) as Record<string, unknown>
    opened.action = 'open'
    const invoke = vi.fn().mockResolvedValue({ data: opened, error: null })
    const gateway = createAddressedStandardReviewGateway({ invoke }, UUID)

    const review = await gateway.prepare(UUID, SHA)
    expect(review.reviewPacketId).toBe(standardReviewPreparedFixture.result.review_packet_id)
    expect(review.proposed_rule).toBe(standardReviewPreparedFixture.result.packet.presentation.proposed_rule)
    expect(invoke).toHaveBeenCalledWith('review-standard-change-v3', {
      body: { action: 'open', review_packet_id: UUID },
    })
  })

  it('keeps the exact decision hashes while routing through V3', async () => {
    const opened = structuredClone(standardReviewPreparedFixture) as Record<string, unknown>
    opened.action = 'open'
    const invoke = vi.fn()
      .mockResolvedValueOnce({ data: opened, error: null })
      .mockResolvedValueOnce({
        data: {
          action: 'decide',
          result: {
            decision: 'rejected',
            application_id: null,
            active_standard_mutated: false,
          },
        },
        error: null,
      })
    const gateway = createAddressedStandardReviewGateway({ invoke }, UUID)
    const review = await gateway.prepare(UUID, SHA)

    await gateway.decide(review, 'rejected', 'r122_decision_0001')
    expect(invoke).toHaveBeenLastCalledWith('review-standard-change-v3', {
      body: expect.objectContaining({
        action: 'decide',
        review_packet_id: review.reviewPacketId,
        expected_packet_sha256: review.reviewPacketSha256,
        expected_standard_sha256: review.plannedStandardSha256,
      }),
    })
  })

  it('refuses a malformed address before any network call', () => {
    expect(() => createAddressedStandardReviewGateway({ invoke: vi.fn() }, 'not-a-uuid'))
      .toThrow('invalid_review_address')
  })
})

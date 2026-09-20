import { describe, expect, it, vi } from 'vitest'
import {
  getPendingStandardReview,
  PendingStandardReviewProjectionError,
} from './pendingQueue'

const uuid = '11111111-1111-4111-8111-111111111111'

describe('pending standard review projection', () => {
  it('returns one minimal safe-link projection', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        action: 'pending',
        result: {
          schema: 'ctrl.standard-change.pending-review.v1',
          ready_count: 3,
          next: {
            review_packet_id: uuid,
            safe_path: `/operator/reviews/${uuid}`,
            question: 'Should this be your proposal rule?',
            headline: 'A repeated correction should become a rule.',
            consequence: 'The same failure will be caught before delivery.',
            ready_since: '2026-09-20T10:00:00.000Z',
          },
          selection: { method: 'oldest_ready_first', materiality_inferred: false },
          active_standard_mutated: false,
          deploy_authorized: false,
          release_authorized: false,
        },
      },
      error: null,
    })

    const result = await getPendingStandardReview({ invoke })
    expect(result.next?.safe_path).toBe(`/operator/reviews/${uuid}`)
    expect(result.next?.consequence).toContain('caught before delivery')
    expect(invoke).toHaveBeenCalledWith('review-standard-change-v4', {
      body: { action: 'pending' },
    })
  })

  it('accepts an honest empty queue', async () => {
    const result = await getPendingStandardReview({
      invoke: async () => ({
        data: {
          action: 'pending',
          result: {
            schema: 'ctrl.standard-change.pending-review.v1',
            ready_count: 0,
            next: null,
            selection: { method: 'oldest_ready_first', materiality_inferred: false },
            active_standard_mutated: false,
            deploy_authorized: false,
            release_authorized: false,
          },
        },
        error: null,
      }),
    })
    expect(result.next).toBeNull()
  })

  it('fails closed when count and next contradict one another', async () => {
    await expect(getPendingStandardReview({
      invoke: async () => ({
        data: {
          action: 'pending',
          result: {
            schema: 'ctrl.standard-change.pending-review.v1',
            ready_count: 2,
            next: null,
            selection: { method: 'oldest_ready_first', materiality_inferred: false },
            active_standard_mutated: false,
            deploy_authorized: false,
            release_authorized: false,
          },
        },
        error: null,
      }),
    })).rejects.toBeInstanceOf(PendingStandardReviewProjectionError)
  })
})

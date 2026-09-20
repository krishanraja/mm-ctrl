import { describe, expect, it, vi } from 'vitest'
import type { StandardReviewRpcClient } from './ownerOperatorBinding'
import {
  getOperatorPendingQueue,
  OperatorPendingQueueError,
} from './operatorPendingQueue'

const WORKSPACE_ID = '13100000-0000-4000-8000-000000000003'
const REVIEW_ID = '13100000-0000-4000-8000-000000000002'

const available = {
  schema: 'ctrl.standard-change.operator-pending-review.v1',
  available: true,
  ready_count: 1,
  next: {
    review_packet_id: REVIEW_ID,
    question: 'Should this become the current standard?',
    headline: 'The team can move without a final rewrite.',
    consequence: 'Future work can move when the named proof is present.',
    ready_since: '2026-09-20T12:00:00+00:00',
  },
  selection: { method: 'oldest_ready_first', materiality_inferred: false },
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
}

const client = (data: unknown, error: { message?: string } | null = null) => ({
  rpc: vi.fn(async () => ({ data, error })),
}) satisfies StandardReviewRpcClient

describe('getOperatorPendingQueue', () => {
  it('returns only the exact five-field operator item', async () => {
    const rpcClient = client(available)
    const result = await getOperatorPendingQueue(rpcClient, WORKSPACE_ID)
    expect(result).toEqual(available)
    expect(rpcClient.rpc).toHaveBeenCalledWith(
      'get_operator_pending_standard_change_review_v1',
      { p_workspace_id: WORKSPACE_ID },
    )
    expect(Object.keys(result.next ?? {})).toHaveLength(5)
  })

  it('accepts the uniform unavailable response without exposing the private reason', async () => {
    await expect(getOperatorPendingQueue(client({
      schema: 'ctrl.standard-change.operator-pending-review.v1',
      available: false,
      reason: 'not_available',
      ready_count: 0,
      next: null,
      decision_authority_granted: false,
      active_standard_mutated: false,
      notification_sent: false,
    }), WORKSPACE_ID)).resolves.toMatchObject({ available: false, reason: 'not_available' })
  })

  it('rejects a private denial reason', async () => {
    await expect(getOperatorPendingQueue(client({
      schema: 'ctrl.standard-change.operator-pending-review.v1',
      available: false,
      reason: 'audience_grant_revoked',
      ready_count: 0,
      next: null,
      decision_authority_granted: false,
      active_standard_mutated: false,
      notification_sent: false,
    }), WORKSPACE_ID)).rejects.toEqual(
      expect.objectContaining<Partial<OperatorPendingQueueError>>({ code: 'response_invalid' }),
    )
  })

  it('rejects any packet or hash smuggled into the projected item', async () => {
    await expect(getOperatorPendingQueue(client({
      ...available,
      next: { ...available.next, packet_sha256: 'a'.repeat(64) },
    }), WORKSPACE_ID)).rejects.toEqual(
      expect.objectContaining<Partial<OperatorPendingQueueError>>({ code: 'response_invalid' }),
    )
  })

  it('rejects an impossible available queue with no ready items', async () => {
    await expect(getOperatorPendingQueue(client({ ...available, ready_count: 0 }), WORKSPACE_ID)).rejects.toEqual(
      expect.objectContaining<Partial<OperatorPendingQueueError>>({ code: 'response_invalid' }),
    )
  })
})

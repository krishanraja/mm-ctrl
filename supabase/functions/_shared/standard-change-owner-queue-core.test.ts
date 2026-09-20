import { describe, expect, it } from 'vitest'
import {
  parseQueuedOwnerStandardChangeRequest,
  queuedOwnerStandardChangeRpc,
} from './standard-change-owner-queue-core.ts'

const uuid = '11111111-1111-4111-8111-111111111111'

describe('owner-private pending review queue contract', () => {
  it('maps one exact pending request to the read-only V4 RPC', () => {
    const parsed = parseQueuedOwnerStandardChangeRequest({ action: 'pending' })
    expect(queuedOwnerStandardChangeRpc(parsed)).toEqual({
      name: 'get_pending_standard_change_review_v4',
      args: {},
    })
  })

  it('rejects every pending request that tries to steer selection', () => {
    expect(() => parseQueuedOwnerStandardChangeRequest({
      action: 'pending',
      user_id: uuid,
    })).toThrow('invalid_pending_request')
    expect(() => parseQueuedOwnerStandardChangeRequest({
      action: 'pending',
      limit: 100,
    })).toThrow('invalid_pending_request')
  })

  it('preserves the stable open action', () => {
    const parsed = parseQueuedOwnerStandardChangeRequest({
      action: 'open',
      review_packet_id: uuid,
    })
    expect(queuedOwnerStandardChangeRpc(parsed)).toEqual({
      name: 'open_standard_change_review_v3',
      args: { p_review_packet_id: uuid },
    })
  })
})

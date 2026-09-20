import { describe, expect, it } from 'vitest'
import {
  ownerPresentationStandardChangeRpc,
  parseOwnerStandardChangeRequest,
} from './standard-change-owner-presentation-core.ts'

const uuid = '11111111-1111-4111-8111-111111111111'
const sha = 'a'.repeat(64)

describe('presentation-bound standard change owner request contract', () => {
  it('uses the projection-binding RPC for prepare', () => {
    const parsed = parseOwnerStandardChangeRequest({
      action: 'prepare',
      check_id: uuid,
      expected_result_sha256: sha,
    })
    expect(ownerPresentationStandardChangeRpc(parsed)).toEqual({
      name: 'prepare_standard_change_review_v2',
      args: { p_check_id: uuid, p_expected_result_sha256: sha },
    })
  })

  it('preserves the R116 authority RPCs for decide and reverse', () => {
    const decision = parseOwnerStandardChangeRequest({
      action: 'decide',
      review_packet_id: uuid,
      expected_packet_sha256: sha,
      expected_standard_sha256: sha,
      request_id: 'r118_decision_0001',
      decision: 'approved',
    })
    expect(ownerPresentationStandardChangeRpc(decision).name).toBe('decide_standard_change_review')

    const reversal = parseOwnerStandardChangeRequest({
      action: 'reverse',
      application_id: uuid,
      expected_application_hash: sha,
      expected_active_standard_sha256: sha,
      request_id: 'r118_reversal_0001',
      reason: 'Restore the prior current rule.',
    })
    expect(ownerPresentationStandardChangeRpc(reversal).name).toBe('reverse_standard_change_application')
  })
})

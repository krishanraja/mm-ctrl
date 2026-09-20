import { describe, expect, it } from 'vitest'
import {
  addressedOwnerStandardChangeRpc,
  parseAddressedOwnerStandardChangeRequest,
} from './standard-change-owner-address-core.ts'

const uuid = '11111111-1111-4111-8111-111111111111'
const sha = 'a'.repeat(64)

describe('stable owner review address contract', () => {
  it('maps one exact open request to the read-only V3 RPC', () => {
    const parsed = parseAddressedOwnerStandardChangeRequest({
      action: 'open',
      review_packet_id: uuid,
    })
    expect(addressedOwnerStandardChangeRpc(parsed)).toEqual({
      name: 'open_standard_change_review_v3',
      args: { p_review_packet_id: uuid },
    })
  })

  it('rejects malformed identifiers and extra fields', () => {
    expect(() => parseAddressedOwnerStandardChangeRequest({
      action: 'open',
      review_packet_id: 'not-a-uuid',
    })).toThrow('invalid_open_request')
    expect(() => parseAddressedOwnerStandardChangeRequest({
      action: 'open',
      review_packet_id: uuid,
      expected_packet_sha256: sha,
    })).toThrow('invalid_open_request')
  })

  it('keeps prepare on V2 and decisions on the frozen owner RPCs', () => {
    const prepared = parseAddressedOwnerStandardChangeRequest({
      action: 'prepare',
      check_id: uuid,
      expected_result_sha256: sha,
    })
    expect(addressedOwnerStandardChangeRpc(prepared).name).toBe('prepare_standard_change_review_v2')

    const decided = parseAddressedOwnerStandardChangeRequest({
      action: 'decide',
      review_packet_id: uuid,
      expected_packet_sha256: sha,
      expected_standard_sha256: sha,
      request_id: 'r122_decision_0001',
      decision: 'rejected',
    })
    expect(addressedOwnerStandardChangeRpc(decided).name).toBe('decide_standard_change_review')
  })
})

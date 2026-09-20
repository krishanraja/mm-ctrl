import {
  ownerStandardChangeErrorStatus,
  ownerStandardChangeRpc,
  parseOwnerStandardChangeRequest,
  type OwnerStandardChangeRequest,
} from './standard-change-owner-core.ts'

export { ownerStandardChangeErrorStatus, parseOwnerStandardChangeRequest }

export function ownerPresentationStandardChangeRpc(input: OwnerStandardChangeRequest): {
  name: string
  args: Record<string, unknown>
} {
  if (input.action === 'prepare') {
    return {
      name: 'prepare_standard_change_review_v2',
      args: {
        p_check_id: input.check_id,
        p_expected_result_sha256: input.expected_result_sha256,
      },
    }
  }
  return ownerStandardChangeRpc(input)
}

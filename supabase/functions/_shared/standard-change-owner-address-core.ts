import {
  ownerStandardChangeErrorStatus,
  ownerStandardChangeRpc,
  parseOwnerStandardChangeRequest,
  type OwnerStandardChangeRequest,
} from './standard-change-owner-core.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type OpenRequest = {
  action: 'open'
  review_packet_id: string
}

export type AddressedOwnerStandardChangeRequest = OpenRequest | OwnerStandardChangeRequest

export function parseAddressedOwnerStandardChangeRequest(
  value: unknown,
): AddressedOwnerStandardChangeRequest {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'action' in value) {
    const body = value as Record<string, unknown>
    if (body.action === 'open') {
      if (
        Object.keys(body).length !== 2 ||
        typeof body.review_packet_id !== 'string' ||
        !UUID.test(body.review_packet_id)
      ) throw new Error('invalid_open_request')
      return body as OpenRequest
    }
  }
  return parseOwnerStandardChangeRequest(value)
}

export function addressedOwnerStandardChangeRpc(
  input: AddressedOwnerStandardChangeRequest,
): { name: string; args: Record<string, unknown> } {
  if (input.action === 'open') {
    return {
      name: 'open_standard_change_review_v3',
      args: { p_review_packet_id: input.review_packet_id },
    }
  }
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

export { ownerStandardChangeErrorStatus }

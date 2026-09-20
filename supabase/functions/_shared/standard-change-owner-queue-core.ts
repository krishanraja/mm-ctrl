import {
  addressedOwnerStandardChangeRpc,
  ownerStandardChangeErrorStatus,
  parseAddressedOwnerStandardChangeRequest,
  type AddressedOwnerStandardChangeRequest,
} from './standard-change-owner-address-core.ts'

type PendingRequest = {
  action: 'pending'
}

export type QueuedOwnerStandardChangeRequest =
  | PendingRequest
  | AddressedOwnerStandardChangeRequest

export function parseQueuedOwnerStandardChangeRequest(
  value: unknown,
): QueuedOwnerStandardChangeRequest {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'action' in value) {
    const body = value as Record<string, unknown>
    if (body.action === 'pending') {
      if (Object.keys(body).length !== 1) throw new Error('invalid_pending_request')
      return { action: 'pending' }
    }
  }
  return parseAddressedOwnerStandardChangeRequest(value)
}

export function queuedOwnerStandardChangeRpc(
  input: QueuedOwnerStandardChangeRequest,
): { name: string; args: Record<string, unknown> } {
  if (input.action === 'pending') {
    return { name: 'get_pending_standard_change_review_v4', args: {} }
  }
  return addressedOwnerStandardChangeRpc(input)
}

export { ownerStandardChangeErrorStatus }

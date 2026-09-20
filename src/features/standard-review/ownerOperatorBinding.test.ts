import { describe, expect, it, vi } from 'vitest'
import {
  OwnerOperatorBindingError,
  prepareAndBindOperatorProjection,
  type StandardReviewRpcClient,
} from './ownerOperatorBinding'

const CHECK_ID = '13100000-0000-4000-8000-000000000001'
const REVIEW_ID = '13100000-0000-4000-8000-000000000002'
const WORKSPACE_ID = '13100000-0000-4000-8000-000000000003'
const SUBJECT_ID = '13100000-0000-4000-8000-000000000004'
const SHA = 'a'.repeat(64)

const response = {
  schema: 'ctrl.standard-change.operator-projection-binding.v1',
  review_packet_id: REVIEW_ID,
  workspace_id: WORKSPACE_ID,
  subject_id: SUBJECT_ID,
  audience: 'delivery_team_private',
  purpose: 'standard_change_review_preparation',
  presentation_complete: true,
  idempotent: false,
  operator_access_granted: false,
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
}

const client = (data: unknown, error: { message?: string } | null = null) => ({
  rpc: vi.fn(async () => ({ data, error })),
}) satisfies StandardReviewRpcClient

describe('prepareAndBindOperatorProjection', () => {
  it('calls only the exact owner binding RPC and returns its safe receipt', async () => {
    const rpcClient = client(response)
    await expect(prepareAndBindOperatorProjection(rpcClient, {
      checkId: CHECK_ID,
      expectedResultSha256: SHA,
      workspaceId: WORKSPACE_ID,
    })).resolves.toEqual(response)
    expect(rpcClient.rpc).toHaveBeenCalledWith(
      'prepare_and_bind_standard_change_operator_projection_v1',
      {
        p_check_id: CHECK_ID,
        p_expected_result_sha256: SHA,
        p_workspace_id: WORKSPACE_ID,
      },
    )
  })

  it('rejects malformed identifiers before making a request', async () => {
    const rpcClient = client(response)
    await expect(prepareAndBindOperatorProjection(rpcClient, {
      checkId: 'not-a-check',
      expectedResultSha256: SHA,
      workspaceId: WORKSPACE_ID,
    })).rejects.toEqual(expect.objectContaining<Partial<OwnerOperatorBindingError>>({ code: 'input_invalid' }))
    expect(rpcClient.rpc).not.toHaveBeenCalled()
  })

  it('rejects a response for another workspace', async () => {
    await expect(prepareAndBindOperatorProjection(client({
      ...response,
      workspace_id: '13100000-0000-4000-8000-000000000099',
    }), {
      checkId: CHECK_ID,
      expectedResultSha256: SHA,
      workspaceId: WORKSPACE_ID,
    })).rejects.toEqual(expect.objectContaining<Partial<OwnerOperatorBindingError>>({ code: 'response_invalid' }))
  })

  it('rejects extra private material even when the expected fields are present', async () => {
    await expect(prepareAndBindOperatorProjection(client({
      ...response,
      packet: { private: true },
    }), {
      checkId: CHECK_ID,
      expectedResultSha256: SHA,
      workspaceId: WORKSPACE_ID,
    })).rejects.toEqual(expect.objectContaining<Partial<OwnerOperatorBindingError>>({ code: 'response_invalid' }))
  })

  it('keeps transport failure distinct from an invalid response', async () => {
    await expect(prepareAndBindOperatorProjection(client(null, { message: 'denied' }), {
      checkId: CHECK_ID,
      expectedResultSha256: SHA,
      workspaceId: WORKSPACE_ID,
    })).rejects.toEqual(expect.objectContaining<Partial<OwnerOperatorBindingError>>({ code: 'transport_failed' }))
  })
})

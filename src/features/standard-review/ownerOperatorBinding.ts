import { z } from 'zod'

const uuidSchema = z.string().uuid()
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

const bindingResponseSchema = z.object({
  schema: z.literal('ctrl.standard-change.operator-projection-binding.v1'),
  review_packet_id: uuidSchema,
  workspace_id: uuidSchema,
  subject_id: uuidSchema,
  audience: z.literal('delivery_team_private'),
  purpose: z.literal('standard_change_review_preparation'),
  presentation_complete: z.literal(true),
  idempotent: z.boolean(),
  operator_access_granted: z.literal(false),
  decision_authority_granted: z.literal(false),
  active_standard_mutated: z.literal(false),
  notification_sent: z.literal(false),
}).strict()

export interface OwnerOperatorBindingInput {
  checkId: string
  expectedResultSha256: string
  workspaceId: string
}

export type OwnerOperatorBinding = z.infer<typeof bindingResponseSchema>

export interface StandardReviewRpcClient {
  rpc(
    functionName: string,
    parameters: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message?: string } | null }>
}

export class OwnerOperatorBindingError extends Error {
  readonly code: 'input_invalid' | 'transport_failed' | 'response_invalid'

  constructor(code: OwnerOperatorBindingError['code']) {
    super(code)
    this.name = 'OwnerOperatorBindingError'
    this.code = code
  }
}

export async function prepareAndBindOperatorProjection(
  client: StandardReviewRpcClient,
  input: OwnerOperatorBindingInput,
): Promise<OwnerOperatorBinding> {
  const parsedInput = z.object({
    checkId: uuidSchema,
    expectedResultSha256: sha256Schema,
    workspaceId: uuidSchema,
  }).strict().safeParse(input)
  if (!parsedInput.success) throw new OwnerOperatorBindingError('input_invalid')

  const { data, error } = await client.rpc(
    'prepare_and_bind_standard_change_operator_projection_v1',
    {
      p_check_id: parsedInput.data.checkId,
      p_expected_result_sha256: parsedInput.data.expectedResultSha256,
      p_workspace_id: parsedInput.data.workspaceId,
    },
  )
  if (error) throw new OwnerOperatorBindingError('transport_failed')

  const parsedResponse = bindingResponseSchema.safeParse(data)
  if (!parsedResponse.success || parsedResponse.data.workspace_id !== parsedInput.data.workspaceId) {
    throw new OwnerOperatorBindingError('response_invalid')
  }
  return parsedResponse.data
}

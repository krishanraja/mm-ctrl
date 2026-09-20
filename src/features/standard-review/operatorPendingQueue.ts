import { z } from 'zod'
import type { StandardReviewRpcClient } from './ownerOperatorBinding'

const uuidSchema = z.string().uuid()
const commonSchema = z.object({
  schema: z.literal('ctrl.standard-change.operator-pending-review.v1'),
  ready_count: z.number().int().nonnegative(),
  decision_authority_granted: z.literal(false),
  active_standard_mutated: z.literal(false),
  notification_sent: z.literal(false),
})

const availableSchema = commonSchema.extend({
  available: z.literal(true),
  next: z.object({
    review_packet_id: uuidSchema,
    question: z.string().trim().min(1).max(140),
    headline: z.string().trim().min(1).max(240),
    consequence: z.string().trim().min(1).max(2_000),
    ready_since: z.string().datetime({ offset: true }),
  }).strict(),
  selection: z.object({
    method: z.literal('oldest_ready_first'),
    materiality_inferred: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.ready_count < 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'available queue must contain an item' })
  }
})

const unavailableSchema = commonSchema.extend({
  available: z.literal(false),
  reason: z.literal('not_available'),
  ready_count: z.literal(0),
  next: z.null(),
}).strict()

const queueSchema = z.union([availableSchema, unavailableSchema])

export type OperatorPendingQueue = z.infer<typeof queueSchema>

export class OperatorPendingQueueError extends Error {
  readonly code: 'input_invalid' | 'transport_failed' | 'response_invalid'

  constructor(code: OperatorPendingQueueError['code']) {
    super(code)
    this.name = 'OperatorPendingQueueError'
    this.code = code
  }
}

export async function getOperatorPendingQueue(
  client: StandardReviewRpcClient,
  workspaceId: string,
): Promise<OperatorPendingQueue> {
  const parsedWorkspaceId = uuidSchema.safeParse(workspaceId)
  if (!parsedWorkspaceId.success) throw new OperatorPendingQueueError('input_invalid')

  const { data, error } = await client.rpc(
    'get_operator_pending_standard_change_review_v1',
    { p_workspace_id: parsedWorkspaceId.data },
  )
  if (error) throw new OperatorPendingQueueError('transport_failed')

  const parsedResponse = queueSchema.safeParse(data)
  if (!parsedResponse.success) throw new OperatorPendingQueueError('response_invalid')
  return parsedResponse.data
}

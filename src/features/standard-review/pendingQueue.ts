import { z } from 'zod'
import type { StandardReviewFunctionInvoker } from './gateway'

const pendingQueueSchema = z.object({
  action: z.literal('pending'),
  result: z.object({
    schema: z.literal('ctrl.standard-change.pending-review.v1'),
    ready_count: z.number().int().nonnegative(),
    next: z.object({
      review_packet_id: z.string().uuid(),
      safe_path: z.string().regex(/^\/operator\/reviews\/[0-9a-f-]{36}$/i),
      question: z.string().trim().min(1).max(140),
      headline: z.string().trim().min(1).max(240),
      consequence: z.string().trim().min(1).max(2_000),
      ready_since: z.string().datetime({ offset: true }),
    }).strict().nullable(),
    selection: z.object({
      method: z.literal('oldest_ready_first'),
      materiality_inferred: z.literal(false),
    }).strict(),
    active_standard_mutated: z.literal(false),
    deploy_authorized: z.literal(false),
    release_authorized: z.literal(false),
  }).strict(),
}).strict()

export type PendingStandardReview = z.infer<typeof pendingQueueSchema>['result']

export class PendingStandardReviewProjectionError extends Error {
  readonly code = 'pending_review_incomplete'

  constructor() {
    super('The pending review queue could not be verified.')
    this.name = 'PendingStandardReviewProjectionError'
  }
}

export async function getPendingStandardReview(
  invoker: StandardReviewFunctionInvoker,
): Promise<PendingStandardReview> {
  const response = await invoker.invoke('review-standard-change-v4', {
    body: { action: 'pending' },
  })
  if (response.error) throw response.error
  const parsed = pendingQueueSchema.safeParse(response.data)
  if (!parsed.success) throw new PendingStandardReviewProjectionError()
  if ((parsed.data.result.ready_count === 0) !== (parsed.data.result.next === null)) {
    throw new PendingStandardReviewProjectionError()
  }
  return parsed.data.result
}

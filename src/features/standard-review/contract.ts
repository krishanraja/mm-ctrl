import { z } from 'zod'

const uuid = z.string().uuid()
const sha256 = z.string().regex(/^[0-9a-f]{64}$/)
const plainText = z.string().trim().min(1).max(2_000)

export const standardReviewEvidenceSchema = z.object({
  source_id: z.string().trim().min(1).max(240),
  label: z.string().trim().min(1).max(240),
  statement: z.string().trim().min(1).max(2_000),
  occurred_at: z.string().datetime({ offset: true }),
  relationship: z.enum(['supports', 'challenges', 'qualifies']),
}).strict()

export const standardReviewPresentationSchema = z.object({
  schema: z.literal('ctrl.standard-change.owner-review.presentation.v1'),
  question: z.string().trim().min(1).max(140),
  headline: z.string().trim().min(1).max(240),
  current_rule: plainText,
  proposed_rule: plainText,
  consequence: plainText,
  risk_if_wrong: plainText,
  validation: plainText,
  alternative_explanations: z.array(plainText).min(1).max(8),
  evidence: z.array(standardReviewEvidenceSchema).min(2).max(12),
}).strict()

const reviewPacketSchema = z.object({
  schema: z.literal('ctrl.standard-change.owner-review.v1'),
  presentation: standardReviewPresentationSchema,
  consequences: z.object({
    new_active_standard_version: z.literal(true),
    reversible_while_current_head: z.literal(true),
    deploy_authorized: z.literal(false),
    release_authorized: z.literal(false),
  }).strict(),
}).passthrough()

export const preparedStandardReviewSchema = z.object({
  action: z.literal('prepare'),
  result: z.object({
    review_packet_id: uuid,
    review_packet_sha256: sha256,
    planned_standard_sha256: sha256,
    state: z.literal('ready'),
    packet: reviewPacketSchema,
    active_standard_mutated: z.literal(false),
    deploy_authorized: z.literal(false),
    release_authorized: z.literal(false),
  }).passthrough(),
}).strict()

export type StandardReviewEvidence = z.infer<typeof standardReviewEvidenceSchema>
export type StandardReviewPresentation = z.infer<typeof standardReviewPresentationSchema>

export interface StandardReviewViewModel extends StandardReviewPresentation {
  reviewPacketId: string
  reviewPacketSha256: string
  plannedStandardSha256: string
  reversibleWhileCurrent: true
}

export class StandardReviewProjectionError extends Error {
  readonly code = 'presentation_incomplete'

  constructor() {
    super('This change is not ready for a trustworthy review.')
    this.name = 'StandardReviewProjectionError'
  }
}

export function projectPreparedStandardReview(input: unknown): StandardReviewViewModel {
  const parsed = preparedStandardReviewSchema.safeParse(input)
  if (!parsed.success) throw new StandardReviewProjectionError()

  const { result } = parsed.data
  return {
    ...result.packet.presentation,
    reviewPacketId: result.review_packet_id,
    reviewPacketSha256: result.review_packet_sha256,
    plannedStandardSha256: result.planned_standard_sha256,
    reversibleWhileCurrent: result.packet.consequences.reversible_while_current_head,
  }
}

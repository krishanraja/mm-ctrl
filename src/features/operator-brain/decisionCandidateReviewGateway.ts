import { z } from 'zod'

const uuid = z.string().uuid()
const idempotencyKey = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/)

export type DecisionCandidateReviewInput = {
  candidateId: string
  disposition: 'confirmed' | 'corrected' | 'rejected'
  answer?: string
  reviewedAt: string
  idempotencyKey: string
}

export interface DecisionCandidateReviewTransport {
  invoke(
    functionName: 'decision-ingress-v1',
    options: { body: Record<string, unknown> },
  ): Promise<{ data: unknown; error: unknown }>
}

export class DecisionCandidateReviewError extends Error {
  readonly code: 'invalid_input' | 'state_conflict' | 'forbidden' | 'unavailable' | 'invalid_response'

  constructor(code: DecisionCandidateReviewError['code']) {
    super(code)
    this.name = 'DecisionCandidateReviewError'
    this.code = code
  }
}

const reviewResponseSchema = z.object({
  action: z.literal('review_candidate'),
  result: z.object({
    status: z.enum(['created', 'replayed']),
    candidate_id: uuid,
    candidate_disposition: z.enum(['confirmed', 'corrected']).optional(),
    disposition: z.literal('rejected').optional(),
    answer_id: uuid.optional(),
    evidence_atom_id: uuid.optional(),
    recorded_at: z.string().datetime({ offset: true }).optional(),
    source_captured_at: z.string().datetime({ offset: true }).optional(),
  }).passthrough(),
}).strict()

function validateInput(input: DecisionCandidateReviewInput): void {
  const basic = z.object({
    candidateId: uuid,
    disposition: z.enum(['confirmed', 'corrected', 'rejected']),
    answer: z.string().trim().min(1).max(8_000).optional(),
    reviewedAt: z.string().datetime({ offset: true }),
    idempotencyKey,
  }).strict().safeParse(input)
  if (!basic.success) throw new DecisionCandidateReviewError('invalid_input')
  if (input.disposition === 'corrected' && !input.answer?.trim()) {
    throw new DecisionCandidateReviewError('invalid_input')
  }
  if (input.disposition === 'rejected' && input.answer !== undefined) {
    throw new DecisionCandidateReviewError('invalid_input')
  }
}

function serviceError(error: unknown): DecisionCandidateReviewError['code'] {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : String(error ?? '')
  if (message.includes('state_conflict')) return 'state_conflict'
  if (message.includes('forbidden')) return 'forbidden'
  return 'unavailable'
}

export async function submitDecisionCandidateReview(
  transport: DecisionCandidateReviewTransport,
  input: DecisionCandidateReviewInput,
): Promise<z.infer<typeof reviewResponseSchema>['result']> {
  validateInput(input)
  const body = {
    action: 'review_candidate',
    candidateId: input.candidateId,
    disposition: input.disposition,
    ...(input.answer === undefined ? {} : { answer: input.answer.trim() }),
    reviewedAt: input.reviewedAt,
    idempotencyKey: input.idempotencyKey,
  }
  const { data, error } = await transport.invoke('decision-ingress-v1', { body })
  if (error) throw new DecisionCandidateReviewError(serviceError(error))
  const parsed = reviewResponseSchema.safeParse(data)
  if (!parsed.success) throw new DecisionCandidateReviewError('invalid_response')
  const result = parsed.data.result
  if (input.disposition === 'rejected') {
    if (result.disposition !== 'rejected' || result.answer_id !== undefined) {
      throw new DecisionCandidateReviewError('invalid_response')
    }
  } else if (result.candidate_disposition !== input.disposition || !result.answer_id) {
    throw new DecisionCandidateReviewError('invalid_response')
  }
  return result
}


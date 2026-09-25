import { z } from 'zod'

const uuid = z.string().uuid()

const basisSchema = z.object({
  sourceType: z.string().min(1).max(80),
  capturedAt: z.string().datetime({ offset: true }),
  epistemicBasis: z.enum(['external_claim', 'inferred']),
  sourceText: z.string().min(1).max(80_000),
}).strict()

export const decisionCandidateProjectionSchema = z.object({
  candidate: z.object({
    id: uuid,
    standing: z.enum(['proposed', 'confirmed', 'corrected', 'rejected']),
    claim: z.string().min(1).max(4_000),
    proposedAt: z.string().datetime({ offset: true }),
  }).strict(),
  question: z.object({ id: uuid }).strict(),
  basis: basisSchema.nullable(),
}).strict()

export type DecisionCandidateProjection = z.infer<typeof decisionCandidateProjectionSchema>

export interface DecisionCandidateProjectionTransport {
  invoke(
    functionName: 'decision-candidate-projection-v1',
    options: { body: { candidateId: string; includeBasis: boolean } },
  ): Promise<{ data: unknown; error: unknown }>
}

export class DecisionCandidateProjectionError extends Error {
  readonly code: 'unavailable' | 'forbidden' | 'not_found' | 'invalid_response'

  constructor(code: DecisionCandidateProjectionError['code']) {
    super(code)
    this.name = 'DecisionCandidateProjectionError'
    this.code = code
  }
}

function errorCode(error: unknown): DecisionCandidateProjectionError['code'] {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : String(error ?? '')
  if (message.includes('forbidden')) return 'forbidden'
  if (message.includes('not_found')) return 'not_found'
  return 'unavailable'
}

export async function readDecisionCandidateProjection(
  transport: DecisionCandidateProjectionTransport,
  candidateId: string,
  includeBasis = false,
): Promise<DecisionCandidateProjection> {
  if (!uuid.safeParse(candidateId).success) throw new DecisionCandidateProjectionError('not_found')
  const { data, error } = await transport.invoke('decision-candidate-projection-v1', {
    body: { candidateId, includeBasis },
  })
  if (error) throw new DecisionCandidateProjectionError(errorCode(error))
  const parsed = decisionCandidateProjectionSchema.safeParse(data)
  if (!parsed.success) throw new DecisionCandidateProjectionError('invalid_response')
  if (includeBasis !== (parsed.data.basis !== null)) {
    throw new DecisionCandidateProjectionError('invalid_response')
  }
  return parsed.data
}


import { describe, expect, it, vi } from 'vitest'
import {
  DecisionCandidateProjectionError,
  readDecisionCandidateProjection,
  type DecisionCandidateProjectionTransport,
} from './decisionCandidateProjectionGateway'

const candidateId = '14700000-0000-4000-8000-000000000001'
const questionId = '14700000-0000-4000-8000-000000000002'
const projection = {
  candidate: {
    id: candidateId,
    standing: 'proposed',
    claim: 'The current plan may understate the speed of category change.',
    proposedAt: '2026-09-25T06:00:00.000Z',
  },
  question: { id: questionId },
  basis: null,
} as const

function transport(result: { data: unknown; error: unknown }) {
  return {
    invoke: vi.fn().mockResolvedValue(result),
  } satisfies DecisionCandidateProjectionTransport
}

describe('decision candidate projection gateway', () => {
  it('requests the minimum candidate by default', async () => {
    const client = transport({ data: projection, error: null })
    await expect(readDecisionCandidateProjection(client, candidateId)).resolves.toEqual(projection)
    expect(client.invoke).toHaveBeenCalledWith('decision-candidate-projection-v1', {
      body: { candidateId, includeBasis: false },
    })
  })

  it('admits source text only through an explicit basis request', async () => {
    const withBasis = {
      ...projection,
      basis: {
        sourceType: 'external',
        capturedAt: '2026-09-25T05:59:00.000Z',
        epistemicBasis: 'external_claim',
        sourceText: 'Category evidence moved faster than the current plan.',
      },
    }
    const client = transport({ data: withBasis, error: null })
    await expect(readDecisionCandidateProjection(client, candidateId, true)).resolves.toEqual(withBasis)
  })

  it('rejects a response that leaks basis without a basis request', async () => {
    const client = transport({ data: { ...projection, basis: {
      sourceType: 'external', capturedAt: '2026-09-25T05:59:00.000Z',
      epistemicBasis: 'external_claim', sourceText: 'Hidden unless requested.',
    } }, error: null })
    await expect(readDecisionCandidateProjection(client, candidateId)).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })

  it.each([
    [{ message: 'forbidden' }, 'forbidden'],
    [{ message: 'not_found' }, 'not_found'],
    [{ message: 'network failure' }, 'unavailable'],
  ] as const)('maps service failure %s to %s', async (error, code) => {
    const client = transport({ data: null, error })
    await expect(readDecisionCandidateProjection(client, candidateId)).rejects.toEqual(
      expect.objectContaining<Partial<DecisionCandidateProjectionError>>({ code }),
    )
  })
})


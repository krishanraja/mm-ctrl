import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DecisionCandidateMoment } from './DecisionCandidateMoment'
import type { DecisionCandidateProjection } from './decisionCandidateProjectionGateway'

const candidateId = '14700000-0000-4000-8000-000000000001'
const questionId = '14700000-0000-4000-8000-000000000002'

const minimal: DecisionCandidateProjection = {
  candidate: {
    id: candidateId,
    standing: 'proposed',
    claim: 'The current plan may understate the speed of category change.',
    proposedAt: '2026-09-25T06:00:00.000Z',
  },
  question: { id: questionId },
  basis: null,
}

const basis: DecisionCandidateProjection = {
  ...minimal,
  basis: {
    sourceType: 'external',
    capturedAt: '2026-09-25T05:59:00.000Z',
    epistemicBasis: 'external_claim',
    sourceText: 'Category evidence moved faster than the current plan.',
  },
}

const makeRequestId = vi.fn()
  .mockReturnValueOnce('r147:confirm:one')
  .mockReturnValueOnce('r147:correct:one')
  .mockReturnValueOnce('r147:reject:one')

describe('DecisionCandidateMoment', () => {
  it('shows one proposed belief and three plain human actions', async () => {
    const load = vi.fn().mockResolvedValue(minimal)
    render(<DecisionCandidateMoment candidateId={candidateId} load={load} review={vi.fn()} makeRequestId={makeRequestId} />)
    expect(await screen.findByRole('heading', { name: minimal.candidate.claim })).toBeVisible()
    expect(screen.getByText('Does that sound right?')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Yes' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Change it' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'No, this is not right' })).toBeVisible()
    expect(screen.queryByText(basis.basis!.sourceText)).not.toBeInTheDocument()
  })

  it('loads evidence only after the person asks why', async () => {
    const load = vi.fn()
      .mockResolvedValueOnce(minimal)
      .mockResolvedValueOnce(basis)
    render(<DecisionCandidateMoment candidateId={candidateId} load={load} review={vi.fn()} makeRequestId={() => crypto.randomUUID()} />)
    await screen.findByRole('heading', { name: minimal.candidate.claim })
    fireEvent.click(screen.getByRole('button', { name: 'Why CTRL thinks this' }))
    expect(await screen.findByText(basis.basis!.sourceText)).toBeVisible()
    expect(load).toHaveBeenLastCalledWith(candidateId, true)
  })

  it('confirms without sending the machine wording back from the browser', async () => {
    const review = vi.fn().mockResolvedValue({})
    render(<DecisionCandidateMoment candidateId={candidateId} load={vi.fn().mockResolvedValue(minimal)} review={review} makeRequestId={() => 'r147:confirm:stable'} now={() => '2026-09-25T06:30:00.000Z'} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))
    await waitFor(() => expect(review).toHaveBeenCalledWith({
      candidateId,
      disposition: 'confirmed',
      reviewedAt: '2026-09-25T06:30:00.000Z',
      idempotencyKey: 'r147:confirm:stable',
    }))
    expect(await screen.findByText('This is now recorded as your answer.')).toBeVisible()
  })

  it('makes the leader wording explicit when correcting', async () => {
    const review = vi.fn().mockResolvedValue({})
    render(<DecisionCandidateMoment candidateId={candidateId} load={vi.fn().mockResolvedValue(minimal)} review={review} makeRequestId={() => 'r147:correct:stable'} now={() => '2026-09-25T06:30:00.000Z'} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Change it' }))
    fireEvent.change(screen.getByLabelText('Say what is true instead'), { target: { value: 'The category is moving, but customer behaviour has not moved yet.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Use my wording' }))
    await waitFor(() => expect(review).toHaveBeenCalledWith(expect.objectContaining({
      disposition: 'corrected',
      answer: 'The category is moving, but customer behaviour has not moved yet.',
    })))
    expect(await screen.findByText('Your wording replaced CTRL’s proposal as the answer.')).toBeVisible()
  })

  it('states that failure changed nothing and permits the same action to retry', async () => {
    const review = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({})
    render(<DecisionCandidateMoment candidateId={candidateId} load={vi.fn().mockResolvedValue(minimal)} review={review} makeRequestId={() => 'r147:retry:stable'} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))
    expect(await screen.findByText('That did not save. Try again when you are ready.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await screen.findByText('This is now recorded as your answer.')
    expect(review.mock.calls[0][0].idempotencyKey).toBe(review.mock.calls[1][0].idempotencyKey)
  })
})


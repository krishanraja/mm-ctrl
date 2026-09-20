import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { OperatorPendingQueue } from '@/features/standard-review/operatorPendingQueue'
import { OperatorReviewSignal } from './OperatorReviewSignal'

const ready: OperatorPendingQueue = {
  schema: 'ctrl.standard-change.operator-pending-review.v1',
  available: true,
  ready_count: 1,
  next: {
    review_packet_id: '6913dca4-e613-4fa3-8c63-0b7a03c03132',
    question: 'Should this checked standard change?',
    headline: 'The working standard may be sharper.',
    consequence: 'The leader can test the change in the next session.',
    ready_since: '2026-09-20T09:00:00.000Z',
  },
  selection: { method: 'oldest_ready_first', materiality_inferred: false },
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
}

const unavailable: OperatorPendingQueue = {
  schema: 'ctrl.standard-change.operator-pending-review.v1',
  available: false,
  reason: 'not_available',
  ready_count: 0,
  next: null,
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
}

describe('OperatorReviewSignal', () => {
  it('renders nothing for the uniform not-available projection', () => {
    const { container } = render(<OperatorReviewSignal queue={unavailable} leaderLabel="Maya" notify={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('copies only the exact question after explicit activation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const notify = vi.fn()
    render(<OperatorReviewSignal queue={ready} leaderLabel="Maya" notify={notify} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy question' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(ready.next.question))
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith('Question copied')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeVisible()
  })

  it('does not claim success when the clipboard rejects', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) } })
    const notify = vi.fn()
    render(<OperatorReviewSignal queue={ready} leaderLabel="Maya" notify={notify} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy question' }))

    await waitFor(() => expect(notify).toHaveBeenCalledWith('Copy was blocked. The question is selected.'))
    expect(screen.getByRole('button', { name: 'Copy question' })).toBeVisible()
  })
})

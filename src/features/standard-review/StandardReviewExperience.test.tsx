import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StandardReviewExperience } from './StandardReviewExperience'
import { standardReviewPreparedFixture } from './fixture'
import { StandardReviewGateway } from './gateway'

const UUID = '11111111-1111-4111-8111-111111111111'
const SHA = 'a'.repeat(64)

describe('StandardReviewExperience', () => {
  it('moves from one quiet loading state to the approved first view', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return { data: standardReviewPreparedFixture, error: null }
      },
    })

    render(<StandardReviewExperience gateway={gateway} checkId={UUID} expectedResultSha256={SHA} />)
    expect(screen.getByLabelText('Loading the latest rule')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Should this be your proposal rule?' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Make this my rule' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Keep my current rule' })).toBeVisible()
  })

  it('keeps exact evidence and the countercase one layer down', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return { data: standardReviewPreparedFixture, error: null }
      },
    })
    render(<StandardReviewExperience gateway={gateway} checkId={UUID} expectedResultSha256={SHA} />)

    fireEvent.click(await screen.findByRole('button', { name: 'See why' }))
    const dialog = screen.getByRole('dialog', { name: 'Why this came up' })
    expect(dialog).toHaveTextContent('A £90,000 renewal proposal waited 36 hours')
    expect(dialog).toHaveTextContent('The team may be applying the current rule inconsistently.')
    expect(dialog).toHaveTextContent('Inspect the next five proposals and every exception.')
  })

  it('binds approval to one stable request and offers the receipt-backed reversal', async () => {
    const invoke = vi.fn(async (_functionName: string, options: { body: Record<string, unknown> }) => {
      if (options.body.action === 'prepare') return { data: standardReviewPreparedFixture, error: null }
      if (options.body.action === 'decide') {
        return {
          data: {
            action: 'decide',
            result: {
              decision: 'approved',
              application_id: UUID,
              application_hash: SHA,
              active_standard_sha256: SHA,
              reversible_while_current_head: true,
            },
          },
          error: null,
        }
      }
      return {
        data: {
          action: 'reverse',
          result: {
            restored: true,
            reversal_id: UUID,
            reversal_hash: SHA,
            active_standard_sha256: SHA,
            deploy_authorized: false,
            release_authorized: false,
          },
        },
        error: null,
      }
    })
    const gateway = new StandardReviewGateway({ invoke })
    render(
      <StandardReviewExperience
        gateway={gateway}
        checkId={UUID}
        expectedResultSha256={SHA}
        createRequestId={(action) => `r118_${action}_request_0001`}
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Make this my rule' }))
    expect(await screen.findByRole('heading', { name: 'Rule updated' })).toHaveFocus()
    expect(invoke).toHaveBeenCalledWith('review-standard-change-v2', {
      body: expect.objectContaining({
        action: 'decide',
        expected_packet_sha256: SHA,
        request_id: 'r118_decision_request_0001',
      }),
    })

    fireEvent.click(screen.getByRole('button', { name: 'Put the old rule back' }))
    expect(await screen.findByRole('heading', { name: 'Put the previous rule back?' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Restore the previous rule' }))
    expect(await screen.findByRole('heading', { name: 'Previous rule restored' })).toHaveFocus()
  })

  it('shows one honest stop when projection truth is incomplete', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return { data: { action: 'prepare', result: {} }, error: null }
      },
    })
    render(<StandardReviewExperience gateway={gateway} checkId={UUID} expectedResultSha256={SHA} />)

    expect(await screen.findByRole('heading', { name: 'We could not finish this review' })).toHaveFocus()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible())
  })

  it('lets the evidence sheet own focus and restores it to the trigger on close', async () => {
    const gateway = new StandardReviewGateway({
      async invoke() {
        return { data: standardReviewPreparedFixture, error: null }
      },
    })
    render(<StandardReviewExperience gateway={gateway} checkId={UUID} expectedResultSha256={SHA} />)

    const trigger = await screen.findByRole('button', { name: 'See why' })
    fireEvent.click(trigger)
    expect(screen.getByRole('button', { name: 'Close review details' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('turns a stale decision into a non-actionable latest-rule state', async () => {
    const gateway = new StandardReviewGateway({
      async invoke(_functionName, options) {
        if (options.body.action === 'prepare') return { data: standardReviewPreparedFixture, error: null }
        return { data: null, error: { message: 'state_conflict', code: 'state_conflict' } }
      },
    })
    render(<StandardReviewExperience gateway={gateway} checkId={UUID} expectedResultSha256={SHA} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Make this my rule' }))
    expect(await screen.findByRole('heading', { name: 'This rule changed while you were reviewing it' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Review the latest rule' })).toBeVisible()
  })
})

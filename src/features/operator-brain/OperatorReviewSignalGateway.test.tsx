import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { StandardReviewRpcClient } from '@/features/standard-review/ownerOperatorBinding'
import { OperatorReviewSignalGateway } from './OperatorReviewSignalGateway'
import { useOperatorReviewSignal, type OperatorReviewSignalStatus } from './useOperatorReviewSignal'

const WORKSPACE_A = '13300000-0000-4000-8000-000000000001'
const WORKSPACE_B = '13300000-0000-4000-8000-000000000002'

const available = (question: string, reviewPacketId = '13300000-0000-4000-8000-000000000003') => ({
  schema: 'ctrl.standard-change.operator-pending-review.v1',
  available: true,
  ready_count: 1,
  next: {
    review_packet_id: reviewPacketId,
    question,
    headline: 'The team can move without a final rewrite.',
    consequence: 'The leader can test this in the next working session.',
    ready_since: '2026-09-20T12:00:00+00:00',
  },
  selection: { method: 'oldest_ready_first', materiality_inferred: false },
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
})

const unavailable = {
  schema: 'ctrl.standard-change.operator-pending-review.v1',
  available: false,
  reason: 'not_available',
  ready_count: 0,
  next: null,
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
}

function client(rpc: StandardReviewRpcClient['rpc']): StandardReviewRpcClient {
  return { rpc }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

function StatusProbe({
  rpcClient,
  workspaceId = WORKSPACE_A,
  leaderLabel = 'Amina',
}: {
  rpcClient: StandardReviewRpcClient
  workspaceId?: string
  leaderLabel?: string
}) {
  const state = useOperatorReviewSignal(rpcClient, workspaceId, leaderLabel)
  return <output data-testid="safe-status">{state.status}</output>
}

describe('OperatorReviewSignalGateway', () => {
  it('renders the exact strict projection with the exact supplied leader label', async () => {
    const question = 'Should the checked rule move?'
    const rpc = vi.fn(async () => ({ data: available(question), error: null }))
    render(
      <OperatorReviewSignalGateway
        client={client(rpc)}
        workspaceId={WORKSPACE_A}
        leaderLabel="Amina 李 <owner>"
        notify={vi.fn()}
      />,
    )

    expect(document.body).not.toHaveTextContent('Loading')
    expect(await screen.findByRole('heading', { name: question })).toBeVisible()
    expect(screen.getByText('The team can move without a final rewrite.')).toBeVisible()
    expect(screen.getByText(/The leader can test this in the next working session/)).toBeVisible()
    expect(screen.getByText('1 question for Amina 李 <owner>')).toBeVisible()
    expect(screen.getByText('Amina 李 <owner> decides.')).toBeVisible()
    expect(document.querySelector('owner')).not.toBeInTheDocument()
    expect(rpc).toHaveBeenCalledWith(
      'get_operator_pending_standard_change_review_v1',
      { p_workspace_id: WORKSPACE_A },
    )
  })

  it.each([
    ['uniform unavailable', { data: unavailable, error: null }, 'unavailable'],
    ['transport failure', { data: null, error: { message: 'offline private detail' } }, 'transport_failed'],
    ['invalid extra field', { data: { ...available('Hidden'), private_reason: 'revoked' }, error: null }, 'response_invalid'],
  ] satisfies Array<[string, { data: unknown; error: { message: string } | null }, OperatorReviewSignalStatus]>)(
    'keeps %s visually silent while retaining only a safe internal status',
    async (_label, response, expectedStatus) => {
    const rpc = vi.fn(async () => response)
    const rpcClient = client(rpc)
    const { container } = render(
      <>
        <OperatorReviewSignalGateway
          client={rpcClient}
          workspaceId={WORKSPACE_A}
          leaderLabel="Amina"
          notify={vi.fn()}
        />
        <StatusProbe rpcClient={rpcClient} />
      </>,
    )

    await waitFor(() => expect(screen.getByTestId('safe-status')).toHaveTextContent(expectedStatus))
    expect(container.querySelector('.dt-review-signal')).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent('offline private detail')
    expect(container).not.toHaveTextContent('revoked')
    },
  )

  it.each(['', ' Amina ', 'x'.repeat(121)])('fails closed for an unusable leader label', async (leaderLabel) => {
    const rpc = vi.fn(async () => ({ data: available('Never requested'), error: null }))
    const { container } = render(
      <OperatorReviewSignalGateway
        client={client(rpc)}
        workspaceId={WORKSPACE_A}
        leaderLabel={leaderLabel}
        notify={vi.fn()}
      />,
    )

    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not call the RPC for an invalid workspace or while disabled', async () => {
    const rpc = vi.fn(async () => ({ data: available('Never requested'), error: null }))
    const rpcClient = client(rpc)
    const first = render(
      <OperatorReviewSignalGateway
        client={rpcClient}
        workspaceId="not-a-workspace"
        leaderLabel="Amina"
        notify={vi.fn()}
      />,
    )
    const second = render(
      <OperatorReviewSignalGateway
        client={rpcClient}
        workspaceId={WORKSPACE_A}
        leaderLabel="Amina"
        notify={vi.fn()}
        enabled={false}
      />,
    )

    await act(async () => {})
    expect(first.container).toBeEmptyDOMElement()
    expect(second.container).toBeEmptyDOMElement()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('clears an available customer synchronously when the selected customer changes', async () => {
    const second = deferred<{ data: unknown; error: null }>()
    const rpc = vi.fn((_name: string, parameters: Record<string, unknown>) => (
      parameters.p_workspace_id === WORKSPACE_A
        ? Promise.resolve({ data: available('Question for Amina'), error: null })
        : second.promise
    ))
    const rpcClient = client(rpc)
    const view = render(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )
    expect(await screen.findByText('Question for Amina')).toBeVisible()

    view.rerender(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_B} leaderLabel="Benoit" notify={vi.fn()} />,
    )

    expect(screen.queryByText('Question for Amina')).not.toBeInTheDocument()
    expect(screen.queryByText('Benoit decides.')).not.toBeInTheDocument()
    second.resolve({ data: unavailable, error: null })
    await act(async () => {})
    expect(view.container).toBeEmptyDOMElement()
  })

  it('ignores a late response from a previously selected workspace', async () => {
    const first = deferred<{ data: unknown; error: null }>()
    const second = deferred<{ data: unknown; error: null }>()
    const rpc = vi.fn((_name: string, parameters: Record<string, unknown>) => (
      parameters.p_workspace_id === WORKSPACE_A ? first.promise : second.promise
    ))
    const rpcClient = client(rpc)
    const view = render(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )

    view.rerender(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_B} leaderLabel="Benoit" notify={vi.fn()} />,
    )
    await act(async () => second.resolve({ data: available('Question for Benoit'), error: null }))
    expect(await screen.findByText('Question for Benoit')).toBeVisible()

    await act(async () => first.resolve({ data: available('Question for Amina'), error: null }))
    expect(screen.queryByText('Question for Amina')).not.toBeInTheDocument()
    expect(screen.getByText('Benoit decides.')).toBeVisible()
  })

  it('stays empty when the new workspace is unavailable and the old request resolves later', async () => {
    const first = deferred<{ data: unknown; error: null }>()
    const rpc = vi.fn((_name: string, parameters: Record<string, unknown>) => (
      parameters.p_workspace_id === WORKSPACE_A
        ? first.promise
        : Promise.resolve({ data: unavailable, error: null })
    ))
    const rpcClient = client(rpc)
    const view = render(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )

    view.rerender(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_B} leaderLabel="Benoit" notify={vi.fn()} />,
    )
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(2))
    await act(async () => {})
    expect(view.container).toBeEmptyDOMElement()

    await act(async () => first.resolve({ data: available('Stale A'), error: null }))
    expect(view.container).toBeEmptyDOMElement()
  })

  it('clears the old signal synchronously when the leader identity changes', async () => {
    const next = deferred<{ data: unknown; error: null }>()
    let calls = 0
    const rpc = vi.fn(() => {
      calls += 1
      return calls === 1
        ? Promise.resolve({ data: available('Amina question'), error: null })
        : next.promise
    })
    const rpcClient = client(rpc)
    const view = render(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )
    expect(await screen.findByText('Amina question')).toBeVisible()

    view.rerender(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Benoit" notify={vi.fn()} />,
    )
    expect(screen.queryByText('Amina question')).not.toBeInTheDocument()
    expect(screen.queryByText('Benoit decides.')).not.toBeInTheDocument()
  })

  it('clears an available item immediately for a new client or disabled seam', async () => {
    const rpcA = vi.fn(async () => ({ data: available('Current item'), error: null }))
    const pending = deferred<{ data: unknown; error: null }>()
    const clientA = client(rpcA)
    const clientB = client(vi.fn(() => pending.promise))
    const view = render(
      <OperatorReviewSignalGateway client={clientA} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )
    expect(await screen.findByText('Current item')).toBeVisible()

    view.rerender(
      <OperatorReviewSignalGateway client={clientB} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )
    expect(screen.queryByText('Current item')).not.toBeInTheDocument()

    view.rerender(
      <OperatorReviewSignalGateway client={clientB} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} enabled={false} />,
    )
    expect(view.container).toBeEmptyDOMElement()
    await act(async () => pending.resolve({ data: available('Must not resurrect'), error: null }))
    expect(screen.queryByText('Must not resurrect')).not.toBeInTheDocument()
  })

  it('resets copied state when the selected review packet changes', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const rpc = vi.fn(async (_name: string, parameters: Record<string, unknown>) => ({
      data: parameters.p_workspace_id === WORKSPACE_A
        ? available('Question A', '13300000-0000-4000-8000-000000000003')
        : available('Question B', '13300000-0000-4000-8000-000000000004'),
      error: null,
    }))
    const rpcClient = client(rpc)
    const view = render(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Copy question' }))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible()

    view.rerender(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_B} leaderLabel="Benoit" notify={vi.fn()} />,
    )
    expect(await screen.findByText('Question B')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Copy question' })).toBeVisible()
  })

  it('does not issue another receipt call for an unrelated rerender of the same selection', async () => {
    const rpc = vi.fn(async () => ({ data: available('Stable question'), error: null }))
    const rpcClient = client(rpc)
    const view = render(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )
    expect(await screen.findByText('Stable question')).toBeVisible()

    view.rerender(
      <OperatorReviewSignalGateway client={rpcClient} workspaceId={WORKSPACE_A} leaderLabel="Amina" notify={vi.fn()} />,
    )
    await act(async () => {})
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('deduplicates the read-shaped receipt call under React StrictMode', async () => {
    const request = deferred<{ data: unknown; error: null }>()
    const rpc = vi.fn(() => request.promise)
    render(
      <StrictMode>
        <OperatorReviewSignalGateway
          client={client(rpc)}
          workspaceId={WORKSPACE_A}
          leaderLabel="Amina"
          notify={vi.fn()}
        />
      </StrictMode>,
    )

    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1))
    await act(async () => request.resolve({ data: available('One receipt'), error: null }))
    expect(await screen.findByText('One receipt')).toBeVisible()
  })
})

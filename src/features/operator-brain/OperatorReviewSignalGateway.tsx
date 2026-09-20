import type { StandardReviewRpcClient } from '@/features/standard-review/ownerOperatorBinding'
import { OperatorReviewSignal } from './OperatorReviewSignal'
import { useOperatorReviewSignal } from './useOperatorReviewSignal'

export function OperatorReviewSignalGateway({
  client,
  workspaceId,
  leaderLabel,
  notify,
  enabled = true,
}: {
  client: StandardReviewRpcClient
  workspaceId: string
  leaderLabel: string
  notify: (message: string) => void
  enabled?: boolean
}) {
  const state = useOperatorReviewSignal(client, workspaceId, leaderLabel, enabled)

  if (state.status !== 'available' || !state.queue) return null

  return (
    <>
      <span className="sr-only" role="status">One question for {leaderLabel} is ready.</span>
      <OperatorReviewSignal
        key={state.queue.next.review_packet_id}
        queue={state.queue}
        leaderLabel={leaderLabel}
        notify={notify}
      />
    </>
  )
}

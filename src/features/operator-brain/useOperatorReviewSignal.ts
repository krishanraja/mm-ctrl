import { useEffect, useRef, useState } from 'react'
import {
  getOperatorPendingQueue,
  OperatorPendingQueueError,
  type OperatorPendingQueue,
} from '@/features/standard-review/operatorPendingQueue'
import type { StandardReviewRpcClient } from '@/features/standard-review/ownerOperatorBinding'

type AvailableQueue = Extract<OperatorPendingQueue, { available: true }>

export type OperatorReviewSignalStatus =
  | 'idle'
  | 'loading'
  | 'available'
  | 'unavailable'
  | OperatorPendingQueueError['code']
  | 'unknown'

export type OperatorReviewSignalState = {
  status: OperatorReviewSignalStatus
  client: StandardReviewRpcClient
  workspaceId: string
  leaderLabel: string
  queue?: AvailableQueue
}

function validLeaderLabel(value: string): boolean {
  const length = Array.from(value.trim()).length
  return value === value.trim() && length >= 1 && length <= 120
}

const inFlightByClient = new WeakMap<StandardReviewRpcClient, Map<string, Promise<OperatorPendingQueue>>>()

function loadCurrentQueue(
  client: StandardReviewRpcClient,
  workspaceId: string,
): Promise<OperatorPendingQueue> {
  let requests = inFlightByClient.get(client)
  if (!requests) {
    requests = new Map()
    inFlightByClient.set(client, requests)
  }

  const existing = requests.get(workspaceId)
  if (existing) return existing

  const request = getOperatorPendingQueue(client, workspaceId)
  requests.set(workspaceId, request)
  void request.finally(() => {
    if (requests?.get(workspaceId) === request) requests.delete(workspaceId)
  }).catch(() => {})
  return request
}

export function useOperatorReviewSignal(
  client: StandardReviewRpcClient,
  workspaceId: string,
  leaderLabel: string,
  enabled = true,
): OperatorReviewSignalState {
  const [settled, setSettled] = useState<OperatorReviewSignalState>({
    status: 'idle',
    client,
    workspaceId,
    leaderLabel,
  })
  const requestToken = useRef(0)
  const contextValid = enabled && validLeaderLabel(leaderLabel)
  const currentIdentity = settled.client === client
    && settled.workspaceId === workspaceId
    && settled.leaderLabel === leaderLabel

  const visibleState: OperatorReviewSignalState = !contextValid
    ? { status: 'idle', client, workspaceId, leaderLabel }
    : currentIdentity
      ? settled
      : { status: 'loading', client, workspaceId, leaderLabel }

  useEffect(() => {
    const token = ++requestToken.current
    let mounted = true

    if (!contextValid) {
      setSettled({ status: 'idle', client, workspaceId, leaderLabel })
      return () => {
        mounted = false
        requestToken.current += 1
      }
    }

    setSettled({ status: 'loading', client, workspaceId, leaderLabel })

    void loadCurrentQueue(client, workspaceId)
      .then((queue) => {
        if (!mounted || requestToken.current !== token) return
        setSettled(queue.available
          ? { status: 'available', client, workspaceId, leaderLabel, queue }
          : { status: 'unavailable', client, workspaceId, leaderLabel })
      })
      .catch((error: unknown) => {
        if (!mounted || requestToken.current !== token) return
        const status = error instanceof OperatorPendingQueueError ? error.code : 'unknown'
        setSettled({ status, client, workspaceId, leaderLabel })
      })

    return () => {
      mounted = false
      requestToken.current += 1
    }
  }, [client, contextValid, leaderLabel, workspaceId])

  return visibleState
}

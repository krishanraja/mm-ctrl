import { getOperatorPendingQueue } from '../src/features/standard-review/operatorPendingQueue'
import type { StandardReviewRpcClient } from '../src/features/standard-review/ownerOperatorBinding'

const rpcName = 'get_operator_pending_standard_change_review_v1'
const rpcPath = `/rest/v1/rpc/${rpcName}`
const originalFetch = globalThis.fetch.bind(globalThis)
let strictAdapterCalls = 0

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url

  if (!url.endsWith(rpcPath)) return originalFetch(input, init)

  const supplied = parseJson(String(init?.body ?? ''))
  const workspaceId = typeof supplied === 'object' && supplied !== null
    ? Reflect.get(supplied, 'p_workspace_id')
    : null

  const client: StandardReviewRpcClient = {
    async rpc(functionName, parameters) {
      if (functionName !== rpcName) throw new Error('R135 adapter attempted an unexpected RPC')
      strictAdapterCalls += 1
      const response = await originalFetch(input, {
        ...init,
        body: JSON.stringify(parameters),
      })
      const payload = parseJson(await response.text())
      return response.ok
        ? { data: payload, error: null }
        : { data: null, error: { message: 'isolated_rpc_failed' } }
    },
  }

  try {
    const queue = await getOperatorPendingQueue(client, String(workspaceId ?? ''))
    return new Response(JSON.stringify(queue), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ message: 'strict_adapter_rejected' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

try {
  await import('./probe-ctrl-g25-owner-operator-hosted-lifecycle-r130.mjs')
  if (strictAdapterCalls !== 1) {
    throw new Error(`R135 expected one strict adapter call, observed ${strictAdapterCalls}`)
  }
} finally {
  globalThis.fetch = originalFetch
}

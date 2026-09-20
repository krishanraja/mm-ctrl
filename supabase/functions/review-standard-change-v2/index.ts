import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { isJsonRequest, readJsonWithLimit, safeErrorMessage } from '../_shared/public-request-guard.ts'
import {
  ownerPresentationStandardChangeRpc,
  ownerStandardChangeErrorStatus,
  parseOwnerStandardChangeRequest,
} from '../_shared/standard-change-owner-presentation-core.ts'

const MAX_BYTES = 8_192

function response(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
    if (!isJsonRequest(request.headers)) return response({ error: 'json_required' }, 415)

    let raw: unknown
    try {
      raw = await readJsonWithLimit(request, MAX_BYTES)
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === 'request_too_large'
      return response({ error: tooLarge ? 'request_too_large' : 'invalid_json' }, tooLarge ? 413 : 400)
    }

    let parsed
    try {
      parsed = parseOwnerStandardChangeRequest(raw)
    } catch (error) {
      return response({ error: safeErrorMessage(error) }, 400)
    }

    const rpc = ownerPresentationStandardChangeRpc(parsed)
    const { data, error } = await ctx.supabase.rpc(rpc.name, rpc.args)
    if (error) {
      const message = safeErrorMessage(error)
      const status = ownerStandardChangeErrorStatus(message)
      if (status === 500) {
        console.error('review-standard-change-v2 failed', { action: parsed.action, error: message })
      }
      return response({ error: status === 500 ? 'owner_change_failed' : 'state_conflict' }, status)
    }
    return response({ action: parsed.action, result: data })
  }),
}

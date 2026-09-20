import { projectPreparedStandardReview } from './contract'
import {
  StandardReviewGateway,
  type StandardReviewFunctionInvoker,
} from './gateway'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asPreparedResponse(input: unknown): unknown {
  if (!input || typeof input !== 'object' || !('action' in input) || !('result' in input)) return input
  if ((input as { action?: unknown }).action !== 'open') return input
  return { ...(input as Record<string, unknown>), action: 'prepare' }
}

export function createAddressedStandardReviewGateway(
  invoker: StandardReviewFunctionInvoker,
  reviewPacketId: string,
): StandardReviewGateway {
  if (!UUID.test(reviewPacketId)) throw new Error('invalid_review_address')

  return new StandardReviewGateway({
    async invoke(_functionName, options) {
      if (options.body.action === 'prepare') {
        const response = await invoker.invoke('review-standard-change-v3', {
          body: { action: 'open', review_packet_id: reviewPacketId },
        })
        return { ...response, data: asPreparedResponse(response.data) }
      }
      return invoker.invoke('review-standard-change-v3', options)
    },
  })
}

export function projectOpenedStandardReview(input: unknown) {
  return projectPreparedStandardReview(asPreparedResponse(input))
}

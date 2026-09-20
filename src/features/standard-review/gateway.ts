import {
  projectPreparedStandardReview,
  type StandardReviewViewModel,
} from './contract'
import { z } from 'zod'

const uuid = z.string().uuid()
const sha256 = z.string().regex(/^[0-9a-f]{64}$/)

const approvedDecisionResponseSchema = z.object({
  action: z.literal('decide'),
  result: z.object({
    decision: z.literal('approved'),
    application_id: uuid,
    application_hash: sha256,
    active_standard_sha256: sha256,
    reversible_while_current_head: z.literal(true),
    deploy_authorized: z.literal(false).optional(),
    release_authorized: z.literal(false).optional(),
  }).passthrough(),
}).strict()

const rejectedDecisionResponseSchema = z.object({
  action: z.literal('decide'),
  result: z.object({
    decision: z.literal('rejected'),
    application_id: z.null(),
    active_standard_mutated: z.literal(false),
    deploy_authorized: z.literal(false).optional(),
    release_authorized: z.literal(false).optional(),
  }).passthrough(),
}).strict()

const reversalResponseSchema = z.object({
  action: z.literal('reverse'),
  result: z.object({
    restored: z.literal(true),
    reversal_id: uuid,
    reversal_hash: sha256,
    active_standard_sha256: sha256,
    deploy_authorized: z.literal(false).optional(),
    release_authorized: z.literal(false).optional(),
  }).passthrough(),
}).strict()

export interface StandardReviewFunctionInvoker {
  invoke(
    functionName: string,
    options: { body: Record<string, unknown> },
  ): Promise<{ data: unknown; error: { message: string; code?: string } | null }>
}

export interface StandardReviewDecisionResult {
  decision: 'approved' | 'rejected'
  applicationId: string | null
  applicationHash: string | null
  activeStandardSha256: string | null
  reversibleWhileCurrent: boolean
}

interface OwnerFunctionResponse {
  action: 'prepare' | 'decide' | 'reverse'
  result: Record<string, unknown>
}

export class StandardReviewGatewayError extends Error {
  constructor(readonly code: 'transport_failed' | 'state_conflict' | 'response_invalid') {
    super(
      code === 'transport_failed'
        ? 'The review could not be reached.'
        : code === 'state_conflict'
          ? 'This rule changed while you were reviewing it.'
          : 'The review response was not trustworthy.',
    )
    this.name = 'StandardReviewGatewayError'
  }
}

export class StandardReviewGateway {
  constructor(private readonly invoker: StandardReviewFunctionInvoker) {}

  async prepare(checkId: string, expectedResultSha256: string): Promise<StandardReviewViewModel> {
    const response = await this.invoke({
      action: 'prepare',
      check_id: checkId,
      expected_result_sha256: expectedResultSha256,
    })
    return projectPreparedStandardReview(response)
  }

  async decide(
    review: StandardReviewViewModel,
    decision: 'approved' | 'rejected',
    requestId: string,
    note?: string,
  ): Promise<StandardReviewDecisionResult> {
    const response = await this.invoke({
      action: 'decide',
      review_packet_id: review.reviewPacketId,
      expected_packet_sha256: review.reviewPacketSha256,
      expected_standard_sha256: review.plannedStandardSha256,
      request_id: requestId,
      decision,
      ...(note ? { note } : {}),
    })
    if (decision === 'approved') {
      const parsed = approvedDecisionResponseSchema.safeParse(response)
      if (!parsed.success) throw new StandardReviewGatewayError('response_invalid')
      return {
        decision,
        applicationId: parsed.data.result.application_id,
        applicationHash: parsed.data.result.application_hash,
        activeStandardSha256: parsed.data.result.active_standard_sha256,
        reversibleWhileCurrent: parsed.data.result.reversible_while_current_head,
      }
    }

    const parsed = rejectedDecisionResponseSchema.safeParse(response)
    if (!parsed.success) throw new StandardReviewGatewayError('response_invalid')
    return {
      decision,
      applicationId: null,
      applicationHash: null,
      activeStandardSha256: null,
      reversibleWhileCurrent: false,
    }
  }

  async reverse(
    applicationId: string,
    applicationHash: string,
    activeStandardSha256: string,
    requestId: string,
    reason: string,
  ): Promise<void> {
    const response = await this.invoke({
      action: 'reverse',
      application_id: applicationId,
      expected_application_hash: applicationHash,
      expected_active_standard_sha256: activeStandardSha256,
      request_id: requestId,
      reason,
    })
    if (!reversalResponseSchema.safeParse(response).success) throw new StandardReviewGatewayError('response_invalid')
  }

  private async invoke(body: Record<string, unknown>): Promise<OwnerFunctionResponse> {
    const { data, error } = await this.invoker.invoke('review-standard-change-v2', { body })
    if (error) {
      throw new StandardReviewGatewayError(
        error.code === 'state_conflict' || error.message.includes('state_conflict')
          ? 'state_conflict'
          : 'transport_failed',
      )
    }
    if (!data) throw new StandardReviewGatewayError('transport_failed')
    if (typeof data !== 'object' || !('action' in data) || !('result' in data)) {
      throw new StandardReviewGatewayError('response_invalid')
    }
    return data as OwnerFunctionResponse
  }
}

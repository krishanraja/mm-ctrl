import { describe, expect, it } from 'vitest'

import {
  OPERATOR_REVIEW_AUDIENCE,
  OPERATOR_REVIEW_PURPOSE,
  evaluateOperatorReviewAccess,
  type OperatorReviewAccessInput,
} from './operatorAccess'

const base = (): OperatorReviewAccessInput => ({
  observedAt: '2026-09-20T12:00:00.000Z',
  authenticatedUserId: 'operator-user',
  operatorPrincipalId: 'operator-principal',
  selectedWorkspaceId: 'workspace-a',
  workspace: {
    id: 'workspace-a',
    subjectId: 'subject-a',
    ownerId: 'owner-a',
    lifecycleState: 'active',
  },
  operatorRole: {
    workspaceId: 'workspace-a',
    userId: 'operator-user',
    role: 'operator',
    grantedBy: 'owner-a',
    grantedAt: '2026-09-19T12:00:00.000Z',
    revokedAt: null,
  },
  audienceGrant: {
    id: 'grant-a',
    workspaceId: 'workspace-a',
    granteeUserId: 'operator-user',
    audience: OPERATOR_REVIEW_AUDIENCE,
    purpose: OPERATOR_REVIEW_PURPOSE,
    grantedBy: 'owner-a',
    grantedAt: '2026-09-19T12:00:00.000Z',
    expiresAt: '2026-10-20T12:00:00.000Z',
    revokedAt: null,
  },
  review: {
    id: 'review-a',
    workspaceId: 'workspace-a',
    subjectId: 'subject-a',
    ownerId: 'owner-a',
    projectionAudience: OPERATOR_REVIEW_AUDIENCE,
    projectionPurpose: OPERATOR_REVIEW_PURPOSE,
    state: 'ready',
  },
})

describe('operator review access', () => {
  it('allows one owner-granted, finite, exact-purpose operator read', () => {
    const decision = evaluateOperatorReviewAccess(base())

    expect(decision.available).toBe(true)
    expect(decision.capability).toBe('read_operator_safe_review_projection')
    expect(decision.receipt).toMatchObject({
      outcome: 'allowed',
      reason: 'allowed',
      decisionAuthorityGranted: false,
      activeStandardMutated: false,
      notificationSent: false,
    })
    expect(decision.receipt.returnedFields).toEqual([
      'review_packet_id',
      'question',
      'headline',
      'consequence',
      'ready_since',
    ])
  })

  const deniedCases: Array<{
    name: string
    change: (input: OperatorReviewAccessInput) => void
    reason: string
  }> = [
    {
      name: 'missing stable operator identity',
      change: (input) => {
        input.operatorPrincipalId = null
      },
      reason: 'stable_operator_identity_required',
    },
    {
      name: 'unselected workspace',
      change: (input) => {
        input.selectedWorkspaceId = 'workspace-b'
      },
      reason: 'workspace_not_selected',
    },
    {
      name: 'paused workspace',
      change: (input) => {
        if (input.workspace) input.workspace.lifecycleState = 'paused'
      },
      reason: 'workspace_not_active',
    },
    {
      name: 'owner attempting the operator route',
      change: (input) => {
        input.authenticatedUserId = 'owner-a'
      },
      reason: 'owner_must_use_owner_route',
    },
    {
      name: 'viewer role',
      change: (input) => {
        if (input.operatorRole) input.operatorRole.role = 'viewer'
      },
      reason: 'operator_role_invalid',
    },
    {
      name: 'revoked role',
      change: (input) => {
        if (input.operatorRole) input.operatorRole.revokedAt = '2026-09-20T11:00:00.000Z'
      },
      reason: 'operator_role_revoked',
    },
    {
      name: 'self-granted operator role',
      change: (input) => {
        if (input.operatorRole) input.operatorRole.grantedBy = 'operator-user'
      },
      reason: 'operator_role_not_owner_granted',
    },
    {
      name: 'wrong purpose',
      change: (input) => {
        if (input.audienceGrant) input.audienceGrant.purpose = 'prepared_intelligence'
      },
      reason: 'audience_grant_invalid',
    },
    {
      name: 'wrong audience',
      change: (input) => {
        if (input.audienceGrant) input.audienceGrant.audience = 'person_private'
      },
      reason: 'audience_grant_invalid',
    },
    {
      name: 'open-ended grant',
      change: (input) => {
        if (input.audienceGrant) input.audienceGrant.expiresAt = null
      },
      reason: 'audience_grant_expiry_required',
    },
    {
      name: 'expired grant',
      change: (input) => {
        if (input.audienceGrant) input.audienceGrant.expiresAt = '2026-09-20T12:00:00.000Z'
      },
      reason: 'audience_grant_expired',
    },
    {
      name: 'self-granted audience access',
      change: (input) => {
        if (input.audienceGrant) input.audienceGrant.grantedBy = 'operator-user'
      },
      reason: 'audience_grant_not_owner_granted',
    },
    {
      name: 'cross-workspace packet',
      change: (input) => {
        if (input.review) input.review.workspaceId = 'workspace-b'
      },
      reason: 'review_binding_invalid',
    },
    {
      name: 'cross-subject packet',
      change: (input) => {
        if (input.review) input.review.subjectId = 'subject-b'
      },
      reason: 'review_binding_invalid',
    },
    {
      name: 'owner-private packet',
      change: (input) => {
        if (input.review) input.review.projectionAudience = 'person_private'
      },
      reason: 'review_binding_invalid',
    },
    {
      name: 'wrong packet projection purpose',
      change: (input) => {
        if (input.review) input.review.projectionPurpose = 'decision_support'
      },
      reason: 'review_binding_invalid',
    },
    {
      name: 'decided packet',
      change: (input) => {
        if (input.review) input.review.state = 'decided'
      },
      reason: 'review_not_ready',
    },
  ]

  it.each(deniedCases)('fails closed for $name', ({ change, reason }) => {
    const input = base()
    change(input)

    const decision = evaluateOperatorReviewAccess(input)

    expect(decision).toMatchObject({
      available: false,
      publicReason: 'not_available',
      capability: null,
      receipt: {
        outcome: 'denied',
        reason,
        returnedFields: [],
        decisionAuthorityGranted: false,
      },
    })
  })
})

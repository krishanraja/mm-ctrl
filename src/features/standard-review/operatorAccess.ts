export const OPERATOR_REVIEW_AUDIENCE = 'delivery_team_private' as const
export const OPERATOR_REVIEW_PURPOSE = 'standard_change_review_preparation' as const

export type OperatorReviewAccessReason =
  | 'allowed'
  | 'auth_required'
  | 'stable_operator_identity_required'
  | 'workspace_not_available'
  | 'workspace_not_selected'
  | 'workspace_not_active'
  | 'owner_must_use_owner_route'
  | 'operator_role_missing'
  | 'operator_role_invalid'
  | 'operator_role_revoked'
  | 'operator_role_not_owner_granted'
  | 'audience_grant_missing'
  | 'audience_grant_invalid'
  | 'audience_grant_revoked'
  | 'audience_grant_expiry_required'
  | 'audience_grant_expired'
  | 'audience_grant_not_owner_granted'
  | 'review_not_available'
  | 'review_binding_invalid'
  | 'review_not_ready'

export interface OperatorReviewWorkspace {
  id: string
  subjectId: string
  ownerId: string
  lifecycleState: 'active' | 'paused' | 'archived'
}

export interface OperatorReviewRole {
  workspaceId: string
  userId: string
  role: string
  grantedBy: string | null
  grantedAt: string
  revokedAt: string | null
}

export interface OperatorReviewAudienceGrant {
  id: string
  workspaceId: string
  granteeUserId: string
  audience: string
  purpose: string
  grantedBy: string | null
  grantedAt: string
  expiresAt: string | null
  revokedAt: string | null
}

export interface OperatorReviewBinding {
  id: string
  workspaceId: string
  subjectId: string
  ownerId: string
  projectionAudience: string
  projectionPurpose: string
  state: string
}

export interface OperatorReviewAccessInput {
  observedAt: string
  authenticatedUserId: string | null
  operatorPrincipalId: string | null
  selectedWorkspaceId: string
  workspace: OperatorReviewWorkspace | null
  operatorRole: OperatorReviewRole | null
  audienceGrant: OperatorReviewAudienceGrant | null
  review: OperatorReviewBinding | null
}

export interface OperatorReviewAccessReceipt {
  schema: 'ctrl.standard-change.operator-access-receipt.v1'
  observedAt: string
  authenticatedUserId: string | null
  operatorPrincipalId: string | null
  selectedWorkspaceId: string
  workspaceId: string | null
  subjectId: string | null
  ownerId: string | null
  role: 'operator'
  roleGrantedBy: string | null
  audienceGrantId: string | null
  audience: typeof OPERATOR_REVIEW_AUDIENCE
  purpose: typeof OPERATOR_REVIEW_PURPOSE
  reviewPacketId: string | null
  resourceKind: 'standard_change_review_projection'
  outcome: 'allowed' | 'denied'
  reason: OperatorReviewAccessReason
  returnedFields: string[]
  activeStandardMutated: false
  decisionAuthorityGranted: false
  notificationSent: false
}

export interface OperatorReviewAccessDecision {
  available: boolean
  publicReason: 'not_available' | null
  capability: 'read_operator_safe_review_projection' | null
  receipt: OperatorReviewAccessReceipt
}

const validInstant = (value: string): number | null => {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const evaluateOperatorReviewAccess = (
  input: OperatorReviewAccessInput,
): OperatorReviewAccessDecision => {
  const deny = (reason: OperatorReviewAccessReason): OperatorReviewAccessDecision => ({
    available: false,
    publicReason: 'not_available',
    capability: null,
    receipt: buildReceipt(input, 'denied', reason),
  })

  const observedAt = validInstant(input.observedAt)
  if (!input.authenticatedUserId || observedAt === null) return deny('auth_required')
  if (!input.operatorPrincipalId) return deny('stable_operator_identity_required')
  if (!input.workspace) return deny('workspace_not_available')
  if (input.selectedWorkspaceId !== input.workspace.id) return deny('workspace_not_selected')
  if (input.workspace.lifecycleState !== 'active') return deny('workspace_not_active')
  if (input.authenticatedUserId === input.workspace.ownerId) return deny('owner_must_use_owner_route')

  const role = input.operatorRole
  if (!role) return deny('operator_role_missing')
  if (
    role.workspaceId !== input.workspace.id ||
    role.userId !== input.authenticatedUserId ||
    role.role !== 'operator' ||
    validInstant(role.grantedAt) === null ||
    (validInstant(role.grantedAt) ?? Number.POSITIVE_INFINITY) > observedAt
  ) {
    return deny('operator_role_invalid')
  }
  if (role.revokedAt !== null) return deny('operator_role_revoked')
  if (role.grantedBy !== input.workspace.ownerId) return deny('operator_role_not_owner_granted')

  const grant = input.audienceGrant
  if (!grant) return deny('audience_grant_missing')
  if (
    grant.workspaceId !== input.workspace.id ||
    grant.granteeUserId !== input.authenticatedUserId ||
    grant.audience !== OPERATOR_REVIEW_AUDIENCE ||
    grant.purpose !== OPERATOR_REVIEW_PURPOSE ||
    validInstant(grant.grantedAt) === null ||
    (validInstant(grant.grantedAt) ?? Number.POSITIVE_INFINITY) > observedAt
  ) {
    return deny('audience_grant_invalid')
  }
  if (grant.revokedAt !== null) return deny('audience_grant_revoked')
  if (grant.expiresAt === null || validInstant(grant.expiresAt) === null) {
    return deny('audience_grant_expiry_required')
  }
  if ((validInstant(grant.expiresAt) ?? Number.NEGATIVE_INFINITY) <= observedAt) {
    return deny('audience_grant_expired')
  }
  if (grant.grantedBy !== input.workspace.ownerId) {
    return deny('audience_grant_not_owner_granted')
  }

  const review = input.review
  if (!review) return deny('review_not_available')
  if (
    review.workspaceId !== input.workspace.id ||
    review.subjectId !== input.workspace.subjectId ||
    review.ownerId !== input.workspace.ownerId ||
    review.projectionAudience !== OPERATOR_REVIEW_AUDIENCE ||
    review.projectionPurpose !== OPERATOR_REVIEW_PURPOSE
  ) {
    return deny('review_binding_invalid')
  }
  if (review.state !== 'ready') return deny('review_not_ready')

  return {
    available: true,
    publicReason: null,
    capability: 'read_operator_safe_review_projection',
    receipt: buildReceipt(input, 'allowed', 'allowed'),
  }
}

const buildReceipt = (
  input: OperatorReviewAccessInput,
  outcome: 'allowed' | 'denied',
  reason: OperatorReviewAccessReason,
): OperatorReviewAccessReceipt => ({
  schema: 'ctrl.standard-change.operator-access-receipt.v1',
  observedAt: input.observedAt,
  authenticatedUserId: input.authenticatedUserId,
  operatorPrincipalId: input.operatorPrincipalId,
  selectedWorkspaceId: input.selectedWorkspaceId,
  workspaceId: input.workspace?.id ?? null,
  subjectId: input.workspace?.subjectId ?? null,
  ownerId: input.workspace?.ownerId ?? null,
  role: 'operator',
  roleGrantedBy: input.operatorRole?.grantedBy ?? null,
  audienceGrantId: input.audienceGrant?.id ?? null,
  audience: OPERATOR_REVIEW_AUDIENCE,
  purpose: OPERATOR_REVIEW_PURPOSE,
  reviewPacketId: input.review?.id ?? null,
  resourceKind: 'standard_change_review_projection',
  outcome,
  reason,
  returnedFields:
    outcome === 'allowed'
      ? ['review_packet_id', 'question', 'headline', 'consequence', 'ready_since']
      : [],
  activeStandardMutated: false,
  decisionAuthorityGranted: false,
  notificationSent: false,
})

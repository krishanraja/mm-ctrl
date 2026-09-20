export const OPERATOR_ROUTE_ISOLATED_PROJECT_REF = 'cgkcplcamsijghalintq'
export const OPERATOR_ROUTE_PRODUCTION_PROJECT_REF = 'bkyuxvschuwngtcdhsyg'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const OPERATOR_ROUTE_BLOCK_REASONS = [
  'feature_disabled',
  'runtime_project_not_isolated',
  'runtime_project_url_mismatch',
  'production_target_collision',
  'global_product_client_forbidden',
  'auth_not_human_operator',
  'auth_project_mismatch',
  'operator_principal_invalid',
  'workspace_id_invalid',
  'workspace_selection_not_server_verified',
  'decision_id_invalid',
  'decision_projection_not_live',
  'decision_workspace_mismatch',
  'decision_environment_mismatch',
  'review_projection_not_live',
  'review_workspace_mismatch',
  'review_decision_unbound',
  'review_environment_mismatch',
] as const

export type OperatorRouteBlockReason = (typeof OPERATOR_ROUTE_BLOCK_REASONS)[number]
export type OperatorProjectionMode = 'live' | 'synthetic' | 'missing'

export interface OperatorDecisionRouteReadinessInput {
  featureEnabled: boolean
  runtimeProjectRef: string
  runtimeProjectUrl: string
  productionProjectRef: string
  usesGlobalProductClient: boolean
  auth: {
    state: 'authenticated' | 'anonymous' | 'missing' | 'loading'
    clientProjectRef: string
    operatorPrincipalId: string | null
  }
  selection: {
    workspaceId: string
    authority: 'server_verified' | 'url_only' | 'unknown'
  }
  decisionProjection: {
    mode: OperatorProjectionMode
    workspaceId: string | null
    decisionId: string | null
    sourceEnvironmentRef: string | null
  }
  reviewProjection: {
    mode: OperatorProjectionMode
    workspaceId: string | null
    decisionId: string | null
    sourceEnvironmentRef: string | null
  }
}

export type OperatorDecisionRouteReadiness =
  | {
      status: 'blocked'
      route: null
      reasons: OperatorRouteBlockReason[]
    }
  | {
      status: 'ready'
      route: string
      reasons: []
      workspaceId: string
      decisionId: string
      projectRef: typeof OPERATOR_ROUTE_ISOLATED_PROJECT_REF
    }

export function assessOperatorDecisionRouteReadiness(
  input: OperatorDecisionRouteReadinessInput,
): OperatorDecisionRouteReadiness {
  const reasons: OperatorRouteBlockReason[] = []
  const add = (reason: OperatorRouteBlockReason) => {
    if (!reasons.includes(reason)) reasons.push(reason)
  }

  if (!input.featureEnabled) add('feature_disabled')
  if (input.runtimeProjectRef !== OPERATOR_ROUTE_ISOLATED_PROJECT_REF) add('runtime_project_not_isolated')
  if (input.runtimeProjectUrl !== `https://${OPERATOR_ROUTE_ISOLATED_PROJECT_REF}.supabase.co`) {
    add('runtime_project_url_mismatch')
  }
  if (
    input.productionProjectRef !== OPERATOR_ROUTE_PRODUCTION_PROJECT_REF ||
    input.runtimeProjectRef === input.productionProjectRef
  ) add('production_target_collision')
  if (input.usesGlobalProductClient) add('global_product_client_forbidden')

  if (input.auth.state !== 'authenticated') add('auth_not_human_operator')
  if (input.auth.clientProjectRef !== input.runtimeProjectRef) add('auth_project_mismatch')
  if (!UUID.test(input.auth.operatorPrincipalId ?? '')) add('operator_principal_invalid')

  const selectedWorkspaceId = input.selection.workspaceId
  if (!UUID.test(selectedWorkspaceId)) add('workspace_id_invalid')
  if (input.selection.authority !== 'server_verified') add('workspace_selection_not_server_verified')

  const decisionId = input.decisionProjection.decisionId
  if (!UUID.test(decisionId ?? '')) add('decision_id_invalid')
  if (input.decisionProjection.mode !== 'live') add('decision_projection_not_live')
  if (input.decisionProjection.workspaceId !== selectedWorkspaceId) add('decision_workspace_mismatch')
  if (input.decisionProjection.sourceEnvironmentRef !== input.runtimeProjectRef) {
    add('decision_environment_mismatch')
  }

  if (input.reviewProjection.mode !== 'live') add('review_projection_not_live')
  if (input.reviewProjection.workspaceId !== selectedWorkspaceId) add('review_workspace_mismatch')
  if (!UUID.test(input.reviewProjection.decisionId ?? '') || input.reviewProjection.decisionId !== decisionId) {
    add('review_decision_unbound')
  }
  if (input.reviewProjection.sourceEnvironmentRef !== input.runtimeProjectRef) {
    add('review_environment_mismatch')
  }

  if (reasons.length > 0 || !decisionId) return { status: 'blocked', route: null, reasons }

  return {
    status: 'ready',
    route: `/operator/workspaces/${selectedWorkspaceId}/decisions/${decisionId}`,
    reasons: [],
    workspaceId: selectedWorkspaceId,
    decisionId,
    projectRef: OPERATOR_ROUTE_ISOLATED_PROJECT_REF,
  }
}

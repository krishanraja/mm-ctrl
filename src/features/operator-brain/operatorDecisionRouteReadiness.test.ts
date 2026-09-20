import { describe, expect, it } from 'vitest'
import {
  assessOperatorDecisionRouteReadiness,
  OPERATOR_ROUTE_ISOLATED_PROJECT_REF,
  OPERATOR_ROUTE_PRODUCTION_PROJECT_REF,
  type OperatorDecisionRouteReadinessInput,
} from './operatorDecisionRouteReadiness'

const ids = {
  operator: '13900000-0000-4000-8000-000000000001',
  workspace: '13900000-0000-4000-8000-000000000002',
  decision: '13900000-0000-4000-8000-000000000003',
  otherWorkspace: '13900000-0000-4000-8000-000000000004',
  otherDecision: '13900000-0000-4000-8000-000000000005',
}

function readyInput(): OperatorDecisionRouteReadinessInput {
  return {
    featureEnabled: true,
    runtimeProjectRef: OPERATOR_ROUTE_ISOLATED_PROJECT_REF,
    runtimeProjectUrl: `https://${OPERATOR_ROUTE_ISOLATED_PROJECT_REF}.supabase.co`,
    productionProjectRef: OPERATOR_ROUTE_PRODUCTION_PROJECT_REF,
    usesGlobalProductClient: false,
    auth: {
      state: 'authenticated',
      clientProjectRef: OPERATOR_ROUTE_ISOLATED_PROJECT_REF,
      operatorPrincipalId: ids.operator,
    },
    selection: { workspaceId: ids.workspace, authority: 'server_verified' },
    decisionProjection: {
      mode: 'live',
      workspaceId: ids.workspace,
      decisionId: ids.decision,
      sourceEnvironmentRef: OPERATOR_ROUTE_ISOLATED_PROJECT_REF,
    },
    reviewProjection: {
      mode: 'live',
      workspaceId: ids.workspace,
      decisionId: ids.decision,
      sourceEnvironmentRef: OPERATOR_ROUTE_ISOLATED_PROJECT_REF,
    },
  }
}

describe('operator decision route readiness', () => {
  it('allows only a completely bound live isolated route', () => {
    expect(assessOperatorDecisionRouteReadiness(readyInput())).toEqual({
      status: 'ready',
      route: `/operator/workspaces/${ids.workspace}/decisions/${ids.decision}`,
      reasons: [],
      workspaceId: ids.workspace,
      decisionId: ids.decision,
      projectRef: OPERATOR_ROUTE_ISOLATED_PROJECT_REF,
    })
  })

  it('blocks the current mixed synthetic/live R138 composition from becoming a real route', () => {
    const input = readyInput()
    input.decisionProjection = {
      mode: 'synthetic',
      workspaceId: null,
      decisionId: null,
      sourceEnvironmentRef: null,
    }
    input.reviewProjection.decisionId = null
    expect(assessOperatorDecisionRouteReadiness(input)).toEqual({
      status: 'blocked',
      route: null,
      reasons: [
        'decision_id_invalid',
        'decision_projection_not_live',
        'decision_workspace_mismatch',
        'decision_environment_mismatch',
        'review_decision_unbound',
      ],
    })
  })

  it.each([
    ['disabled feature', (input: OperatorDecisionRouteReadinessInput) => { input.featureEnabled = false }, 'feature_disabled'],
    ['production target', (input: OperatorDecisionRouteReadinessInput) => { input.runtimeProjectRef = OPERATOR_ROUTE_PRODUCTION_PROJECT_REF }, 'runtime_project_not_isolated'],
    ['lookalike URL', (input: OperatorDecisionRouteReadinessInput) => { input.runtimeProjectUrl = `https://${OPERATOR_ROUTE_ISOLATED_PROJECT_REF}.supabase.co.attacker.invalid` }, 'runtime_project_url_mismatch'],
    ['global client', (input: OperatorDecisionRouteReadinessInput) => { input.usesGlobalProductClient = true }, 'global_product_client_forbidden'],
    ['anonymous auth', (input: OperatorDecisionRouteReadinessInput) => { input.auth.state = 'anonymous' }, 'auth_not_human_operator'],
    ['wrong auth project', (input: OperatorDecisionRouteReadinessInput) => { input.auth.clientProjectRef = OPERATOR_ROUTE_PRODUCTION_PROJECT_REF }, 'auth_project_mismatch'],
    ['missing stable principal', (input: OperatorDecisionRouteReadinessInput) => { input.auth.operatorPrincipalId = null }, 'operator_principal_invalid'],
    ['URL-only workspace', (input: OperatorDecisionRouteReadinessInput) => { input.selection.authority = 'url_only' }, 'workspace_selection_not_server_verified'],
    ['malformed workspace', (input: OperatorDecisionRouteReadinessInput) => { input.selection.workspaceId = 'SYN-CUST-014' }, 'workspace_id_invalid'],
    ['synthetic decision', (input: OperatorDecisionRouteReadinessInput) => { input.decisionProjection.mode = 'synthetic' }, 'decision_projection_not_live'],
    ['cross-workspace decision', (input: OperatorDecisionRouteReadinessInput) => { input.decisionProjection.workspaceId = ids.otherWorkspace }, 'decision_workspace_mismatch'],
    ['cross-environment decision', (input: OperatorDecisionRouteReadinessInput) => { input.decisionProjection.sourceEnvironmentRef = OPERATOR_ROUTE_PRODUCTION_PROJECT_REF }, 'decision_environment_mismatch'],
    ['missing review', (input: OperatorDecisionRouteReadinessInput) => { input.reviewProjection.mode = 'missing' }, 'review_projection_not_live'],
    ['cross-workspace review', (input: OperatorDecisionRouteReadinessInput) => { input.reviewProjection.workspaceId = ids.otherWorkspace }, 'review_workspace_mismatch'],
    ['review from another decision', (input: OperatorDecisionRouteReadinessInput) => { input.reviewProjection.decisionId = ids.otherDecision }, 'review_decision_unbound'],
    ['review from production', (input: OperatorDecisionRouteReadinessInput) => { input.reviewProjection.sourceEnvironmentRef = OPERATOR_ROUTE_PRODUCTION_PROJECT_REF }, 'review_environment_mismatch'],
  ])('blocks %s', (_name, mutate, reason) => {
    const input = readyInput()
    mutate(input)
    const result = assessOperatorDecisionRouteReadiness(input)
    expect(result.status).toBe('blocked')
    expect(result.reasons).toContain(reason)
    expect(result.route).toBeNull()
  })

  it('returns every relevant reason together rather than hiding the next unsafe dependency', () => {
    const input = readyInput()
    input.featureEnabled = false
    input.usesGlobalProductClient = true
    input.auth.state = 'missing'
    input.auth.operatorPrincipalId = null
    input.selection.authority = 'url_only'
    input.decisionProjection.mode = 'synthetic'
    input.reviewProjection.mode = 'missing'
    const result = assessOperatorDecisionRouteReadiness(input)
    expect(result.status).toBe('blocked')
    expect(result.reasons).toEqual([
      'feature_disabled',
      'global_product_client_forbidden',
      'auth_not_human_operator',
      'operator_principal_invalid',
      'workspace_selection_not_server_verified',
      'decision_projection_not_live',
      'review_projection_not_live',
    ])
  })
})

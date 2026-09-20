export type ProjectionSourceState =
  | 'canonical_available'
  | 'canonical_partial'
  | 'target_missing'
  | 'derived_blocked'
  | 'optional_absent'

export type ProjectionSourceSlice = {
  state: ProjectionSourceState
  canonicalSources: readonly string[]
  requiredNext: readonly string[]
  forbiddenFallbacks: readonly string[]
}

export const operatorDecisionSourcePlan = {
  authority: {
    state: 'canonical_available',
    canonicalSources: [
      'public.brain_workspaces',
      'public.brain_workspace_roles',
      'public.brain_audience_grants',
      'private.brain_operator_principals',
      'private.brain_operator_auth_links',
      'public.brain_access_receipts',
    ],
    requiredNext: [],
    forbiddenFallbacks: ['URL workspace selection', 'anonymous session', 'global production client'],
  },
  leader: {
    state: 'target_missing',
    canonicalSources: ['public.brain_workspaces'],
    requiredNext: ['workspace-bound subject presentation record'],
    forbiddenFallbacks: ['auth user metadata', 'legacy profile joined only by user_id', 'tenant_key as display name'],
  },
  decision: {
    state: 'target_missing',
    canonicalSources: [],
    requiredNext: [
      'workspace-bound decision case',
      'immutable decision version',
      'human prior',
      'typed routes',
      'route-changing questions',
      'owned call and outcome',
    ],
    forbiddenFallbacks: ['public.decision_cases inferred into a workspace from user_id', 'fixture decision identity'],
  },
  evidence: {
    state: 'canonical_partial',
    canonicalSources: [
      'public.brain_sources',
      'public.brain_assertions',
      'public.brain_item_version_assertions',
    ],
    requiredNext: ['purpose-bound decrypted atomic projection', 'decision artifact evidence links'],
    forbiddenFallbacks: ['raw source body', 'unscoped legacy evidence', 'model citation without stored assertion'],
  },
  portraitAndStandards: {
    state: 'canonical_partial',
    canonicalSources: [
      'public.brain_items',
      'public.brain_item_versions',
      'public.brain_item_version_assertions',
    ],
    requiredNext: ['purpose-bound decryption', 'decision applicability filter'],
    forbiddenFallbacks: ['all current items', 'high confidence treated as human acceptance', 'generic leadership advice'],
  },
  corrections: {
    state: 'canonical_partial',
    canonicalSources: ['public.brain_sources', 'public.brain_item_versions'],
    requiredNext: ['accepted correction and affected-dependency reader'],
    forbiddenFallbacks: ['disclaimer-only correction', 'deleted history', 'unaccepted model revision'],
  },
  priorDecisions: {
    state: 'derived_blocked',
    canonicalSources: [],
    requiredNext: ['workspace-bound decided case', 'owned call', 'observed outcome', 'explicit transfer rationale'],
    forbiddenFallbacks: ['semantic similarity alone', 'legacy decision title match', 'history-only extrapolation'],
  },
  analysis: {
    state: 'derived_blocked',
    canonicalSources: [],
    requiredNext: ['versioned analysis plan', 'independent challenge', 'evidence-linked recommendation'],
    forbiddenFallbacks: ['one model response', 'uncited summary', 'recommendation before human prior'],
  },
  claudeHandoff: {
    state: 'derived_blocked',
    canonicalSources: [],
    requiredNext: ['purpose-bound context compiler from exact accepted versions'],
    forbiddenFallbacks: ['thin prompt', 'raw Brain dump', 'reference IDs unavailable to Claude'],
  },
  returnedWork: {
    state: 'optional_absent',
    canonicalSources: [],
    requiredNext: ['context-exchange return receipt before non-null use'],
    forbiddenFallbacks: ['unsourced pasted output treated as a verified return'],
  },
  reviewSignal: {
    state: 'canonical_available',
    canonicalSources: [
      'public.standard_change_review_packets',
      'public.get_operator_pending_standard_change_review_v1',
    ],
    requiredNext: ['explicit decision identity binding before use in a decision projection'],
    forbiddenFallbacks: ['same workspace treated as same decision', 'review packet question reused without binding'],
  },
} as const satisfies Record<string, ProjectionSourceSlice>

const requiredStates = new Set<ProjectionSourceState>([
  'canonical_available',
  'canonical_partial',
  'target_missing',
  'derived_blocked',
])

export type OperatorDecisionSourceAssessment = {
  ready: boolean
  blockers: string[]
  prohibitedShortcuts: string[]
}

export function assessOperatorDecisionSources(
  plan: Record<string, ProjectionSourceSlice> = operatorDecisionSourcePlan,
): OperatorDecisionSourceAssessment {
  const blockers: string[] = []
  const prohibitedShortcuts: string[] = []

  for (const [name, slice] of Object.entries(plan)) {
    if (requiredStates.has(slice.state) && slice.state !== 'canonical_available') {
      blockers.push(`${name}:${slice.state}:${slice.requiredNext.join('|')}`)
    }
    for (const fallback of slice.forbiddenFallbacks) prohibitedShortcuts.push(`${name}:${fallback}`)
  }

  return {
    ready: blockers.length === 0,
    blockers,
    prohibitedShortcuts,
  }
}

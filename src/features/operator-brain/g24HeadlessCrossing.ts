import { z } from 'zod'

export const G24_SELECTOR_ROUTES = [
  'reuse',
  'enrich',
  'ask',
  'session',
  'abstain_hold',
] as const

export type G24SelectorRoute = (typeof G24_SELECTOR_ROUTES)[number]
export type G24ResolvingRoute = Extract<G24SelectorRoute, 'enrich' | 'ask' | 'session'>

export const G24_MINIMUM_CONTROL_KEYS = [
  'identity_version',
  'subject_version',
  'workspace_version',
  'authority_version',
  'permission_version',
  'audience_version',
  'purpose_version',
  'sensitivity_version',
  'validity_version',
  'retention_state_version',
  'lifecycle_version',
  'accepted_decision_frame_version',
  'decision_requirement_version',
  'evidence_coverage_version',
  'trusted_cutoff',
  'epistemic_policy_version',
  'independent_challenger_result_version',
  'canonical_source_versions',
  'canonical_assertion_versions',
  'canonical_brain_versions',
] as const

export type G24ControlState = 'current' | 'unknown' | 'mismatched' | 'invalid' | 'indeterminate'

export interface G24ControlReference {
  key: string
  lineageId: string
  version: string
  state: G24ControlState
  dependencies: string[]
  validFrom?: string
  validUntil?: string
}

export type G24ControlRegistry = Record<string, G24ControlReference>

export interface G24ControlWatermark {
  key: string
  lineageId: string
  version: string
}

export interface G24ControlClosure {
  roots: string[]
  watermarks: G24ControlWatermark[]
  errors: string[]
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function validDate(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function resolveG24ControlClosure(
  roots: readonly string[],
  controls: G24ControlRegistry,
  trustedAsOf: string,
  requireMinimum = true,
): G24ControlClosure {
  const errors: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const trustedTime = validDate(trustedAsOf)

  if (trustedTime === undefined) errors.push('trusted_as_of_invalid')

  const rootSet = new Set(roots)
  if (requireMinimum) {
    for (const requiredKey of G24_MINIMUM_CONTROL_KEYS) {
      if (!rootSet.has(requiredKey)) errors.push(`under_recorded_lineage:${requiredKey}`)
    }
  }

  function visit(key: string): void {
    if (visited.has(key)) return
    if (visiting.has(key)) {
      errors.push(`dependency_cycle:${key}`)
      return
    }

    const control = controls[key]
    if (!control) {
      errors.push(`missing_reference:${key}`)
      return
    }

    visiting.add(key)
    if (control.key !== key) errors.push(`mismatched_reference:${key}`)
    if (!control.lineageId.trim() || !control.version.trim()) errors.push(`invalid_reference:${key}`)
    if (control.state !== 'current') errors.push(`${control.state}_reference:${key}`)

    const validFrom = validDate(control.validFrom)
    const validUntil = validDate(control.validUntil)
    if (control.validFrom && validFrom === undefined) errors.push(`invalid_valid_from:${key}`)
    if (control.validUntil && validUntil === undefined) errors.push(`invalid_valid_until:${key}`)
    if (trustedTime !== undefined && validFrom !== undefined && validFrom > trustedTime) {
      errors.push(`future_dated_reference:${key}`)
    }
    if (trustedTime !== undefined && validUntil !== undefined && validUntil <= trustedTime) {
      errors.push(`expired_reference:${key}`)
    }

    for (const dependency of [...control.dependencies].sort(compareText)) visit(dependency)
    visiting.delete(key)
    visited.add(key)
  }

  for (const root of [...new Set(roots)].sort(compareText)) visit(root)

  const watermarks = [...visited]
    .map((key) => controls[key])
    .filter((control): control is G24ControlReference => Boolean(control))
    .map(({ key, lineageId, version }) => ({ key, lineageId, version }))
    .sort((left, right) => compareText(left.key, right.key))

  return {
    roots: [...new Set(roots)].sort(compareText),
    watermarks,
    errors: [...new Set(errors)].sort(compareText),
  }
}

export function fingerprintG24Watermarks(watermarks: readonly G24ControlWatermark[]): string {
  return [...watermarks]
    .sort((left, right) => compareText(left.key, right.key))
    .map(({ key, lineageId, version }) => `${key}=${lineageId}@${version}`)
    .join('|')
}

export type G24EvidenceState = 'sufficient' | 'gap' | 'ambiguity' | 'contradiction'
export type G24ChallengerResult =
  | 'countercase_found'
  | 'none_found_within_declared_boundary'
  | 'indeterminate'

export interface G24RouteCandidate {
  route: Exclude<G24SelectorRoute, 'abstain_hold'>
  permitted: boolean
  capable: boolean
  resolvesGap: boolean
  withinDeadline: boolean
  withinBudget: boolean
  fresh: boolean
  audienceCompatible: boolean
  provenanceIndependent: boolean
  useSpecificSufficient: boolean
  counterevidenceTreated: boolean
  reuseOrigin: 'same_case' | 'same_person_other_case' | 'same_workspace_other_case' | 'public_immutable'
  immutableReference: boolean
  containsPrivateReasoning: boolean
  burden: number
  rejectionReasons: string[]
}

export interface G24SelectorInput {
  selectorResultVersion: string
  acceptedDecisionFrameRef: string
  decisionRequirementRef: string
  evidenceCoverageRef: string
  trustedAsOf: string
  decisionConsequence: 'consequential' | 'low_value'
  controlRootKeys: string[]
  controls: G24ControlRegistry
  evidenceState: G24EvidenceState
  unresolvedEvidenceRefs: string[]
  expectedMaterialEffect: string
  trustedEvaluation: boolean
  challengerResult: G24ChallengerResult
  challengerSearchBoundary?: string
  candidates: G24RouteCandidate[]
}

const g24ControlReferenceSchema = z
  .object({
    key: z.string(),
    lineageId: z.string(),
    version: z.string(),
    state: z.enum(['current', 'unknown', 'mismatched', 'invalid', 'indeterminate']),
    dependencies: z.array(z.string()),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
  })
  .strict()

const g24RouteCandidateSchema = z
  .object({
    route: z.enum(['reuse', 'enrich', 'ask', 'session']),
    permitted: z.boolean(),
    capable: z.boolean(),
    resolvesGap: z.boolean(),
    withinDeadline: z.boolean(),
    withinBudget: z.boolean(),
    fresh: z.boolean(),
    audienceCompatible: z.boolean(),
    provenanceIndependent: z.boolean(),
    useSpecificSufficient: z.boolean(),
    counterevidenceTreated: z.boolean(),
    reuseOrigin: z.enum([
      'same_case',
      'same_person_other_case',
      'same_workspace_other_case',
      'public_immutable',
    ]),
    immutableReference: z.boolean(),
    containsPrivateReasoning: z.boolean(),
    burden: z.number(),
    rejectionReasons: z.array(z.string()),
  })
  .strict()

export const G24_SELECTOR_INPUT_SCHEMA = z
  .object({
    selectorResultVersion: z.string(),
    acceptedDecisionFrameRef: z.string(),
    decisionRequirementRef: z.string(),
    evidenceCoverageRef: z.string(),
    trustedAsOf: z.string(),
    decisionConsequence: z.enum(['consequential', 'low_value']),
    controlRootKeys: z.array(z.string()),
    controls: z.record(g24ControlReferenceSchema),
    evidenceState: z.enum(['sufficient', 'gap', 'ambiguity', 'contradiction']),
    unresolvedEvidenceRefs: z.array(z.string()),
    expectedMaterialEffect: z.string(),
    trustedEvaluation: z.boolean(),
    challengerResult: z.enum([
      'countercase_found',
      'none_found_within_declared_boundary',
      'indeterminate',
    ]),
    challengerSearchBoundary: z.string().optional(),
    candidates: z.array(g24RouteCandidateSchema),
  })
  .strict()

export type G24SelectorReasonCode =
  | 'current_sufficient'
  | 'source_eligible'
  | 'one_human_fact_required'
  | 'tacit_interdependence'
  | 'insufficient_authority'
  | 'source_incapable'
  | 'unresolved_contradiction'
  | 'unknowable'
  | 'deadline'
  | 'budget'
  | 'no_material_effect'
  | 'invalid_input'

export interface G24SelectorAlternative {
  route: Exclude<G24SelectorRoute, 'abstain_hold'>
  eligible: boolean
  rejectionReasons: string[]
}

export interface G24SelectorResult {
  selectorResultVersion: string
  acceptedDecisionFrameRef: string
  decisionRequirementRef: string
  evidenceCoverageRef: string
  route: G24SelectorRoute
  reasonCode: G24SelectorReasonCode
  unresolvedGap: G24EvidenceState | null
  unresolvedEvidenceRefs: string[]
  expectedMaterialEffect: string
  alternatives: G24SelectorAlternative[]
  controlRootKeys: string[]
  controllingWatermarks: G24ControlWatermark[]
  controllingFingerprint: string
  selectorFingerprint: string
  expiry: string | null
  replanningTrigger: 'controlling_change_or_expiry'
  actionable: boolean
  provisionalDiagnostic?: string
}

export function fingerprintG24SelectorResult(
  result: Omit<G24SelectorResult, 'selectorFingerprint'> | G24SelectorResult,
): string {
  return JSON.stringify({
    selectorResultVersion: result.selectorResultVersion,
    acceptedDecisionFrameRef: result.acceptedDecisionFrameRef,
    decisionRequirementRef: result.decisionRequirementRef,
    evidenceCoverageRef: result.evidenceCoverageRef,
    route: result.route,
    reasonCode: result.reasonCode,
    unresolvedGap: result.unresolvedGap,
    unresolvedEvidenceRefs: [...result.unresolvedEvidenceRefs].sort(compareText),
    expectedMaterialEffect: result.expectedMaterialEffect,
    alternatives: [...result.alternatives]
      .sort((left, right) => ROUTE_ORDER.indexOf(left.route) - ROUTE_ORDER.indexOf(right.route))
      .map((alternative) => ({
        route: alternative.route,
        eligible: alternative.eligible,
        rejectionReasons: [...alternative.rejectionReasons].sort(compareText),
      })),
    controlRootKeys: [...result.controlRootKeys].sort(compareText),
    controllingWatermarks: [...result.controllingWatermarks].sort((left, right) =>
      compareText(left.key, right.key),
    ),
    controllingFingerprint: result.controllingFingerprint,
    expiry: result.expiry,
    replanningTrigger: result.replanningTrigger,
    actionable: result.actionable,
    provisionalDiagnostic: result.provisionalDiagnostic,
  })
}

function finalizeG24SelectorResult(
  result: Omit<G24SelectorResult, 'selectorFingerprint'> | G24SelectorResult,
): G24SelectorResult {
  return { ...result, selectorFingerprint: fingerprintG24SelectorResult(result) }
}

const RESOLVING_ROUTE_ORDER: G24ResolvingRoute[] = ['enrich', 'ask', 'session']
const ROUTE_ORDER: Array<Exclude<G24SelectorRoute, 'abstain_hold'>> = [
  'reuse',
  'enrich',
  'ask',
  'session',
]

function candidateEligibility(candidate: G24RouteCandidate): G24SelectorAlternative {
  const generatedReasons = [
    !candidate.permitted ? 'route_not_permitted' : '',
    !candidate.capable ? 'source_or_respondent_incapable' : '',
    !candidate.resolvesGap ? 'does_not_resolve_named_gap' : '',
    !candidate.withinDeadline ? 'outside_deadline' : '',
    !candidate.withinBudget ? 'outside_budget' : '',
    !candidate.fresh ? 'route_evidence_stale' : '',
    !candidate.audienceCompatible ? 'audience_incompatible' : '',
    !candidate.provenanceIndependent ? 'provenance_independence_unsatisfied' : '',
    !candidate.useSpecificSufficient ? 'use_specific_sufficiency_unsatisfied' : '',
    !candidate.counterevidenceTreated ? 'counterevidence_untreated' : '',
    candidate.route === 'reuse' &&
    candidate.reuseOrigin !== 'same_case' &&
    !(
      candidate.reuseOrigin === 'public_immutable' &&
      candidate.immutableReference &&
      !candidate.containsPrivateReasoning
    )
      ? 'private_cross_case_reuse_forbidden'
      : '',
    !Number.isFinite(candidate.burden) || candidate.burden < 0 ? 'invalid_burden' : '',
  ].filter(Boolean)
  const rejectionReasons = [...new Set([...candidate.rejectionReasons, ...generatedReasons])].sort(
    compareText,
  )
  return {
    route: candidate.route,
    eligible: rejectionReasons.length === 0,
    rejectionReasons,
  }
}

function earliestExpiry(
  watermarks: readonly G24ControlWatermark[],
  controls: G24ControlRegistry,
): string | null {
  const expiries = watermarks
    .map(({ key }) => controls[key]?.validUntil)
    .filter((value): value is string => Boolean(value))
    .sort(compareText)
  return expiries[0] ?? null
}

function heldSelectorResult(
  input: G24SelectorInput,
  closure: G24ControlClosure,
  reasonCode: G24SelectorReasonCode,
  diagnostic: string,
  alternatives: G24SelectorAlternative[],
): G24SelectorResult {
  return finalizeG24SelectorResult({
    selectorResultVersion: input.selectorResultVersion,
    acceptedDecisionFrameRef: input.acceptedDecisionFrameRef,
    decisionRequirementRef: input.decisionRequirementRef,
    evidenceCoverageRef: input.evidenceCoverageRef,
    route: 'abstain_hold',
    reasonCode,
    unresolvedGap: input.evidenceState === 'sufficient' ? null : input.evidenceState,
    unresolvedEvidenceRefs: [...input.unresolvedEvidenceRefs].sort(compareText),
    expectedMaterialEffect: input.expectedMaterialEffect,
    alternatives,
    controlRootKeys: closure.roots,
    controllingWatermarks: closure.watermarks,
    controllingFingerprint: fingerprintG24Watermarks(closure.watermarks),
    expiry: earliestExpiry(closure.watermarks, input.controls),
    replanningTrigger: 'controlling_change_or_expiry',
    actionable: false,
    provisionalDiagnostic: diagnostic,
  })
}

function malformedG24SelectorResult(inputValue: unknown, errors: string[]): G24SelectorResult {
  const candidate =
    typeof inputValue === 'object' && inputValue !== null
      ? (inputValue as Record<string, unknown>)
      : {}
  const textOr = (key: string, fallback: string) =>
    typeof candidate[key] === 'string' ? (candidate[key] as string) : fallback
  return finalizeG24SelectorResult({
    selectorResultVersion: textOr('selectorResultVersion', 'invalid-selector-envelope'),
    acceptedDecisionFrameRef: textOr('acceptedDecisionFrameRef', 'invalid-decision-frame'),
    decisionRequirementRef: textOr('decisionRequirementRef', 'invalid-decision-requirement'),
    evidenceCoverageRef: textOr('evidenceCoverageRef', 'invalid-evidence-coverage'),
    route: 'abstain_hold',
    reasonCode: 'invalid_input',
    unresolvedGap: null,
    unresolvedEvidenceRefs: [],
    expectedMaterialEffect: '',
    alternatives: [],
    controlRootKeys: [],
    controllingWatermarks: [],
    controllingFingerprint: '',
    expiry: null,
    replanningTrigger: 'controlling_change_or_expiry',
    actionable: false,
    provisionalDiagnostic: [...new Set(errors)].sort(compareText).join(','),
  })
}

export function selectG24Intervention(inputValue: unknown): G24SelectorResult {
  const parsed = G24_SELECTOR_INPUT_SCHEMA.safeParse(inputValue)
  if (!parsed.success) {
    return malformedG24SelectorResult(
      inputValue,
      parsed.error.issues.map(
        (issue) => `malformed:${issue.path.join('.') || 'root'}:${issue.code}`,
      ),
    )
  }
  const input = parsed.data as G24SelectorInput
  const closure = resolveG24ControlClosure(
    input.controlRootKeys,
    input.controls,
    input.trustedAsOf,
    true,
  )
  const alternatives = input.candidates
    .map(candidateEligibility)
    .sort((left, right) => ROUTE_ORDER.indexOf(left.route) - ROUTE_ORDER.indexOf(right.route))
  const candidateRoutes = input.candidates.map(({ route }) => route)
  const selectorEnvelopeErrors = [
    !input.selectorResultVersion.trim() ? 'selector_result_version_missing' : '',
    !input.acceptedDecisionFrameRef.trim() ? 'accepted_decision_frame_ref_missing' : '',
    !input.decisionRequirementRef.trim() ? 'decision_requirement_ref_missing' : '',
    !input.evidenceCoverageRef.trim() ? 'evidence_coverage_ref_missing' : '',
    new Set(candidateRoutes).size !== candidateRoutes.length ? 'duplicate_candidate_route' : '',
  ].filter(Boolean)

  if (
    closure.errors.length > 0 ||
    selectorEnvelopeErrors.length > 0 ||
    !input.trustedEvaluation ||
    input.challengerResult === 'indeterminate' ||
    (input.challengerResult === 'none_found_within_declared_boundary' &&
      !input.challengerSearchBoundary?.trim())
  ) {
    const diagnostic = [
      ...closure.errors,
      ...selectorEnvelopeErrors,
      !input.trustedEvaluation ? 'trusted_evaluation_missing' : '',
      input.challengerResult === 'indeterminate' ? 'challenger_indeterminate' : '',
      input.challengerResult === 'none_found_within_declared_boundary' &&
      !input.challengerSearchBoundary?.trim()
        ? 'challenger_boundary_missing'
        : '',
    ]
      .filter(Boolean)
      .sort(compareText)
      .join(',')
    return heldSelectorResult(input, closure, 'invalid_input', diagnostic, alternatives)
  }

  if (!input.expectedMaterialEffect.trim()) {
    return heldSelectorResult(
      input,
      closure,
      'no_material_effect',
      'no_decision_specific_material_effect',
      alternatives,
    )
  }

  if (input.decisionConsequence === 'low_value') {
    return heldSelectorResult(
      input,
      closure,
      'no_material_effect',
      'outside_consequential_decision_scope',
      alternatives,
    )
  }

  if (input.evidenceState === 'sufficient') {
    const reuse = input.candidates.find((candidate) => candidate.route === 'reuse')
    if (reuse && candidateEligibility(reuse).eligible) {
      return finalizeG24SelectorResult({
        ...heldSelectorResult(input, closure, 'current_sufficient', '', alternatives),
        route: 'reuse',
        reasonCode: 'current_sufficient',
        unresolvedGap: null,
        unresolvedEvidenceRefs: [],
        actionable: true,
        provisionalDiagnostic: undefined,
      })
    }
    return heldSelectorResult(
      input,
      closure,
      'source_incapable',
      'current_evidence_not_reusable_for_this_use',
      alternatives,
    )
  }

  if (input.unresolvedEvidenceRefs.length === 0) {
    return heldSelectorResult(
      input,
      closure,
      'invalid_input',
      'unresolved_evidence_refs_required',
      alternatives,
    )
  }

  const eligible = input.candidates
    .filter(
      (candidate): candidate is G24RouteCandidate & { route: G24ResolvingRoute } =>
        RESOLVING_ROUTE_ORDER.includes(candidate.route as G24ResolvingRoute) &&
        candidateEligibility(candidate).eligible,
    )
    .sort((left, right) => {
      if (left.burden !== right.burden) return left.burden - right.burden
      return RESOLVING_ROUTE_ORDER.indexOf(left.route) - RESOLVING_ROUTE_ORDER.indexOf(right.route)
    })

  const chosen = eligible[0]
  if (!chosen) {
    const reasonCode: G24SelectorReasonCode =
      input.evidenceState === 'contradiction' ? 'unresolved_contradiction' : 'unknowable'
    return heldSelectorResult(input, closure, reasonCode, 'no_eligible_resolving_route', alternatives)
  }

  const reasonByRoute: Record<G24ResolvingRoute, G24SelectorReasonCode> = {
    enrich: 'source_eligible',
    ask: 'one_human_fact_required',
    session: 'tacit_interdependence',
  }

  return finalizeG24SelectorResult({
    ...heldSelectorResult(input, closure, reasonByRoute[chosen.route], '', alternatives),
    route: chosen.route,
    reasonCode: reasonByRoute[chosen.route],
    actionable: true,
    provisionalDiagnostic: undefined,
  })
}

export interface G24QuestionPayload {
  kind: 'question'
  visibleWording: string
  renderedControlPayload: string
  answerGrammar: 'single_choice' | 'ranked_choice' | 'bounded_text' | 'voice_critical_incident'
  optionsOrComparator: string[]
  scopedWriteIn: boolean
  honestExits: Array<'unknown' | 'defer' | 'refuse' | 'premise_wrong'>
  materialEffectDisclosure: string
  visibleChangedConsequence: string
  visibleUnknownConsequence: string
  answerEffects: Record<
    string,
    {
      caseEffect: 'rebuild_required' | 'no_case_change'
      visibleConsequence: string
      retireInterventionRefs: string[]
      pendingHumanOwnedProposal: string | null
    }
  >
}

export interface G24SessionPayload {
  kind: 'session'
  exactAgenda: string[]
  leaderVisiblePurpose: string
  expectedEndState: string
  leaderCanDeclineRejectOrReframe: boolean
  noContactScheduleCaptureOrLearningAuthority: true
}

export interface G24InterventionAtom {
  atomVersion: string
  selectorResultVersion: string
  controlVersion: string
  purpose: string
  audience: string
  sensitivity: string
  channel: string
  timing: string
  decisionFrameVersion: string
  evidenceVersions: string[]
  payloadFingerprint: string
  approvalState: 'proposed' | 'approved' | 'edited' | 'held' | 'suppressed'
  payload: G24QuestionPayload | G24SessionPayload
}

export function fingerprintG24InterventionAtom(
  atom: Omit<G24InterventionAtom, 'payloadFingerprint' | 'approvalState'>,
): string {
  return JSON.stringify({
    atomVersion: atom.atomVersion,
    selectorResultVersion: atom.selectorResultVersion,
    controlVersion: atom.controlVersion,
    purpose: atom.purpose,
    audience: atom.audience,
    sensitivity: atom.sensitivity,
    channel: atom.channel,
    timing: atom.timing,
    decisionFrameVersion: atom.decisionFrameVersion,
    evidenceVersions: [...atom.evidenceVersions].sort(compareText),
    payload: atom.payload,
  })
}

export function createG24InterventionAtom(
  selector: G24SelectorResult,
  atom: Omit<
    G24InterventionAtom,
    'selectorResultVersion' | 'payloadFingerprint' | 'approvalState'
  >,
): G24InterventionAtom {
  if (selector.route !== 'ask' && selector.route !== 'session') {
    throw new Error('human_facing_atom_requires_ask_or_session_route')
  }
  if (selector.route === 'ask' && atom.payload.kind !== 'question') {
    throw new Error('ask_route_requires_question_payload')
  }
  if (selector.route === 'session' && atom.payload.kind !== 'session') {
    throw new Error('session_route_requires_session_payload')
  }
  if (
    !atom.atomVersion.trim() ||
    !atom.controlVersion.trim() ||
    !atom.purpose.trim() ||
    !atom.audience.trim() ||
    !atom.channel.trim() ||
    !atom.timing.trim() ||
    !atom.decisionFrameVersion.trim() ||
    atom.evidenceVersions.length === 0
  ) {
    throw new Error('intervention_atom_approval_binding_incomplete')
  }
  if (atom.payload.kind === 'question') {
    const exits = new Set(atom.payload.honestExits)
    for (const exit of ['unknown', 'defer', 'refuse', 'premise_wrong'] as const) {
      if (!exits.has(exit)) throw new Error(`honest_exit_required:${exit}`)
    }
    if (
      !atom.payload.visibleWording.trim() ||
      !atom.payload.renderedControlPayload.trim() ||
      !atom.payload.materialEffectDisclosure.trim() ||
      !atom.payload.visibleChangedConsequence.trim() ||
      !atom.payload.visibleUnknownConsequence.trim()
    ) {
      throw new Error('question_atom_required_field_missing')
    }
    const requiredEffectKeys = [
      ...atom.payload.honestExits,
      ...(atom.payload.answerGrammar === 'single_choice' ||
      atom.payload.answerGrammar === 'ranked_choice'
        ? atom.payload.optionsOrComparator
        : ['default']),
    ]
    for (const key of requiredEffectKeys) {
      const effect = atom.payload.answerEffects[key]
      if (!effect?.visibleConsequence.trim()) throw new Error(`answer_effect_required:${key}`)
    }
    for (const exit of atom.payload.honestExits) {
      const effect = atom.payload.answerEffects[exit]
      if (
        effect.caseEffect !== 'no_case_change' ||
        effect.pendingHumanOwnedProposal !== null ||
        effect.retireInterventionRefs.length > 0
      ) {
        throw new Error(`honest_exit_must_not_create_adverse_effect:${exit}`)
      }
    }
  }
  const withoutFingerprint = {
    ...structuredClone(atom),
    selectorResultVersion: selector.selectorResultVersion,
  }
  return {
    ...withoutFingerprint,
    payloadFingerprint: fingerprintG24InterventionAtom(withoutFingerprint),
    approvalState: 'proposed',
  }
}

export function validateG24InterventionAtom(atom: G24InterventionAtom): string[] {
  const { payloadFingerprint: _payloadFingerprint, approvalState: _approvalState, ...content } = atom
  const expected = fingerprintG24InterventionAtom(content)
  return expected === atom.payloadFingerprint ? [] : ['intervention_payload_changed_without_new_version']
}

export function approveG24InterventionAtom(
  atom: G24InterventionAtom,
  binding: {
    atomVersion: string
    controlVersion: string
    purpose: string
    audience: string
    channel: string
    timing: string
    decisionFrameVersion: string
    evidenceVersions: string[]
    payloadFingerprint: string
  },
): G24InterventionAtom {
  const bindingMatches =
    binding.atomVersion === atom.atomVersion &&
    binding.controlVersion === atom.controlVersion &&
    binding.purpose === atom.purpose &&
    binding.audience === atom.audience &&
    binding.channel === atom.channel &&
    binding.timing === atom.timing &&
    binding.decisionFrameVersion === atom.decisionFrameVersion &&
    equalSorted(binding.evidenceVersions, atom.evidenceVersions) &&
    binding.payloadFingerprint === atom.payloadFingerprint
  if (!bindingMatches || validateG24InterventionAtom(atom).length > 0) {
    throw new Error('intervention_approval_binding_mismatch')
  }
  return { ...structuredClone(atom), approvalState: 'approved' }
}

export type G24AnswerKind = 'option' | 'write_in' | 'voice' | 'unknown' | 'defer' | 'refuse' | 'premise_wrong'

export interface G24AnswerReceipt {
  receiptId: string
  atomVersion: string
  answerKind: G24AnswerKind
  value: string | null
  immutableCaseEvidence: true
  caseEffect: 'rebuild_required' | 'no_case_change'
  pendingHumanOwnedProposal: string | null
  retiredInterventionRefs: string[]
  visibleConsequence: string
  automaticReaskPressure: false
  automaticSessionEscalation: false
}

export function recordG24Answer(
  atom: G24InterventionAtom,
  answer: { receiptId: string; kind: G24AnswerKind; value?: string },
): G24AnswerReceipt {
  if (atom.payload.kind !== 'question') throw new Error('answer_requires_question_atom')
  const honestExit = ['unknown', 'defer', 'refuse', 'premise_wrong'].includes(answer.kind)
  if (honestExit && !atom.payload.honestExits.includes(answer.kind as never)) {
    throw new Error(`answer_exit_not_offered:${answer.kind}`)
  }
  if (!honestExit && !answer.value?.trim()) throw new Error('answer_value_required')
  const effectKey = honestExit
    ? answer.kind
    : atom.payload.answerGrammar === 'single_choice' || atom.payload.answerGrammar === 'ranked_choice'
      ? answer.value?.trim()
      : 'default'
  const effect = effectKey ? atom.payload.answerEffects[effectKey] : undefined
  if (!effect) throw new Error(`answer_effect_not_declared:${effectKey ?? 'missing'}`)
  return {
    receiptId: answer.receiptId,
    atomVersion: atom.atomVersion,
    answerKind: answer.kind,
    value: answer.value?.trim() || null,
    immutableCaseEvidence: true,
    caseEffect: effect.caseEffect,
    pendingHumanOwnedProposal: effect.pendingHumanOwnedProposal,
    retiredInterventionRefs: [...new Set(effect.retireInterventionRefs)].sort(compareText),
    visibleConsequence: effect.visibleConsequence,
    automaticReaskPressure: false,
    automaticSessionEscalation: false,
  }
}

export interface G24AnswerCorrectionReceipt {
  receiptId: string
  correctsAnswerReceiptId: string
  replacementAnswerReceiptId: string
  retiredDerivativeRefs: string[]
  affectedDecisionRefs: string[]
  rebuildRequired: true
}

export function correctG24Answer(
  original: G24AnswerReceipt,
  replacement: G24AnswerReceipt,
  details: {
    receiptId: string
    retiredDerivativeRefs: string[]
    affectedDecisionRefs: string[]
  },
): G24AnswerCorrectionReceipt {
  if (original.receiptId === replacement.receiptId) throw new Error('replacement_receipt_must_be_new')
  return {
    receiptId: details.receiptId,
    correctsAnswerReceiptId: original.receiptId,
    replacementAnswerReceiptId: replacement.receiptId,
    retiredDerivativeRefs: [...new Set(details.retiredDerivativeRefs)].sort(compareText),
    affectedDecisionRefs: [...new Set(details.affectedDecisionRefs)].sort(compareText),
    rebuildRequired: true,
  }
}

export interface G24PendingReleaseProjection {
  projectionVersion: string
  purpose: string
  audience: string
  selectorResultVersions: string[]
  selectorResultFingerprints: Record<string, string>
  selectorControlRoots: Record<string, string[]>
  selectorControllingWatermarks: Record<string, G24ControlWatermark[]>
  controllingWatermarks: G24ControlWatermark[]
  controllingFingerprint: string
  includedCanonicalSourceVersions: string[]
  includedCanonicalBrainVersions: string[]
}

export interface G24ReleaseCompileResult {
  projection: G24PendingReleaseProjection | null
  errors: string[]
}

function compareWatermarks(
  expected: readonly G24ControlWatermark[],
  current: readonly G24ControlWatermark[],
): string[] {
  const currentByKey = new Map(current.map((watermark) => [watermark.key, watermark]))
  const expectedByKey = new Map(expected.map((watermark) => [watermark.key, watermark]))
  const errors: string[] = []
  for (const [key, watermark] of expectedByKey) {
    const candidate = currentByKey.get(key)
    if (!candidate) errors.push(`watermark_missing:${key}`)
    else if (candidate.lineageId !== watermark.lineageId || candidate.version !== watermark.version) {
      errors.push(`watermark_changed:${key}`)
    }
  }
  for (const key of currentByKey.keys()) {
    if (!expectedByKey.has(key)) errors.push(`watermark_added:${key}`)
  }
  return errors.sort(compareText)
}

export function compileG24PendingRelease(input: {
  projectionVersion: string
  purpose: string
  audience: string
  selectorResults: G24SelectorResult[]
  controls: G24ControlRegistry
  trustedAsOf: string
  includedCanonicalSourceVersions: string[]
  includedCanonicalBrainVersions: string[]
}): G24ReleaseCompileResult {
  const errors: string[] = []
  const merged = new Map<string, G24ControlWatermark>()
  const selectorControlRoots: Record<string, string[]> = {}
  const selectorResultFingerprints: Record<string, string> = {}
  const selectorControllingWatermarks: Record<string, G24ControlWatermark[]> = {}
  const selectorVersions = input.selectorResults.map(({ selectorResultVersion }) =>
    selectorResultVersion.trim(),
  )
  if (new Set(selectorVersions).size !== selectorVersions.length) {
    errors.push('selector_result_versions_must_be_unique')
  }

  for (const selector of input.selectorResults) {
    const closure = resolveG24ControlClosure(
      selector.controlRootKeys,
      input.controls,
      input.trustedAsOf,
      true,
    )
    errors.push(...closure.errors.map((error) => `${selector.selectorResultVersion}:${error}`))
    errors.push(
      ...compareWatermarks(selector.controllingWatermarks, closure.watermarks).map(
        (error) => `${selector.selectorResultVersion}:${error}`,
      ),
    )
    if (fingerprintG24SelectorResult(selector) !== selector.selectorFingerprint) {
      errors.push(`${selector.selectorResultVersion}:selector_result_mutated_without_new_version`)
    }
    selectorControlRoots[selector.selectorResultVersion] = closure.roots
    selectorResultFingerprints[selector.selectorResultVersion] = selector.selectorFingerprint
    selectorControllingWatermarks[selector.selectorResultVersion] = closure.watermarks
    for (const watermark of closure.watermarks) {
      const existing = merged.get(watermark.key)
      if (
        existing &&
        (existing.version !== watermark.version || existing.lineageId !== watermark.lineageId)
      ) {
        errors.push(`selector_lineage_conflict:${watermark.key}`)
      } else {
        merged.set(watermark.key, watermark)
      }
    }
  }

  if (input.selectorResults.length === 0) errors.push('selector_result_required')
  if (!input.projectionVersion.trim()) errors.push('projection_version_required')
  if (!input.purpose.trim()) errors.push('purpose_required')
  if (!input.audience.trim()) errors.push('audience_required')
  const uniqueErrors = [...new Set(errors)].sort(compareText)
  if (uniqueErrors.length > 0) return { projection: null, errors: uniqueErrors }

  const controllingWatermarks = [...merged.values()].sort((left, right) =>
    compareText(left.key, right.key),
  )
  return {
    projection: {
      projectionVersion: input.projectionVersion,
      purpose: input.purpose,
      audience: input.audience,
      selectorResultVersions: input.selectorResults
        .map(({ selectorResultVersion }) => selectorResultVersion)
        .sort(compareText),
      selectorResultFingerprints: Object.fromEntries(
        Object.entries(selectorResultFingerprints).sort(([left], [right]) =>
          compareText(left, right),
        ),
      ),
      selectorControlRoots,
      selectorControllingWatermarks: Object.fromEntries(
        Object.entries(selectorControllingWatermarks).sort(([left], [right]) =>
          compareText(left, right),
        ),
      ),
      controllingWatermarks,
      controllingFingerprint: fingerprintG24Watermarks(controllingWatermarks),
      includedCanonicalSourceVersions: [...new Set(input.includedCanonicalSourceVersions)].sort(
        compareText,
      ),
      includedCanonicalBrainVersions: [...new Set(input.includedCanonicalBrainVersions)].sort(
        compareText,
      ),
    },
    errors: [],
  }
}

export interface G24ReleaseAuthority {
  authorityVersion: string
  actor: 'named_leader'
  projectionVersion: string
  purpose: string
  audience: string
  selectorResultVersions: string[]
  selectorResultFingerprints: Record<string, string>
  controllingFingerprint: string
  includedCanonicalSourceVersions: string[]
  includedCanonicalBrainVersions: string[]
}

export interface G24ReleaseInvalidationReceipt {
  receiptId: string
  projectionVersion: string
  changedControls: string[]
  appendOnly: true
  approvalCreated: false
  deliveryCreated: false
  externalSideEffectCreated: false
}

export interface G24ReleaseUseResult {
  eligible: boolean
  reason:
    | 'eligible'
    | 'controlling_state_invalid'
    | 'controlling_watermark_changed'
    | 'release_authority_missing_or_mismatched'
  receipt: G24ReleaseInvalidationReceipt | null
}

function equalSorted(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort(compareText).join('|') === [...right].sort(compareText).join('|')
}

function equalStringRecord(left: Record<string, string>, right: Record<string, string>): boolean {
  const normalize = (value: Record<string, string>) =>
    JSON.stringify(Object.entries(value).sort(([leftKey], [rightKey]) => compareText(leftKey, rightKey)))
  return normalize(left) === normalize(right)
}

export function evaluateG24PendingReleaseUse(input: {
  projection: G24PendingReleaseProjection
  authority?: G24ReleaseAuthority
  controls: G24ControlRegistry
  trustedAsOf: string
  receiptId: string
}): G24ReleaseUseResult {
  const currentMerged = new Map<string, G24ControlWatermark>()
  const stateErrors: string[] = []
  const selectorWatermarkErrors: string[] = []
  for (const [selectorVersion, roots] of Object.entries(input.projection.selectorControlRoots)) {
    const closure = resolveG24ControlClosure(roots, input.controls, input.trustedAsOf, true)
    stateErrors.push(...closure.errors.map((error) => `${selectorVersion}:${error}`))
    const recordedSelectorWatermarks =
      input.projection.selectorControllingWatermarks[selectorVersion] ?? []
    selectorWatermarkErrors.push(
      ...compareWatermarks(recordedSelectorWatermarks, closure.watermarks).map(
        (error) => `${selectorVersion}:${error}`,
      ),
    )
    for (const watermark of closure.watermarks) currentMerged.set(watermark.key, watermark)
  }
  const current = [...currentMerged.values()].sort((left, right) => compareText(left.key, right.key))
  const watermarkErrors = compareWatermarks(input.projection.controllingWatermarks, current)
  const changedControls = [
    ...new Set([...stateErrors, ...selectorWatermarkErrors, ...watermarkErrors]),
  ].sort(compareText)

  if (changedControls.length > 0) {
    return {
      eligible: false,
      reason: stateErrors.length > 0 ? 'controlling_state_invalid' : 'controlling_watermark_changed',
      receipt: {
        receiptId: input.receiptId,
        projectionVersion: input.projection.projectionVersion,
        changedControls,
        appendOnly: true,
        approvalCreated: false,
        deliveryCreated: false,
        externalSideEffectCreated: false,
      },
    }
  }

  const authority = input.authority
  const authorityMatches =
    authority?.actor === 'named_leader' &&
    authority.projectionVersion === input.projection.projectionVersion &&
    authority.purpose === input.projection.purpose &&
    authority.audience === input.projection.audience &&
    authority.controllingFingerprint === input.projection.controllingFingerprint &&
    equalSorted(authority.selectorResultVersions, input.projection.selectorResultVersions) &&
    equalStringRecord(
      authority.selectorResultFingerprints,
      input.projection.selectorResultFingerprints,
    ) &&
    equalSorted(
      authority.includedCanonicalSourceVersions,
      input.projection.includedCanonicalSourceVersions,
    ) &&
    equalSorted(
      authority.includedCanonicalBrainVersions,
      input.projection.includedCanonicalBrainVersions,
    )

  return {
    eligible: Boolean(authorityMatches),
    reason: authorityMatches ? 'eligible' : 'release_authority_missing_or_mismatched',
    receipt: null,
  }
}

export const G24_ENGAGEMENT_STATES = [
  'preparing',
  'intensive_proof',
  'continuing',
  'paused',
  'closing',
  'closed',
] as const

export type G24EngagementState = (typeof G24_ENGAGEMENT_STATES)[number]
export type G24EngagementStateOrNone = G24EngagementState | 'none'

export const G24_LIFECYCLE_TRANSITIONS = [
  ['open_preparation', 'none', 'preparing'],
  ['accept_intensive_proof', 'preparing', 'intensive_proof'],
  ['close_preparation', 'preparing', 'closed'],
  ['continue_after_intensive_proof', 'intensive_proof', 'continuing'],
  ['renew_continuing_period', 'continuing', 'continuing'],
  ['pause_intensive_proof', 'intensive_proof', 'paused'],
  ['pause_continuing', 'continuing', 'paused'],
  ['resume_continuing', 'paused', 'continuing'],
  ['close_intensive_proof', 'intensive_proof', 'closing'],
  ['close_continuing', 'continuing', 'closing'],
  ['close_paused', 'paused', 'closing'],
  ['complete_close', 'closing', 'closed'],
  ['open_new_preparation_after_close', 'closed', 'preparing'],
] as const

export type G24LifecycleTransitionId = (typeof G24_LIFECYCLE_TRANSITIONS)[number][0]

export interface G24LifecycleReceipt {
  receiptId: string
  transitionId: G24LifecycleTransitionId
  idempotencyKey: string
  beforeState: G24EngagementStateOrNone
  beforeVersion: string | null
  afterState: G24EngagementState
  afterVersion: string
  invalidation: string
}

export interface G24LifecycleSnapshot {
  state: G24EngagementStateOrNone
  version: string | null
  receipts: G24LifecycleReceipt[]
}

const LIFECYCLE_INVALIDATION: Record<G24LifecycleTransitionId, string> = {
  open_preparation: 'none',
  accept_intensive_proof: 'superseded_preparation_projections',
  close_preparation: 'all_prepared_and_unsent_derivatives',
  continue_after_intensive_proof: 'superseded_period_projections',
  renew_continuing_period: 'superseded_period_projections',
  pause_intensive_proof: 'all_unsent_interventions',
  pause_continuing: 'all_unsent_interventions',
  resume_continuing: 'all_stale_paused_projections',
  close_intensive_proof: 'new_decision_shaping_work_and_unsent_interventions',
  close_continuing: 'new_decision_shaping_work_and_unsent_interventions',
  close_paused: 'new_decision_shaping_work_and_unsent_interventions',
  complete_close: 'all_prepared_and_unsent_derivatives',
  open_new_preparation_after_close: 'none',
}

export function applyG24LifecycleTransition(
  snapshot: G24LifecycleSnapshot,
  request: {
    transitionId: G24LifecycleTransitionId
    fromVersion: string | null
    afterVersion: string
    actorAndAuthoritySatisfied: boolean
    preconditionSatisfied: boolean
    idempotencyKey: string
    receiptId: string
  },
): { accepted: boolean; reason: string; snapshot: G24LifecycleSnapshot } {
  const prior = snapshot.receipts.find((receipt) => receipt.idempotencyKey === request.idempotencyKey)
  if (prior) {
    const sameRequest =
      prior.transitionId === request.transitionId &&
      prior.beforeVersion === request.fromVersion &&
      prior.afterVersion === request.afterVersion &&
      prior.receiptId === request.receiptId
    if (!sameRequest) {
      return {
        accepted: false,
        reason: 'idempotency_key_collision',
        snapshot: structuredClone(snapshot),
      }
    }
    return {
      accepted: true,
      reason: 'idempotent_replay',
      snapshot: structuredClone(snapshot),
    }
  }
  const definition = G24_LIFECYCLE_TRANSITIONS.find(([id]) => id === request.transitionId)
  if (!definition) return { accepted: false, reason: 'transition_unknown', snapshot: structuredClone(snapshot) }
  const [, from, to] = definition
  if (snapshot.state !== from) {
    return { accepted: false, reason: 'transition_edge_not_allowed', snapshot: structuredClone(snapshot) }
  }
  if (from === 'none') {
    if (request.fromVersion !== null || snapshot.version !== null) {
      return { accepted: false, reason: 'from_version_must_be_none', snapshot: structuredClone(snapshot) }
    }
  } else if (request.fromVersion !== snapshot.version) {
    return { accepted: false, reason: 'from_version_mismatch', snapshot: structuredClone(snapshot) }
  }
  if (!request.actorAndAuthoritySatisfied) {
    return { accepted: false, reason: 'actor_or_authority_invalid', snapshot: structuredClone(snapshot) }
  }
  if (!request.preconditionSatisfied) {
    return { accepted: false, reason: 'precondition_unsatisfied', snapshot: structuredClone(snapshot) }
  }
  if (!request.afterVersion.trim() || !request.idempotencyKey.trim() || !request.receiptId.trim()) {
    return { accepted: false, reason: 'transition_envelope_incomplete', snapshot: structuredClone(snapshot) }
  }
  const receipt: G24LifecycleReceipt = {
    receiptId: request.receiptId,
    transitionId: request.transitionId,
    idempotencyKey: request.idempotencyKey,
    beforeState: snapshot.state,
    beforeVersion: snapshot.version,
    afterState: to,
    afterVersion: request.afterVersion,
    invalidation: LIFECYCLE_INVALIDATION[request.transitionId],
  }
  return {
    accepted: true,
    reason: 'transition_accepted',
    snapshot: { state: to, version: request.afterVersion, receipts: [...snapshot.receipts, receipt] },
  }
}

export function renderG24SelectorReceipt(result: G24SelectorResult): string {
  const gap = result.unresolvedGap ?? 'none'
  const refs = result.unresolvedEvidenceRefs.length
    ? result.unresolvedEvidenceRefs.join(', ')
    : 'none'
  return [
    `Route: ${result.route}`,
    `Why: ${result.reasonCode}`,
    `Known gap: ${gap}`,
    `Evidence carried forward: ${refs}`,
    `What this could change: ${result.expectedMaterialEffect || 'No material effect established'}`,
    `Standing: ${result.actionable ? 'eligible for the next governed step' : 'held with no action'}`,
  ].join('\n')
}

export interface G24EnrichmentExecutionPlan {
  planVersion: string
  selectorResultVersion: string
  selectorFingerprint: string
  maximumWallClockMs: number
  maximumAttempts: number
}

export type G24ExecutionStatus =
  | 'proposed_evidence'
  | 'failed_held'
  | 'slow_held'
  | 'stale_rejected'
  | 'attempt_budget_held'

export interface G24ExecutionReceipt {
  receiptId: string
  idempotencyKey: string
  planVersion: string
  attemptNumber: number
  status: G24ExecutionStatus
  sourceRef: string | null
  appendOnly: true
  standingAwarded: false
  canonicalEvidenceCreated: false
  brainChanged: false
  approvalCreated: false
  deliveryCreated: false
}

export function createG24EnrichmentExecutionPlan(
  selector: G24SelectorResult,
  input: { planVersion: string; maximumWallClockMs: number; maximumAttempts: number },
): G24EnrichmentExecutionPlan {
  if (selector.route !== 'enrich' || !selector.actionable) {
    throw new Error('enrichment_plan_requires_actionable_enrich_route')
  }
  if (
    !input.planVersion.trim() ||
    !Number.isFinite(input.maximumWallClockMs) ||
    input.maximumWallClockMs <= 0 ||
    !Number.isInteger(input.maximumAttempts) ||
    input.maximumAttempts <= 0
  ) {
    throw new Error('enrichment_plan_budget_invalid')
  }
  return {
    planVersion: input.planVersion,
    selectorResultVersion: selector.selectorResultVersion,
    selectorFingerprint: selector.selectorFingerprint,
    maximumWallClockMs: input.maximumWallClockMs,
    maximumAttempts: input.maximumAttempts,
  }
}

export function recordG24EnrichmentAttempt(input: {
  plan: G24EnrichmentExecutionPlan
  currentSelector: G24SelectorResult
  priorReceipts: G24ExecutionReceipt[]
  attempt: {
    receiptId: string
    idempotencyKey: string
    elapsedMs: number
    outcome: 'succeeded' | 'failed'
    sourceRef?: string
  }
}): { receipt: G24ExecutionReceipt; receipts: G24ExecutionReceipt[]; replayed: boolean } {
  const prior = input.priorReceipts.find(
    ({ idempotencyKey }) => idempotencyKey === input.attempt.idempotencyKey,
  )
  if (prior) {
    const sameAttempt =
      prior.receiptId === input.attempt.receiptId && prior.planVersion === input.plan.planVersion
    if (!sameAttempt) throw new Error('execution_idempotency_key_collision')
    return { receipt: structuredClone(prior), receipts: structuredClone(input.priorReceipts), replayed: true }
  }

  const attemptNumber = input.priorReceipts.length + 1
  let status: G24ExecutionStatus
  if (
    input.currentSelector.selectorResultVersion !== input.plan.selectorResultVersion ||
    input.currentSelector.selectorFingerprint !== input.plan.selectorFingerprint ||
    fingerprintG24SelectorResult(input.currentSelector) !== input.currentSelector.selectorFingerprint
  ) {
    status = 'stale_rejected'
  } else if (attemptNumber > input.plan.maximumAttempts) {
    status = 'attempt_budget_held'
  } else if (!Number.isFinite(input.attempt.elapsedMs) || input.attempt.elapsedMs > input.plan.maximumWallClockMs) {
    status = 'slow_held'
  } else if (input.attempt.outcome === 'failed' || !input.attempt.sourceRef?.trim()) {
    status = 'failed_held'
  } else {
    status = 'proposed_evidence'
  }

  const receipt: G24ExecutionReceipt = {
    receiptId: input.attempt.receiptId,
    idempotencyKey: input.attempt.idempotencyKey,
    planVersion: input.plan.planVersion,
    attemptNumber,
    status,
    sourceRef:
      status === 'proposed_evidence' && input.attempt.sourceRef?.trim()
        ? input.attempt.sourceRef.trim()
        : null,
    appendOnly: true,
    standingAwarded: false,
    canonicalEvidenceCreated: false,
    brainChanged: false,
    approvalCreated: false,
    deliveryCreated: false,
  }
  return {
    receipt,
    receipts: [...structuredClone(input.priorReceipts), receipt],
    replayed: false,
  }
}

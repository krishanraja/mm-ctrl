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

export interface G24ControlManifest {
  manifestVersion: string
  applicableControlKeys: string[]
  graphFingerprint: string
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

type G24PlainSnapshot<T> = { ok: true; value: T } | { ok: false }

function snapshotG24PlainData<T>(value: T): G24PlainSnapshot<T> {
  const active = new WeakSet<object>()
  const copy = (current: unknown): G24PlainSnapshot<unknown> => {
    try {
      if (current === null || typeof current === 'string' || typeof current === 'boolean') {
        return { ok: true, value: current }
      }
      if (typeof current === 'number') {
        return Number.isFinite(current) ? { ok: true, value: current } : { ok: false }
      }
      if (typeof current !== 'object' || active.has(current)) return { ok: false }
      active.add(current)
      if (Object.getOwnPropertySymbols(current).length > 0) return { ok: false }

      if (Array.isArray(current)) {
        if (Object.getPrototypeOf(current) !== Array.prototype) return { ok: false }
        const names = Object.getOwnPropertyNames(current)
        const expectedNames = [
          ...Array.from({ length: current.length }, (_, index) => String(index)),
          'length',
        ]
        if (
          names.length !== expectedNames.length ||
          names.some((name) => !expectedNames.includes(name))
        ) {
          return { ok: false }
        }
        const result: unknown[] = []
        for (let index = 0; index < current.length; index += 1) {
          const descriptor = Object.getOwnPropertyDescriptor(current, String(index))
          if (
            !descriptor ||
            !descriptor.enumerable ||
            !Object.prototype.hasOwnProperty.call(descriptor, 'value')
          ) {
            return { ok: false }
          }
          const child = copy(descriptor.value)
          if (!child.ok) return child
          result.push(child.value)
        }
        return { ok: true, value: result }
      }

      const prototype = Object.getPrototypeOf(current)
      if (prototype !== Object.prototype && prototype !== null) return { ok: false }
      const result = Object.create(null) as Record<string, unknown>
      for (const name of Object.getOwnPropertyNames(current).sort(compareText)) {
        const descriptor = Object.getOwnPropertyDescriptor(current, name)
        if (
          !descriptor ||
          !descriptor.enumerable ||
          !Object.prototype.hasOwnProperty.call(descriptor, 'value')
        ) {
          return { ok: false }
        }
        const child = copy(descriptor.value)
        if (!child.ok) return child
        Object.defineProperty(result, name, {
          value: child.value,
          enumerable: true,
          configurable: true,
          writable: true,
        })
      }
      return { ok: true, value: result }
    } catch {
      return { ok: false }
    } finally {
      if (typeof current === 'object' && current !== null) active.delete(current)
    }
  }
  return copy(value) as G24PlainSnapshot<T>
}

function stringifyG24Data(value: unknown): string {
  const snapshot = snapshotG24PlainData(value)
  return snapshot.ok ? JSON.stringify(snapshot.value) : '__g24_invalid_nonplain_data__'
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
  applicableControlKeys: readonly string[] = [],
): G24ControlClosure {
  const inputSnapshot = snapshotG24PlainData({
    roots,
    controls,
    trustedAsOf,
    requireMinimum,
    applicableControlKeys,
  })
  if (!inputSnapshot.ok) {
    return { roots: [], watermarks: [], errors: ['control_closure_requires_plain_data'] }
  }
  roots = inputSnapshot.value.roots
  controls = inputSnapshot.value.controls
  trustedAsOf = inputSnapshot.value.trustedAsOf
  requireMinimum = inputSnapshot.value.requireMinimum
  applicableControlKeys = inputSnapshot.value.applicableControlKeys
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

    const control = Object.prototype.hasOwnProperty.call(controls, key) ? controls[key] : undefined
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

  for (const applicableKey of [...new Set(applicableControlKeys)].sort(compareText)) {
    if (!visited.has(applicableKey)) errors.push(`under_recorded_applicable_control:${applicableKey}`)
  }
  if (applicableControlKeys.length > 0) {
    const applicableSet = new Set(applicableControlKeys)
    for (const visitedKey of visited) {
      if (!applicableSet.has(visitedKey)) errors.push(`control_not_manifested:${visitedKey}`)
    }
  }

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

export function fingerprintG24ControlGraph(
  applicableControlKeys: readonly string[],
  controls: G24ControlRegistry,
): string {
  const inputSnapshot = snapshotG24PlainData({ applicableControlKeys, controls })
  if (!inputSnapshot.ok) return '__g24_invalid_nonplain_data__'
  applicableControlKeys = inputSnapshot.value.applicableControlKeys
  controls = inputSnapshot.value.controls
  return stringifyG24Data(
    [...new Set(applicableControlKeys)].sort(compareText).map((key) => {
      const control = Object.prototype.hasOwnProperty.call(controls, key) ? controls[key] : undefined
      return control
        ? {
            key,
            lineageId: control.lineageId,
            version: control.version,
            state: control.state,
            dependencies: [...control.dependencies].sort(compareText),
            validFrom: control.validFrom ?? null,
            validUntil: control.validUntil ?? null,
          }
        : { key, missing: true }
    }),
  )
}

export function fingerprintG24Watermarks(watermarks: readonly G24ControlWatermark[]): string {
  const snapshot = snapshotG24PlainData(watermarks)
  if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
  watermarks = snapshot.value
  return stringifyG24Data(
    [...watermarks]
      .sort((left, right) => compareText(left.key, right.key))
      .map(({ key, lineageId, version }) => ({ key, lineageId, version })),
  )
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
  originCaseRef: string
  reuseEvidenceNamespace: string
  reuseEvidenceRef: string
  publicSourceRef: string | null
  immutableContentVersion: string | null
  immutableReference: boolean
  containsPrivateReasoning: boolean
  trustedEvaluationVersion: string
  burden: number
  rejectionReasons: string[]
}

export interface G24TrustedEvaluationBinding {
  evaluationVersion: string
  decisionRequirementVersion: string
  evidenceCoverageVersion: string
  trustedCutoffVersion: string
  epistemicPolicyVersion: string
  independentChallengerResultVersion: string
  challengerResult: G24ChallengerResult
  challengerSearchBoundary: string | null
  controlManifestVersion: string
  controlGraphFingerprint: string
  trustedAsOf: string
}

export interface G24SelectorInput {
  selectorResultVersion: string
  currentCaseRef: string
  evidenceNamespace: string
  evidenceNamespaceCaseRef: string
  purposeRef: string
  audienceRef: string
  sensitivityRef: string
  acceptedDecisionFrameRef: string
  decisionRequirementRef: string
  evidenceCoverageRef: string
  trustedAsOf: string
  decisionConsequence: 'consequential' | 'low_value'
  controlRootKeys: string[]
  controlManifest: G24ControlManifest
  controls: G24ControlRegistry
  evidenceState: G24EvidenceState
  unresolvedEvidenceRefs: string[]
  expectedMaterialEffect: string
  trustedEvaluation: G24TrustedEvaluationBinding
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
    originCaseRef: z.string(),
    reuseEvidenceNamespace: z.string(),
    reuseEvidenceRef: z.string(),
    publicSourceRef: z.string().nullable(),
    immutableContentVersion: z.string().nullable(),
    immutableReference: z.boolean(),
    containsPrivateReasoning: z.boolean(),
    trustedEvaluationVersion: z.string(),
    burden: z.number(),
    rejectionReasons: z.array(z.string()),
  })
  .strict()

export const G24_SELECTOR_INPUT_SCHEMA = z
  .object({
    selectorResultVersion: z.string(),
    currentCaseRef: z.string(),
    evidenceNamespace: z.string(),
    evidenceNamespaceCaseRef: z.string(),
    purposeRef: z.string(),
    audienceRef: z.string(),
    sensitivityRef: z.string(),
    acceptedDecisionFrameRef: z.string(),
    decisionRequirementRef: z.string(),
    evidenceCoverageRef: z.string(),
    trustedAsOf: z.string(),
    decisionConsequence: z.enum(['consequential', 'low_value']),
    controlRootKeys: z.array(z.string()),
    controlManifest: z
      .object({
        manifestVersion: z.string(),
        applicableControlKeys: z.array(z.string()),
        graphFingerprint: z.string(),
      })
      .strict(),
    controls: z.record(g24ControlReferenceSchema),
    evidenceState: z.enum(['sufficient', 'gap', 'ambiguity', 'contradiction']),
    unresolvedEvidenceRefs: z.array(z.string()),
    expectedMaterialEffect: z.string(),
    trustedEvaluation: z
      .object({
        evaluationVersion: z.string(),
        decisionRequirementVersion: z.string(),
        evidenceCoverageVersion: z.string(),
        trustedCutoffVersion: z.string(),
        epistemicPolicyVersion: z.string(),
        independentChallengerResultVersion: z.string(),
        challengerResult: z.enum([
          'countercase_found',
          'none_found_within_declared_boundary',
          'indeterminate',
        ]),
        challengerSearchBoundary: z.string().nullable(),
        controlManifestVersion: z.string(),
        controlGraphFingerprint: z.string(),
        trustedAsOf: z.string(),
      })
      .strict(),
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
  currentCaseRef: string
  evidenceNamespace: string
  evidenceNamespaceCaseRef: string
  purposeRef: string
  audienceRef: string
  sensitivityRef: string
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
  controlManifestVersion: string
  applicableControlKeys: string[]
  controlGraphFingerprint: string
  trustedEvaluation: G24TrustedEvaluationBinding
  challengerResult: G24ChallengerResult
  challengerSearchBoundary: string | null
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
  const snapshot = snapshotG24PlainData(result)
  if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
  result = snapshot.value
  return stringifyG24Data({
    selectorResultVersion: result.selectorResultVersion,
    currentCaseRef: result.currentCaseRef,
    evidenceNamespace: result.evidenceNamespace,
    evidenceNamespaceCaseRef: result.evidenceNamespaceCaseRef,
    purposeRef: result.purposeRef,
    audienceRef: result.audienceRef,
    sensitivityRef: result.sensitivityRef,
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
    controlManifestVersion: result.controlManifestVersion,
    applicableControlKeys: [...result.applicableControlKeys].sort(compareText),
    controlGraphFingerprint: result.controlGraphFingerprint,
    trustedEvaluation: result.trustedEvaluation,
    challengerResult: result.challengerResult,
    challengerSearchBoundary: result.challengerSearchBoundary,
    controllingWatermarks: [...result.controllingWatermarks].sort((left, right) =>
      compareText(left.key, right.key),
    ),
    controllingFingerprint: result.controllingFingerprint,
    expiry: result.expiry,
    replanningTrigger: result.replanningTrigger,
    actionable: result.actionable,
    ...(typeof result.provisionalDiagnostic === 'string'
      ? { provisionalDiagnostic: result.provisionalDiagnostic }
      : {}),
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

function candidateEligibility(
  candidate: G24RouteCandidate,
  currentCaseRef: string,
  currentEvidenceNamespace: string,
): G24SelectorAlternative {
  const sameCaseReuse =
    candidate.reuseOrigin === 'same_case' &&
    candidate.originCaseRef === currentCaseRef &&
    candidate.reuseEvidenceNamespace === currentEvidenceNamespace
  const publicImmutableReuse =
    candidate.reuseOrigin === 'public_immutable' &&
    candidate.originCaseRef !== currentCaseRef &&
    candidate.reuseEvidenceNamespace === 'public' &&
    Boolean(candidate.reuseEvidenceRef.trim()) &&
    Boolean(candidate.publicSourceRef?.trim()) &&
    Boolean(candidate.immutableContentVersion?.trim()) &&
    candidate.immutableReference &&
    !candidate.containsPrivateReasoning
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
    candidate.route === 'reuse' && !(sameCaseReuse || publicImmutableReuse)
      ? 'private_cross_case_reuse_forbidden'
      : '',
    candidate.route === 'reuse' && !candidate.reuseEvidenceRef.trim()
      ? 'reuse_evidence_reference_missing'
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
    currentCaseRef: input.currentCaseRef,
    evidenceNamespace: input.evidenceNamespace,
    evidenceNamespaceCaseRef: input.evidenceNamespaceCaseRef,
    purposeRef: input.purposeRef,
    audienceRef: input.audienceRef,
    sensitivityRef: input.sensitivityRef,
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
    controlManifestVersion: input.controlManifest.manifestVersion,
    applicableControlKeys: [...input.controlManifest.applicableControlKeys].sort(compareText),
    controlGraphFingerprint: input.controlManifest.graphFingerprint,
    trustedEvaluation: structuredClone(input.trustedEvaluation),
    challengerResult: input.challengerResult,
    challengerSearchBoundary: input.challengerSearchBoundary ?? null,
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
    currentCaseRef: textOr('currentCaseRef', 'invalid-case'),
    evidenceNamespace: textOr('evidenceNamespace', 'invalid-evidence-namespace'),
    evidenceNamespaceCaseRef: textOr('evidenceNamespaceCaseRef', 'invalid-case'),
    purposeRef: textOr('purposeRef', 'invalid-purpose'),
    audienceRef: textOr('audienceRef', 'invalid-audience'),
    sensitivityRef: textOr('sensitivityRef', 'invalid-sensitivity'),
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
    controlManifestVersion: '',
    applicableControlKeys: [],
    controlGraphFingerprint: '',
    trustedEvaluation: {
      evaluationVersion: '',
      decisionRequirementVersion: '',
      evidenceCoverageVersion: '',
      trustedCutoffVersion: '',
      epistemicPolicyVersion: '',
      independentChallengerResultVersion: '',
      challengerResult: 'indeterminate',
      challengerSearchBoundary: null,
      controlManifestVersion: '',
      controlGraphFingerprint: '',
      trustedAsOf: '',
    },
    challengerResult: 'indeterminate',
    challengerSearchBoundary: null,
    controllingWatermarks: [],
    controllingFingerprint: '',
    expiry: null,
    replanningTrigger: 'controlling_change_or_expiry',
    actionable: false,
    provisionalDiagnostic: [...new Set(errors)].sort(compareText).join(','),
  })
}

export function selectG24Intervention(inputValue: unknown): G24SelectorResult {
  const inputSnapshot = snapshotG24PlainData(inputValue)
  if (!inputSnapshot.ok) {
    return malformedG24SelectorResult({}, ['malformed:root:nonplain_data'])
  }
  const parsed = G24_SELECTOR_INPUT_SCHEMA.safeParse(inputSnapshot.value)
  if (!parsed.success) {
    return malformedG24SelectorResult(
      inputValue,
      parsed.error.issues.map(
        (issue) => `malformed:${issue.path.join('.') || 'root'}:${issue.code}`,
      ),
    )
  }
  const input = parsed.data as G24SelectorInput
  const currentControlGraphFingerprint = fingerprintG24ControlGraph(
    input.controlManifest.applicableControlKeys,
    input.controls,
  )
  const closure = resolveG24ControlClosure(
    input.controlRootKeys,
    input.controls,
    input.trustedAsOf,
    true,
    input.controlManifest.applicableControlKeys,
  )
  const alternatives = input.candidates
    .map((candidate) =>
      candidateEligibility(candidate, input.currentCaseRef, input.evidenceNamespace),
    )
    .sort((left, right) => ROUTE_ORDER.indexOf(left.route) - ROUTE_ORDER.indexOf(right.route))
  const candidateRoutes = input.candidates.map(({ route }) => route)
  const selectorEnvelopeErrors = [
    !input.selectorResultVersion.trim() ? 'selector_result_version_missing' : '',
    !input.currentCaseRef.trim() ? 'current_case_ref_missing' : '',
    !input.evidenceNamespace.trim() ? 'evidence_namespace_missing' : '',
    input.evidenceNamespaceCaseRef !== input.currentCaseRef
      ? 'evidence_namespace_case_mismatch'
      : '',
    !input.purposeRef.trim() ? 'purpose_ref_missing' : '',
    !input.audienceRef.trim() ? 'audience_ref_missing' : '',
    !input.sensitivityRef.trim() ? 'sensitivity_ref_missing' : '',
    !input.acceptedDecisionFrameRef.trim() ? 'accepted_decision_frame_ref_missing' : '',
    !input.decisionRequirementRef.trim() ? 'decision_requirement_ref_missing' : '',
    !input.evidenceCoverageRef.trim() ? 'evidence_coverage_ref_missing' : '',
    !input.controlManifest.manifestVersion.trim() ? 'control_manifest_version_missing' : '',
    input.controlManifest.applicableControlKeys.length === 0
      ? 'applicable_control_manifest_empty'
      : '',
    input.controlManifest.graphFingerprint !== currentControlGraphFingerprint
      ? 'control_manifest_graph_mismatch'
      : '',
    input.trustedEvaluation.controlManifestVersion !== input.controlManifest.manifestVersion
      ? 'trusted_evaluation_control_manifest_version_mismatch'
      : '',
    input.trustedEvaluation.controlGraphFingerprint !== input.controlManifest.graphFingerprint
      ? 'trusted_evaluation_control_graph_mismatch'
      : '',
    new Set(candidateRoutes).size !== candidateRoutes.length ? 'duplicate_candidate_route' : '',
    !input.trustedEvaluation.evaluationVersion.trim() ? 'trusted_evaluation_version_missing' : '',
    input.trustedEvaluation.decisionRequirementVersion !==
    input.controls.decision_requirement_version?.version
      ? 'trusted_evaluation_decision_requirement_mismatch'
      : '',
    input.trustedEvaluation.evidenceCoverageVersion !== input.controls.evidence_coverage_version?.version
      ? 'trusted_evaluation_evidence_coverage_mismatch'
      : '',
    input.trustedEvaluation.trustedCutoffVersion !== input.controls.trusted_cutoff?.version
      ? 'trusted_evaluation_cutoff_mismatch'
      : '',
    input.trustedEvaluation.epistemicPolicyVersion !== input.controls.epistemic_policy_version?.version
      ? 'trusted_evaluation_policy_mismatch'
      : '',
    input.trustedEvaluation.independentChallengerResultVersion !==
    input.controls.independent_challenger_result_version?.version
      ? 'trusted_evaluation_challenger_mismatch'
      : '',
    input.trustedEvaluation.challengerResult !== input.challengerResult
      ? 'trusted_evaluation_challenger_outcome_mismatch'
      : '',
    input.trustedEvaluation.challengerSearchBoundary !==
    (input.challengerSearchBoundary ?? null)
      ? 'trusted_evaluation_challenger_boundary_mismatch'
      : '',
    input.trustedEvaluation.trustedAsOf !== input.trustedAsOf
      ? 'trusted_evaluation_as_of_mismatch'
      : '',
    input.candidates.some(
      ({ trustedEvaluationVersion }) =>
        trustedEvaluationVersion !== input.trustedEvaluation.evaluationVersion,
    )
      ? 'candidate_trusted_evaluation_mismatch'
      : '',
  ].filter(Boolean)

  if (
    closure.errors.length > 0 ||
    selectorEnvelopeErrors.length > 0 ||
    input.challengerResult === 'indeterminate' ||
    (input.challengerResult === 'none_found_within_declared_boundary' &&
      !input.challengerSearchBoundary?.trim())
  ) {
    const diagnostic = [
      ...closure.errors,
      ...selectorEnvelopeErrors,
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
    if (
      reuse &&
      candidateEligibility(reuse, input.currentCaseRef, input.evidenceNamespace).eligible
    ) {
      return finalizeG24SelectorResult({
        ...heldSelectorResult(input, closure, 'current_sufficient', '', alternatives),
        route: 'reuse',
        reasonCode: 'current_sufficient',
        unresolvedGap: null,
        unresolvedEvidenceRefs: [],
        actionable: true,
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
        candidateEligibility(candidate, input.currentCaseRef, input.evidenceNamespace).eligible,
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

const G24_ANSWER_GRAMMARS = [
  'single_choice',
  'ranked_choice',
  'bounded_text',
  'voice_critical_incident',
] as const

const G24_HONEST_EXITS = ['unknown', 'defer', 'refuse', 'premise_wrong'] as const

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
  selectorFingerprint: string
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
  approvalReceipt: G24InterventionApprovalReceipt | null
  payload: G24QuestionPayload | G24SessionPayload
}

export interface G24InterventionApprovalReceipt {
  receiptId: string
  atomVersion: string
  selectorResultVersion: string
  selectorFingerprint: string
  payloadFingerprint: string
  approvedByRef: 'krish'
  approvalAuthorityVersionRef: string
  approvalFingerprint: string
}

const g24ApprovedAtomProofs = new WeakMap<G24InterventionAtom, string>()

function g24ApprovedAtomProof(atom: G24InterventionAtom): string {
  return stringifyG24Data({
    atomVersion: atom.atomVersion,
    payloadFingerprint: atom.payloadFingerprint,
    approvalFingerprint: atom.approvalReceipt?.approvalFingerprint ?? null,
  })
}

export function fingerprintG24InterventionAtom(
  atom: Omit<G24InterventionAtom, 'payloadFingerprint' | 'approvalState' | 'approvalReceipt'>,
): string {
  const snapshot = snapshotG24PlainData(atom)
  if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
  atom = snapshot.value
  return stringifyG24Data({
    atomVersion: atom.atomVersion,
    selectorResultVersion: atom.selectorResultVersion,
    selectorFingerprint: atom.selectorFingerprint,
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
    | 'selectorResultVersion'
    | 'selectorFingerprint'
    | 'payloadFingerprint'
    | 'approvalState'
    | 'approvalReceipt'
  >,
): G24InterventionAtom {
  const selectorSnapshot = snapshotG24PlainData(selector)
  const atomSnapshot = snapshotG24PlainData(atom)
  if (!selectorSnapshot.ok || !atomSnapshot.ok) {
    throw new Error('intervention_atom_requires_plain_data')
  }
  selector = selectorSnapshot.value
  atom = atomSnapshot.value
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
    !atom.sensitivity.trim() ||
    !atom.channel.trim() ||
    !atom.timing.trim() ||
    !atom.decisionFrameVersion.trim() ||
    atom.evidenceVersions.length === 0
  ) {
    throw new Error('intervention_atom_approval_binding_incomplete')
  }
  if (
    !selector.actionable ||
    atom.purpose !== selector.purposeRef ||
    atom.audience !== selector.audienceRef ||
    atom.sensitivity !== selector.sensitivityRef ||
    atom.decisionFrameVersion !== selector.acceptedDecisionFrameRef ||
    !atom.evidenceVersions.includes(selector.evidenceCoverageRef) ||
    atom.evidenceVersions.some((version) => !version.trim())
  ) {
    throw new Error('intervention_atom_selector_binding_mismatch')
  }
  if (atom.payload.kind === 'question') {
    if (!(G24_ANSWER_GRAMMARS as readonly unknown[]).includes(atom.payload.answerGrammar)) {
      throw new Error('question_answer_grammar_invalid')
    }
    if (
      !Array.isArray(atom.payload.honestExits) ||
      atom.payload.honestExits.length !== G24_HONEST_EXITS.length ||
      new Set(atom.payload.honestExits).size !== G24_HONEST_EXITS.length ||
      atom.payload.honestExits.some(
        (exit) => !(G24_HONEST_EXITS as readonly unknown[]).includes(exit),
      )
    ) {
      throw new Error('question_honest_exits_invalid')
    }
    if (
      typeof atom.payload.scopedWriteIn !== 'boolean' ||
      !Array.isArray(atom.payload.optionsOrComparator) ||
      !atom.payload.answerEffects ||
      typeof atom.payload.answerEffects !== 'object' ||
      Array.isArray(atom.payload.answerEffects)
    ) {
      throw new Error('question_answer_contract_invalid')
    }
    const exits = new Set(atom.payload.honestExits)
    const reservedAnswerEffectKeys = new Set(['default', ...atom.payload.honestExits])
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
    if (
      atom.payload.optionsOrComparator.length === 0 ||
      atom.payload.optionsOrComparator.some(
        (option) =>
          !option.trim() ||
          option !== option.trim() ||
          reservedAnswerEffectKeys.has(option),
      ) ||
      new Set(atom.payload.optionsOrComparator.map((option) => option.trim())).size !==
        atom.payload.optionsOrComparator.length
    ) {
      throw new Error('question_options_or_comparator_invalid')
    }
    if (
      atom.payload.answerGrammar === 'ranked_choice' &&
      atom.payload.optionsOrComparator.length > 5
    ) {
      throw new Error('question_ranking_exceeds_five')
    }
    const requiredEffectKeys = [...new Set([
      ...atom.payload.honestExits,
      ...(atom.payload.answerGrammar === 'single_choice'
        ? atom.payload.optionsOrComparator
        : ['default']),
      ...(atom.payload.scopedWriteIn ? ['default'] : []),
    ])]
    const allowedEffectKeys = new Set(requiredEffectKeys)
    if (Object.keys(atom.payload.answerEffects).some((key) => !allowedEffectKeys.has(key))) {
      throw new Error('answer_effect_not_offered')
    }
    for (const key of requiredEffectKeys) {
      const effect = Object.prototype.hasOwnProperty.call(atom.payload.answerEffects, key)
        ? atom.payload.answerEffects[key]
        : undefined
      if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
        throw new Error(`answer_effect_required:${key}`)
      }
      if (
        effect.caseEffect !== 'rebuild_required' &&
        effect.caseEffect !== 'no_case_change'
      ) {
        throw new Error(`answer_effect_case_effect_invalid:${key}`)
      }
      if (
        typeof effect.visibleConsequence !== 'string' ||
        !effect.visibleConsequence.trim() ||
        effect.visibleConsequence !== effect.visibleConsequence.trim()
      ) {
        throw new Error(`answer_effect_required:${key}`)
      }
      if (
        !Array.isArray(effect.retireInterventionRefs) ||
        effect.retireInterventionRefs.length !== new Set(effect.retireInterventionRefs).size ||
        effect.retireInterventionRefs.some(
          (ref) => typeof ref !== 'string' || !ref.trim() || ref !== ref.trim(),
        )
      ) {
        throw new Error(`answer_effect_retirement_refs_invalid:${key}`)
      }
      const proposalIsValid =
        effect.pendingHumanOwnedProposal === null ||
        (typeof effect.pendingHumanOwnedProposal === 'string' &&
          Boolean(effect.pendingHumanOwnedProposal.trim()) &&
          effect.pendingHumanOwnedProposal === effect.pendingHumanOwnedProposal.trim())
      if (!proposalIsValid) {
        throw new Error(`answer_effect_proposal_invalid:${key}`)
      }
      if (
        (effect.caseEffect === 'no_case_change' &&
          (effect.pendingHumanOwnedProposal !== null || effect.retireInterventionRefs.length > 0))
      ) {
        throw new Error(`answer_effect_semantics_invalid:${key}`)
      }
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
  } else if (
    !Array.isArray(atom.payload.exactAgenda) ||
    atom.payload.exactAgenda.length === 0 ||
    atom.payload.exactAgenda.some((item) => !item.trim()) ||
    !atom.payload.leaderVisiblePurpose.trim() ||
    !atom.payload.expectedEndState.trim() ||
    atom.payload.leaderCanDeclineRejectOrReframe !== true ||
    atom.payload.noContactScheduleCaptureOrLearningAuthority !== true
  ) {
    throw new Error('session_atom_required_boundary_missing')
  }
  const withoutFingerprint = {
    ...structuredClone(atom),
    selectorResultVersion: selector.selectorResultVersion,
    selectorFingerprint: selector.selectorFingerprint,
  }
  return {
    ...withoutFingerprint,
    payloadFingerprint: fingerprintG24InterventionAtom(withoutFingerprint),
    approvalState: 'proposed',
    approvalReceipt: null,
  }
}

export function validateG24InterventionAtom(atom: G24InterventionAtom): string[] {
  const atomSnapshot = snapshotG24PlainData(atom)
  if (!atomSnapshot.ok) return ['intervention_atom_nonplain_data']
  atom = atomSnapshot.value
  const {
    payloadFingerprint: _payloadFingerprint,
    approvalState: _approvalState,
    approvalReceipt: _approvalReceipt,
    ...content
  } = atom
  const expected = fingerprintG24InterventionAtom(content)
  return expected === atom.payloadFingerprint ? [] : ['intervention_payload_changed_without_new_version']
}

function fingerprintG24ApprovalReceipt(
  receipt: Omit<G24InterventionApprovalReceipt, 'approvalFingerprint'>,
): string {
  return stringifyG24Data(receipt)
}

function interventionAtomMatchesSelector(
  atom: G24InterventionAtom,
  selector: G24SelectorResult,
): boolean {
  if (atom.approvalState !== 'proposed' || atom.approvalReceipt !== null) return false
  try {
    const {
      selectorResultVersion: _selectorResultVersion,
      selectorFingerprint: _selectorFingerprint,
      payloadFingerprint: _payloadFingerprint,
      approvalState: _approvalState,
      approvalReceipt: _approvalReceipt,
      ...atomInput
    } = atom
    const canonical = createG24InterventionAtom(selector, atomInput)
    return (
      canonical.selectorResultVersion === atom.selectorResultVersion &&
      canonical.selectorFingerprint === atom.selectorFingerprint &&
      canonical.payloadFingerprint === atom.payloadFingerprint
    )
  } catch {
    return false
  }
}

export function approveG24InterventionAtom(
  atom: G24InterventionAtom,
  currentSelector: G24SelectorResult,
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
    sensitivity: string
    approvalReceiptId: string
    approvedByRef: 'krish'
    approvalAuthorityVersionRef: string
  },
): G24InterventionAtom {
  const atomSnapshot = snapshotG24PlainData(atom)
  const selectorSnapshot = snapshotG24PlainData(currentSelector)
  const bindingSnapshot = snapshotG24PlainData(binding)
  if (!atomSnapshot.ok || !selectorSnapshot.ok || !bindingSnapshot.ok) {
    throw new Error('intervention_approval_requires_plain_data')
  }
  atom = atomSnapshot.value
  currentSelector = selectorSnapshot.value
  binding = bindingSnapshot.value
  const currentAuthorityWatermark = currentSelector.controllingWatermarks.find(
    ({ key }) => key === 'authority_version',
  )
  const bindingMatches =
    currentSelector.actionable &&
    (currentSelector.route === 'ask' || currentSelector.route === 'session') &&
    currentSelector.selectorResultVersion === atom.selectorResultVersion &&
    currentSelector.selectorFingerprint === atom.selectorFingerprint &&
    fingerprintG24SelectorResult(currentSelector) === currentSelector.selectorFingerprint &&
    interventionAtomMatchesSelector(atom, currentSelector) &&
    binding.atomVersion === atom.atomVersion &&
    binding.controlVersion === atom.controlVersion &&
    binding.purpose === atom.purpose &&
    binding.audience === atom.audience &&
    binding.sensitivity === atom.sensitivity &&
    binding.channel === atom.channel &&
    binding.timing === atom.timing &&
    binding.decisionFrameVersion === atom.decisionFrameVersion &&
    equalSorted(binding.evidenceVersions, atom.evidenceVersions) &&
    binding.payloadFingerprint === atom.payloadFingerprint &&
    typeof binding.approvalReceiptId === 'string' &&
    Boolean(binding.approvalReceiptId.trim()) &&
    binding.approvedByRef === 'krish' &&
    typeof binding.approvalAuthorityVersionRef === 'string' &&
    Boolean(binding.approvalAuthorityVersionRef.trim()) &&
    binding.approvalAuthorityVersionRef === currentAuthorityWatermark?.version
  if (!bindingMatches || validateG24InterventionAtom(atom).length > 0) {
    throw new Error('intervention_approval_binding_mismatch')
  }
  const receiptWithoutFingerprint: Omit<G24InterventionApprovalReceipt, 'approvalFingerprint'> = {
    receiptId: binding.approvalReceiptId,
    atomVersion: atom.atomVersion,
    selectorResultVersion: atom.selectorResultVersion,
    selectorFingerprint: atom.selectorFingerprint,
    payloadFingerprint: atom.payloadFingerprint,
    approvedByRef: binding.approvedByRef,
    approvalAuthorityVersionRef: binding.approvalAuthorityVersionRef,
  }
  const approved: G24InterventionAtom = {
    ...structuredClone(atom),
    approvalState: 'approved',
    approvalReceipt: {
      ...receiptWithoutFingerprint,
      approvalFingerprint: fingerprintG24ApprovalReceipt(receiptWithoutFingerprint),
    },
  }
  g24ApprovedAtomProofs.set(approved, g24ApprovedAtomProof(approved))
  return approved
}

export type G24AnswerKind =
  | 'option'
  | 'ranking'
  | 'write_in'
  | 'voice'
  | 'unknown'
  | 'defer'
  | 'refuse'
  | 'premise_wrong'

const G24_ANSWER_KINDS: readonly G24AnswerKind[] = [
  'option',
  'ranking',
  'write_in',
  'voice',
  'unknown',
  'defer',
  'refuse',
  'premise_wrong',
]

export interface G24AnswerReceipt {
  receiptId: string
  atomVersion: string
  interventionFingerprint: string
  approvalReceiptId: string
  approvalFingerprint: string
  approvalAuthorityVersionRef: string
  answerKind: G24AnswerKind
  value: string | string[] | null
  immutableCaseEvidence: true
  caseEffect: 'rebuild_required' | 'no_case_change'
  pendingHumanOwnedProposal: string | null
  retiredInterventionRefs: string[]
  visibleConsequence: string
  automaticReaskPressure: false
  automaticSessionEscalation: false
}

const g24AnswerReceiptProofs = new WeakMap<G24AnswerReceipt, string>()

function fingerprintG24AnswerReceipt(receipt: G24AnswerReceipt): string {
  return stringifyG24Data(receipt)
}

function cloneG24AnswerReceiptWithProof(receipt: G24AnswerReceipt): G24AnswerReceipt {
  const clone = structuredClone(receipt)
  const proof = g24AnswerReceiptProofs.get(receipt)
  if (proof === fingerprintG24AnswerReceipt(receipt)) {
    g24AnswerReceiptProofs.set(clone, proof)
  }
  return clone
}

export function recordG24Answer(
  atom: G24InterventionAtom,
  answer: { receiptId: string; kind: G24AnswerKind; value?: string | string[] },
  priorReceipts: readonly G24AnswerReceipt[],
): G24AnswerReceipt {
  if (!Array.isArray(priorReceipts)) throw new Error('answer_receipt_ledger_required')
  const atomSnapshot = snapshotG24PlainData(atom)
  const answerSnapshot = snapshotG24PlainData(answer)
  const ledgerSnapshot = snapshotG24PlainData(priorReceipts)
  if (!atomSnapshot.ok || !answerSnapshot.ok || !ledgerSnapshot.ok) {
    throw new Error('answer_requires_plain_data')
  }
  const atomProof = g24ApprovedAtomProofs.get(atom)
  if (atomProof === g24ApprovedAtomProof(atom)) {
    g24ApprovedAtomProofs.set(atomSnapshot.value, atomProof)
  }
  priorReceipts.forEach((receipt, index) => {
    const proof = g24AnswerReceiptProofs.get(receipt)
    if (proof === fingerprintG24AnswerReceipt(receipt)) {
      g24AnswerReceiptProofs.set(ledgerSnapshot.value[index], proof)
    }
  })
  atom = atomSnapshot.value
  answer = answerSnapshot.value
  priorReceipts = ledgerSnapshot.value
  const priorReceiptIds = priorReceipts.map(({ receiptId }) => receiptId)
  if (
    priorReceipts.some(
      (receipt) =>
        !receipt ||
        typeof receipt !== 'object' ||
        Array.isArray(receipt) ||
        g24AnswerReceiptProofs.get(receipt) !== fingerprintG24AnswerReceipt(receipt),
    ) ||
    priorReceiptIds.some(
      (receiptId) =>
        typeof receiptId !== 'string' ||
        !receiptId.trim() ||
        receiptId !== receiptId.trim(),
    ) ||
    new Set(priorReceiptIds).size !== priorReceiptIds.length
  ) {
    throw new Error('answer_receipt_ledger_invalid')
  }
  if (
    typeof answer.receiptId !== 'string' ||
    !answer.receiptId.trim() ||
    answer.receiptId !== answer.receiptId.trim()
  ) {
    throw new Error('answer_receipt_id_required')
  }
  if (typeof answer.kind !== 'string' || !G24_ANSWER_KINDS.includes(answer.kind)) {
    throw new Error('answer_kind_invalid')
  }
  if (
    answer.value !== undefined &&
    typeof answer.value !== 'string' &&
    !Array.isArray(answer.value)
  ) {
    throw new Error('answer_value_invalid')
  }
  if (atom.payload.kind !== 'question') throw new Error('answer_requires_question_atom')
  const approvalReceipt = atom.approvalReceipt
  if (
    atom.approvalState !== 'approved' ||
    !approvalReceipt ||
    approvalReceipt.atomVersion !== atom.atomVersion ||
    approvalReceipt.selectorResultVersion !== atom.selectorResultVersion ||
    approvalReceipt.selectorFingerprint !== atom.selectorFingerprint ||
    approvalReceipt.payloadFingerprint !== atom.payloadFingerprint ||
    approvalReceipt.approvedByRef !== 'krish' ||
    typeof approvalReceipt.receiptId !== 'string' ||
    !approvalReceipt.receiptId.trim() ||
    typeof approvalReceipt.approvalAuthorityVersionRef !== 'string' ||
    !approvalReceipt.approvalAuthorityVersionRef.trim() ||
    approvalReceipt.approvalFingerprint !==
      fingerprintG24ApprovalReceipt({
        receiptId: approvalReceipt.receiptId,
        atomVersion: approvalReceipt.atomVersion,
        selectorResultVersion: approvalReceipt.selectorResultVersion,
        selectorFingerprint: approvalReceipt.selectorFingerprint,
        payloadFingerprint: approvalReceipt.payloadFingerprint,
        approvedByRef: approvalReceipt.approvedByRef,
        approvalAuthorityVersionRef: approvalReceipt.approvalAuthorityVersionRef,
      }) ||
    g24ApprovedAtomProofs.get(atom) !== g24ApprovedAtomProof(atom)
  ) {
    throw new Error('answer_requires_approved_atom')
  }
  if (validateG24InterventionAtom(atom).length > 0) {
    throw new Error('answer_requires_current_exact_atom')
  }
  const honestExit = ['unknown', 'defer', 'refuse', 'premise_wrong'].includes(answer.kind)
  if (honestExit && !atom.payload.honestExits.includes(answer.kind as never)) {
    throw new Error(`answer_exit_not_offered:${answer.kind}`)
  }
  if (honestExit && answer.value !== undefined) throw new Error('answer_exit_value_not_allowed')
  const answerMatchesGrammar =
    honestExit ||
    (answer.kind === 'option' && atom.payload.answerGrammar === 'single_choice') ||
    (answer.kind === 'ranking' && atom.payload.answerGrammar === 'ranked_choice') ||
    (answer.kind === 'write_in' &&
      (atom.payload.answerGrammar === 'bounded_text' || atom.payload.scopedWriteIn)) ||
    (answer.kind === 'voice' && atom.payload.answerGrammar === 'voice_critical_incident')
  if (!answerMatchesGrammar) throw new Error('answer_kind_incompatible_with_grammar')
  if (!honestExit) {
    if (atom.payload.answerGrammar === 'ranked_choice' && answer.kind === 'ranking') {
      const ranking = answer.value
      const offeredOptions = atom.payload.optionsOrComparator
      if (
        !Array.isArray(ranking) ||
        ranking.length !== offeredOptions.length ||
        new Set(ranking).size !== ranking.length ||
        ranking.some(
          (option) =>
            typeof option !== 'string' ||
            !option.trim() ||
            option !== option.trim() ||
            !offeredOptions.includes(option),
        ) ||
        offeredOptions.some((option) => !ranking.includes(option))
      ) {
        throw new Error('answer_ranking_invalid')
      }
    } else {
      if (
        typeof answer.value !== 'string' ||
        !answer.value.trim() ||
        answer.value !== answer.value.trim()
      ) {
        throw new Error('answer_value_required')
      }
      if (
        answer.kind === 'option' &&
        !atom.payload.optionsOrComparator.includes(answer.value)
      ) {
        throw new Error('answer_option_not_offered')
      }
    }
  }
  const effectKey = honestExit
    ? answer.kind
    : answer.kind === 'option' && atom.payload.answerGrammar === 'single_choice'
      ? (answer.value as string)
      : 'default'
  const effect =
    effectKey && Object.prototype.hasOwnProperty.call(atom.payload.answerEffects, effectKey)
      ? atom.payload.answerEffects[effectKey]
      : undefined
  if (!effect) throw new Error(`answer_effect_not_declared:${effectKey ?? 'missing'}`)
  const receipt: G24AnswerReceipt = {
    receiptId: answer.receiptId,
    atomVersion: atom.atomVersion,
    interventionFingerprint: atom.payloadFingerprint,
    approvalReceiptId: approvalReceipt.receiptId,
    approvalFingerprint: approvalReceipt.approvalFingerprint,
    approvalAuthorityVersionRef: approvalReceipt.approvalAuthorityVersionRef,
    answerKind: answer.kind,
    value:
      Array.isArray(answer.value) ? [...answer.value]
      : typeof answer.value === 'string' ? answer.value
      : null,
    immutableCaseEvidence: true,
    caseEffect: effect.caseEffect,
    pendingHumanOwnedProposal: effect.pendingHumanOwnedProposal,
    retiredInterventionRefs: [...new Set(effect.retireInterventionRefs)].sort(compareText),
    visibleConsequence: effect.visibleConsequence,
    automaticReaskPressure: false,
    automaticSessionEscalation: false,
  }
  g24AnswerReceiptProofs.set(receipt, fingerprintG24AnswerReceipt(receipt))
  const prior = priorReceipts.find(({ receiptId }) => receiptId === receipt.receiptId)
  if (prior) {
    if (stringifyG24Data(prior) !== stringifyG24Data(receipt)) {
      throw new Error('answer_receipt_id_collision')
    }
    return cloneG24AnswerReceiptWithProof(prior)
  }
  return receipt
}

export interface G24AnswerCorrectionReceipt {
  receiptId: string
  idempotencyKey: string
  atomVersion: string
  correctsAnswerReceiptId: string
  originalAnswerFingerprint: string
  replacementAnswerReceiptId: string
  replacementAnswerFingerprint: string
  dependencyGraphVersion: string
  dependencyGraphFingerprint: string
  retiredDerivativeRefs: string[]
  affectedDecisionRefs: string[]
  rebuildRequired: true
}

const g24AnswerCorrectionReceiptProofs = new WeakMap<G24AnswerCorrectionReceipt, string>()

function fingerprintG24AnswerCorrectionReceipt(receipt: G24AnswerCorrectionReceipt): string {
  return stringifyG24Data(receipt)
}

function cloneG24AnswerCorrectionReceiptWithProof(
  receipt: G24AnswerCorrectionReceipt,
): G24AnswerCorrectionReceipt {
  const clone = structuredClone(receipt)
  const proof = g24AnswerCorrectionReceiptProofs.get(receipt)
  if (proof === fingerprintG24AnswerCorrectionReceipt(receipt)) {
    g24AnswerCorrectionReceiptProofs.set(clone, proof)
  }
  return clone
}

export interface G24AnswerDependencyGraph {
  graphVersion: string
  derivativeDependencies: Record<string, string[]>
  decisionDependencies: Record<string, string[]>
}

function canonicalizeG24AnswerDependencyRecord(
  record: Record<string, string[]>,
): [string, string[]][] {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('correction_dependency_graph_malformed')
  }
  const canonical: [string, string[]][] = []
  for (const [ref, dependencies] of Object.entries(record)) {
    if (
      typeof ref !== 'string' ||
      !ref.trim() ||
      ref !== ref.trim() ||
      !Array.isArray(dependencies) ||
      dependencies.length !== new Set(dependencies).size ||
      dependencies.some(
        (dependency) =>
          typeof dependency !== 'string' ||
          !dependency.trim() ||
          dependency !== dependency.trim(),
      )
    ) {
      throw new Error('correction_dependency_graph_malformed')
    }
    canonical.push([ref, [...dependencies].sort(compareText)])
  }
  return canonical.sort(([left], [right]) => compareText(left, right))
}

function fingerprintG24AnswerDependencyGraph(graph: G24AnswerDependencyGraph): string {
  if (
    !graph ||
    typeof graph !== 'object' ||
    Array.isArray(graph) ||
    typeof graph.graphVersion !== 'string' ||
    !graph.graphVersion.trim() ||
    graph.graphVersion !== graph.graphVersion.trim()
  ) {
    throw new Error('correction_dependency_graph_version_required')
  }
  const derivativeDependencies = canonicalizeG24AnswerDependencyRecord(
    graph.derivativeDependencies,
  )
  const decisionDependencies = canonicalizeG24AnswerDependencyRecord(graph.decisionDependencies)
  const derivativeRefs = new Set(derivativeDependencies.map(([ref]) => ref))
  if (decisionDependencies.some(([ref]) => derivativeRefs.has(ref))) {
    throw new Error('correction_dependency_graph_malformed')
  }
  return stringifyG24Data({
    graphVersion: graph.graphVersion,
    derivativeDependencies,
    decisionDependencies,
  })
}

function deriveG24AnswerCorrectionImpact(
  originalAnswerReceiptId: string,
  graph: G24AnswerDependencyGraph,
): { derivativeRefs: string[]; decisionRefs: string[] } {
  fingerprintG24AnswerDependencyGraph(graph)
  const affected = new Set([originalAnswerReceiptId])
  const derivativeRefs = new Set<string>()
  const decisionRefs = new Set<string>()
  let changed = true
  while (changed) {
    changed = false
    for (const [ref, dependencies] of Object.entries(graph.derivativeDependencies)) {
      if (!derivativeRefs.has(ref) && dependencies.some((dependency) => affected.has(dependency))) {
        derivativeRefs.add(ref)
        affected.add(ref)
        changed = true
      }
    }
    for (const [ref, dependencies] of Object.entries(graph.decisionDependencies)) {
      if (!decisionRefs.has(ref) && dependencies.some((dependency) => affected.has(dependency))) {
        decisionRefs.add(ref)
        affected.add(ref)
        changed = true
      }
    }
  }
  return {
    derivativeRefs: [...derivativeRefs].sort(compareText),
    decisionRefs: [...decisionRefs].sort(compareText),
  }
}

export function correctG24Answer(
  original: G24AnswerReceipt,
  replacement: G24AnswerReceipt,
  details: {
    receiptId: string
    idempotencyKey: string
    dependencyGraph: G24AnswerDependencyGraph
    priorCorrections: readonly G24AnswerCorrectionReceipt[]
  },
): G24AnswerCorrectionReceipt {
  if (!Array.isArray(details.priorCorrections)) {
    throw new Error('correction_receipt_ledger_required')
  }
  const originalSnapshot = snapshotG24PlainData(original)
  const replacementSnapshot = snapshotG24PlainData(replacement)
  const detailsSnapshot = snapshotG24PlainData(details)
  if (!originalSnapshot.ok || !replacementSnapshot.ok || !detailsSnapshot.ok) {
    throw new Error('correction_requires_plain_data')
  }
  const originalProof = g24AnswerReceiptProofs.get(original)
  if (originalProof === fingerprintG24AnswerReceipt(original)) {
    g24AnswerReceiptProofs.set(originalSnapshot.value, originalProof)
  }
  const replacementProof = g24AnswerReceiptProofs.get(replacement)
  if (replacementProof === fingerprintG24AnswerReceipt(replacement)) {
    g24AnswerReceiptProofs.set(replacementSnapshot.value, replacementProof)
  }
  details.priorCorrections.forEach((receipt, index) => {
    const proof = g24AnswerCorrectionReceiptProofs.get(receipt)
    if (proof === fingerprintG24AnswerCorrectionReceipt(receipt)) {
      g24AnswerCorrectionReceiptProofs.set(detailsSnapshot.value.priorCorrections[index], proof)
    }
  })
  original = originalSnapshot.value
  replacement = replacementSnapshot.value
  details = detailsSnapshot.value
  if (
    details.priorCorrections.some(
      (receipt) => !receipt || typeof receipt !== 'object' || Array.isArray(receipt),
    )
  ) {
    throw new Error('correction_receipt_ledger_invalid')
  }
  const priorReceiptIds = details.priorCorrections.map(({ receiptId }) => receiptId)
  const priorIdempotencyKeys = details.priorCorrections.map(({ idempotencyKey }) => idempotencyKey)
  if (
    details.priorCorrections.some(
      (receipt) =>
        g24AnswerCorrectionReceiptProofs.get(receipt) !==
          fingerprintG24AnswerCorrectionReceipt(receipt),
    ) ||
    priorReceiptIds.some(
      (receiptId) =>
        typeof receiptId !== 'string' ||
        !receiptId.trim() ||
        receiptId !== receiptId.trim(),
    ) ||
    priorIdempotencyKeys.some(
      (idempotencyKey) =>
        typeof idempotencyKey !== 'string' ||
        !idempotencyKey.trim() ||
        idempotencyKey !== idempotencyKey.trim(),
    ) ||
    new Set(priorReceiptIds).size !== priorReceiptIds.length ||
    new Set(priorIdempotencyKeys).size !== priorIdempotencyKeys.length
  ) {
    throw new Error('correction_receipt_ledger_invalid')
  }
  if (original.receiptId === replacement.receiptId) throw new Error('replacement_receipt_must_be_new')
  if (
    !original.receiptId.trim() ||
    !replacement.receiptId.trim() ||
    typeof details.receiptId !== 'string' ||
    !details.receiptId.trim() ||
    details.receiptId !== details.receiptId.trim() ||
    typeof details.idempotencyKey !== 'string' ||
    !details.idempotencyKey.trim() ||
    details.idempotencyKey !== details.idempotencyKey.trim() ||
    details.receiptId === original.receiptId ||
    details.receiptId === replacement.receiptId
  ) {
    throw new Error('correction_receipt_identity_invalid')
  }
  if (original.atomVersion !== replacement.atomVersion) {
    throw new Error('replacement_answer_atom_mismatch')
  }
  if (original.interventionFingerprint !== replacement.interventionFingerprint) {
    throw new Error('replacement_answer_atom_mismatch')
  }
  if (
    typeof original.approvalFingerprint !== 'string' ||
    !original.approvalFingerprint.trim() ||
    typeof replacement.approvalFingerprint !== 'string' ||
    !replacement.approvalFingerprint.trim() ||
    typeof original.approvalReceiptId !== 'string' ||
    !original.approvalReceiptId.trim() ||
    typeof replacement.approvalReceiptId !== 'string' ||
    !replacement.approvalReceiptId.trim() ||
    typeof original.approvalAuthorityVersionRef !== 'string' ||
    !original.approvalAuthorityVersionRef.trim() ||
    typeof replacement.approvalAuthorityVersionRef !== 'string' ||
    !replacement.approvalAuthorityVersionRef.trim() ||
    original.approvalFingerprint !== replacement.approvalFingerprint ||
    original.approvalReceiptId !== replacement.approvalReceiptId ||
    original.approvalAuthorityVersionRef !== replacement.approvalAuthorityVersionRef
  ) {
    throw new Error('replacement_answer_approval_mismatch')
  }
  if (
    g24AnswerReceiptProofs.get(original) !== fingerprintG24AnswerReceipt(original) ||
    g24AnswerReceiptProofs.get(replacement) !== fingerprintG24AnswerReceipt(replacement)
  ) {
    throw new Error('replacement_answer_receipt_not_issued')
  }
  const dependencyGraphFingerprint = fingerprintG24AnswerDependencyGraph(details.dependencyGraph)
  const impact = deriveG24AnswerCorrectionImpact(original.receiptId, details.dependencyGraph)
  const receipt: G24AnswerCorrectionReceipt = {
    receiptId: details.receiptId,
    idempotencyKey: details.idempotencyKey,
    atomVersion: original.atomVersion,
    correctsAnswerReceiptId: original.receiptId,
    originalAnswerFingerprint: fingerprintG24AnswerReceipt(original),
    replacementAnswerReceiptId: replacement.receiptId,
    replacementAnswerFingerprint: fingerprintG24AnswerReceipt(replacement),
    dependencyGraphVersion: details.dependencyGraph.graphVersion,
    dependencyGraphFingerprint,
    retiredDerivativeRefs: impact.derivativeRefs,
    affectedDecisionRefs: impact.decisionRefs,
    rebuildRequired: true,
  }
  const prior = details.priorCorrections.find(
    ({ idempotencyKey }) => idempotencyKey === details.idempotencyKey,
  )
  if (prior) {
    if (stringifyG24Data(prior) !== stringifyG24Data(receipt)) {
      throw new Error('correction_idempotency_key_collision')
    }
    return cloneG24AnswerCorrectionReceiptWithProof(prior)
  }
  if (details.priorCorrections.some(({ receiptId }) => receiptId === details.receiptId)) {
    throw new Error('correction_receipt_id_collision')
  }
  g24AnswerCorrectionReceiptProofs.set(receipt, fingerprintG24AnswerCorrectionReceipt(receipt))
  return receipt
}

export interface G24PendingReleaseProjection {
  projectionVersion: string
  projectionFingerprint: string
  purpose: string
  audience: string
  selectorResultVersions: string[]
  selectorResultFingerprints: Record<string, string>
  selectorControlRoots: Record<string, string[]>
  selectorControlManifests: Record<string, G24ControlManifest>
  selectorControllingWatermarks: Record<string, G24ControlWatermark[]>
  controllingWatermarks: G24ControlWatermark[]
  controllingFingerprint: string
  includedCanonicalSourceVersions: string[]
  includedCanonicalBrainVersions: string[]
}

export function fingerprintG24PendingReleaseProjection(
  projection:
    | Omit<G24PendingReleaseProjection, 'projectionFingerprint'>
    | G24PendingReleaseProjection,
): string {
  const snapshot = snapshotG24PlainData(projection)
  if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
  projection = snapshot.value
  const sortedStringRecord = (record: Record<string, string>) =>
    Object.entries(record).sort(([left], [right]) => compareText(left, right))
  const sortedArrayRecord = <T>(record: Record<string, T[]>, sortItem: (left: T, right: T) => number) =>
    Object.entries(record)
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, values]) => [key, [...values].sort(sortItem)])
  return stringifyG24Data({
    projectionVersion: projection.projectionVersion,
    purpose: projection.purpose,
    audience: projection.audience,
    selectorResultVersions: [...projection.selectorResultVersions].sort(compareText),
    selectorResultFingerprints: sortedStringRecord(projection.selectorResultFingerprints),
    selectorControlRoots: sortedArrayRecord(projection.selectorControlRoots, compareText),
    selectorControlManifests: Object.entries(projection.selectorControlManifests)
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, manifest]) => [
        key,
        {
          ...manifest,
          applicableControlKeys: [...manifest.applicableControlKeys].sort(compareText),
        },
      ]),
    selectorControllingWatermarks: sortedArrayRecord(
      projection.selectorControllingWatermarks,
      (left, right) => compareText(left.key, right.key),
    ),
    controllingWatermarks: [...projection.controllingWatermarks].sort((left, right) =>
      compareText(left.key, right.key),
    ),
    controllingFingerprint: projection.controllingFingerprint,
    includedCanonicalSourceVersions: [...projection.includedCanonicalSourceVersions].sort(compareText),
    includedCanonicalBrainVersions: [...projection.includedCanonicalBrainVersions].sort(compareText),
  })
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
  const inputSnapshot = snapshotG24PlainData(input)
  if (!inputSnapshot.ok) {
    return { projection: null, errors: ['release_compile_requires_plain_data'] }
  }
  input = inputSnapshot.value
  const errors: string[] = []
  const merged = new Map<string, G24ControlWatermark>()
  const selectorControlRoots: Record<string, string[]> = {}
  const selectorControlManifests: Record<string, G24ControlManifest> = {}
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
      selector.applicableControlKeys,
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
    if (
      selector.controlGraphFingerprint !==
      fingerprintG24ControlGraph(selector.applicableControlKeys, input.controls)
    ) {
      errors.push(`${selector.selectorResultVersion}:control_manifest_graph_changed`)
    }
    if (!selector.actionable || selector.route === 'abstain_hold') {
      errors.push(`${selector.selectorResultVersion}:non_actionable_selector_cannot_compile_release`)
    }
    if (!selector.selectorResultVersion.trim()) {
      errors.push('selector_result_version_required')
    }
    if (selector.audienceRef !== input.audience) {
      errors.push(`${selector.selectorResultVersion}:selector_release_audience_mismatch`)
    }
    if (selector.purposeRef !== input.purpose) {
      errors.push(`${selector.selectorResultVersion}:selector_release_purpose_mismatch`)
    }
    selectorControlRoots[selector.selectorResultVersion] = closure.roots
    selectorControlManifests[selector.selectorResultVersion] = {
      manifestVersion: selector.controlManifestVersion,
      applicableControlKeys: [...selector.applicableControlKeys].sort(compareText),
      graphFingerprint: selector.controlGraphFingerprint,
    }
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
  if (
    input.includedCanonicalSourceVersions.length === 0 ||
    input.includedCanonicalSourceVersions.some((version) => !version.trim())
  ) {
    errors.push('canonical_source_version_required')
  }
  if (
    input.includedCanonicalBrainVersions.length === 0 ||
    input.includedCanonicalBrainVersions.some((version) => !version.trim())
  ) {
    errors.push('canonical_brain_version_required')
  }
  const uniqueErrors = [...new Set(errors)].sort(compareText)
  if (uniqueErrors.length > 0) return { projection: null, errors: uniqueErrors }

  const controllingWatermarks = [...merged.values()].sort((left, right) =>
    compareText(left.key, right.key),
  )
  const projectionWithoutFingerprint: Omit<G24PendingReleaseProjection, 'projectionFingerprint'> = {
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
      selectorControlManifests: Object.fromEntries(
        Object.entries(selectorControlManifests).sort(([left], [right]) =>
          compareText(left, right),
        ),
      ),
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
  }
  return {
    projection: {
      ...projectionWithoutFingerprint,
      projectionFingerprint: fingerprintG24PendingReleaseProjection(projectionWithoutFingerprint),
    },
    errors: [],
  }
}

export interface G24ReleaseAuthority {
  authorityVersion: string
  authorityControlVersion: string
  actor: 'named_leader'
  projectionVersion: string
  projectionFingerprint: string
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
    | 'invalidation_receipt_identity_invalid'
    | 'release_authority_missing_or_mismatched'
  receipt: G24ReleaseInvalidationReceipt | null
}

function g24IsStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function g24IsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function g24IsStringRecord(value: unknown): value is Record<string, string> {
  return (
    g24IsRecord(value) &&
    Object.entries(value).every(
      ([key, entry]) => Boolean(key.trim()) && key === key.trim() && typeof entry === 'string',
    )
  )
}

function g24WatermarkIsStructurallyValid(value: unknown): value is G24ControlWatermark {
  return (
    g24IsRecord(value) &&
    g24HasExactOwnKeys(value, ['key', 'lineageId', 'version']) &&
    typeof value.key === 'string' &&
    typeof value.lineageId === 'string' &&
    typeof value.version === 'string'
  )
}

function g24ControlManifestIsStructurallyValid(value: unknown): value is G24ControlManifest {
  return (
    g24IsRecord(value) &&
    g24HasExactOwnKeys(value, ['manifestVersion', 'applicableControlKeys', 'graphFingerprint']) &&
    typeof value.manifestVersion === 'string' &&
    g24IsStringArray(value.applicableControlKeys) &&
    typeof value.graphFingerprint === 'string'
  )
}

function g24ControlRegistryIsStructurallyValid(value: unknown): value is G24ControlRegistry {
  if (!g24IsRecord(value)) return false
  return Object.entries(value).every(([registryKey, entry]) => {
    if (!g24IsRecord(entry)) return false
    const keys = ['key', 'lineageId', 'version', 'state', 'dependencies']
    if (Object.prototype.hasOwnProperty.call(entry, 'validFrom')) keys.push('validFrom')
    if (Object.prototype.hasOwnProperty.call(entry, 'validUntil')) keys.push('validUntil')
    return (
      g24HasExactOwnKeys(entry, keys) &&
      registryKey === entry.key &&
      typeof entry.key === 'string' &&
      typeof entry.lineageId === 'string' &&
      typeof entry.version === 'string' &&
      (['current', 'unknown', 'mismatched', 'invalid', 'indeterminate'] as unknown[]).includes(
        entry.state,
      ) &&
      g24IsStringArray(entry.dependencies) &&
      (!Object.prototype.hasOwnProperty.call(entry, 'validFrom') ||
        typeof entry.validFrom === 'string') &&
      (!Object.prototype.hasOwnProperty.call(entry, 'validUntil') ||
        typeof entry.validUntil === 'string')
    )
  })
}

function g24PendingReleaseProjectionIsStructurallyValid(
  value: unknown,
): value is G24PendingReleaseProjection {
  if (
    !g24IsRecord(value) ||
    !g24HasExactOwnKeys(value, [
      'projectionVersion',
      'projectionFingerprint',
      'purpose',
      'audience',
      'selectorResultVersions',
      'selectorResultFingerprints',
      'selectorControlRoots',
      'selectorControlManifests',
      'selectorControllingWatermarks',
      'controllingWatermarks',
      'controllingFingerprint',
      'includedCanonicalSourceVersions',
      'includedCanonicalBrainVersions',
    ])
  ) {
    return false
  }
  return (
    typeof value.projectionVersion === 'string' &&
    typeof value.projectionFingerprint === 'string' &&
    typeof value.purpose === 'string' &&
    typeof value.audience === 'string' &&
    g24IsStringArray(value.selectorResultVersions) &&
    g24IsStringRecord(value.selectorResultFingerprints) &&
    g24IsRecord(value.selectorControlRoots) &&
    Object.values(value.selectorControlRoots).every(g24IsStringArray) &&
    g24IsRecord(value.selectorControlManifests) &&
    Object.values(value.selectorControlManifests).every(g24ControlManifestIsStructurallyValid) &&
    g24IsRecord(value.selectorControllingWatermarks) &&
    Object.values(value.selectorControllingWatermarks).every(
      (watermarks) =>
        Array.isArray(watermarks) && watermarks.every(g24WatermarkIsStructurallyValid),
    ) &&
    Array.isArray(value.controllingWatermarks) &&
    value.controllingWatermarks.every(g24WatermarkIsStructurallyValid) &&
    typeof value.controllingFingerprint === 'string' &&
    g24IsStringArray(value.includedCanonicalSourceVersions) &&
    g24IsStringArray(value.includedCanonicalBrainVersions)
  )
}

function g24ReleaseAuthorityIsStructurallyValid(
  value: unknown,
): value is G24ReleaseAuthority {
  return (
    g24IsRecord(value) &&
    g24HasExactOwnKeys(value, [
      'authorityVersion',
      'authorityControlVersion',
      'actor',
      'projectionVersion',
      'projectionFingerprint',
      'purpose',
      'audience',
      'selectorResultVersions',
      'selectorResultFingerprints',
      'controllingFingerprint',
      'includedCanonicalSourceVersions',
      'includedCanonicalBrainVersions',
    ]) &&
    typeof value.authorityVersion === 'string' &&
    typeof value.authorityControlVersion === 'string' &&
    value.actor === 'named_leader' &&
    typeof value.projectionVersion === 'string' &&
    typeof value.projectionFingerprint === 'string' &&
    typeof value.purpose === 'string' &&
    typeof value.audience === 'string' &&
    g24IsStringArray(value.selectorResultVersions) &&
    g24IsStringRecord(value.selectorResultFingerprints) &&
    typeof value.controllingFingerprint === 'string' &&
    g24IsStringArray(value.includedCanonicalSourceVersions) &&
    g24IsStringArray(value.includedCanonicalBrainVersions)
  )
}

function equalSorted(left: readonly string[], right: readonly string[]): boolean {
  return stringifyG24Data([...left].sort(compareText)) === stringifyG24Data([...right].sort(compareText))
}

function equalStringRecord(left: Record<string, string>, right: Record<string, string>): boolean {
  const normalize = (value: Record<string, string>) =>
    stringifyG24Data(Object.entries(value).sort(([leftKey], [rightKey]) => compareText(leftKey, rightKey)))
  return normalize(left) === normalize(right)
}

export function evaluateG24PendingReleaseUse(input: {
  projection: G24PendingReleaseProjection
  authority?: G24ReleaseAuthority
  controls: G24ControlRegistry
  trustedAsOf: string
  receiptId: string
}): G24ReleaseUseResult {
  try {
    const inputSnapshot = snapshotG24PlainData(input)
    if (!inputSnapshot.ok) {
      return { eligible: false, reason: 'controlling_state_invalid', receipt: null }
    }
    input = inputSnapshot.value
    const inputKeys = ['projection', 'controls', 'trustedAsOf', 'receiptId']
    if (Object.prototype.hasOwnProperty.call(input, 'authority')) inputKeys.push('authority')
    if (
      !g24HasExactOwnKeys(input, inputKeys) ||
      !g24PendingReleaseProjectionIsStructurallyValid(input.projection) ||
      !g24ControlRegistryIsStructurallyValid(input.controls) ||
      typeof input.trustedAsOf !== 'string' ||
      typeof input.receiptId !== 'string'
    ) {
      return { eligible: false, reason: 'controlling_state_invalid', receipt: null }
    }
    if (
      Object.prototype.hasOwnProperty.call(input, 'authority') &&
      !g24ReleaseAuthorityIsStructurallyValid(input.authority)
    ) {
      return {
        eligible: false,
        reason: 'release_authority_missing_or_mismatched',
        receipt: null,
      }
    }
  const currentMerged = new Map<string, G24ControlWatermark>()
  const stateErrors: string[] = []
  const selectorWatermarkErrors: string[] = []
  if (
    fingerprintG24PendingReleaseProjection(input.projection) !==
    input.projection.projectionFingerprint
  ) {
    stateErrors.push('release_projection_mutated_without_new_version')
  }
  const selectorVersions = [...input.projection.selectorResultVersions].sort(compareText)
  const rootVersions = Object.keys(input.projection.selectorControlRoots).sort(compareText)
  const manifestVersions = Object.keys(input.projection.selectorControlManifests).sort(compareText)
  const watermarkVersions = Object.keys(input.projection.selectorControllingWatermarks).sort(compareText)
  const fingerprintVersions = Object.keys(input.projection.selectorResultFingerprints).sort(compareText)
  if (
    !equalSorted(selectorVersions, rootVersions) ||
    !equalSorted(selectorVersions, manifestVersions) ||
    !equalSorted(selectorVersions, watermarkVersions) ||
    !equalSorted(selectorVersions, fingerprintVersions)
  ) {
    stateErrors.push('release_projection_selector_binding_incomplete')
  }
  for (const [selectorVersion, roots] of Object.entries(input.projection.selectorControlRoots)) {
    const manifest = input.projection.selectorControlManifests[selectorVersion]
    if (!manifest) continue
    const closure = resolveG24ControlClosure(
      roots,
      input.controls,
      input.trustedAsOf,
      true,
      manifest.applicableControlKeys,
    )
    stateErrors.push(...closure.errors.map((error) => `${selectorVersion}:${error}`))
    if (
      manifest.graphFingerprint !==
      fingerprintG24ControlGraph(manifest.applicableControlKeys, input.controls)
    ) {
      selectorWatermarkErrors.push(`${selectorVersion}:control_manifest_graph_changed`)
    }
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
    if (typeof input.receiptId !== 'string' || !input.receiptId.trim()) {
      return {
        eligible: false,
        reason: 'invalidation_receipt_identity_invalid',
        receipt: null,
      }
    }
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
  const currentAuthorityControl = Object.prototype.hasOwnProperty.call(
    input.controls,
    'authority_version',
  )
    ? input.controls.authority_version
    : undefined
  const authorityMatches =
    Boolean(authority?.authorityVersion.trim()) &&
    authority?.actor === 'named_leader' &&
    authority.authorityControlVersion === currentAuthorityControl?.version &&
    authority.projectionVersion === input.projection.projectionVersion &&
    authority.projectionFingerprint === input.projection.projectionFingerprint &&
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
  } catch {
    return { eligible: false, reason: 'controlling_state_invalid', receipt: null }
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
  {
    id: 'open_preparation',
    from: 'none',
    to: 'preparing',
    actor: 'krish',
    authority: 'new_bounded_operator_private_preparation_decision',
    precondition: 'subject_purpose_eligible_source_classes_and_review_date_named',
    invalidation: 'none',
    receipt: 'preparation_opened',
  },
  {
    id: 'accept_intensive_proof',
    from: 'preparing',
    to: 'intensive_proof',
    actor: 'named_leader_and_krish',
    authority: 'accepted_engagement_purpose_and_current_permissions',
    precondition: 'accepted_decision_frame_active_grants_and_checkpoint_recorded',
    invalidation: 'superseded_preparation_projections',
    receipt: 'intensive_proof_accepted',
  },
  {
    id: 'close_preparation',
    from: 'preparing',
    to: 'closed',
    actor: 'krish_or_krish_recording_named_leader_decline_or_withdrawal',
    authority: 'current_preparation_cancellation_decline_or_withdrawal',
    precondition: 'current_preparation_version_and_reason',
    invalidation: 'all_prepared_and_unsent_derivatives',
    receipt: 'preparation_closed',
  },
  {
    id: 'continue_after_intensive_proof',
    from: 'intensive_proof',
    to: 'continuing',
    actor: 'named_leader_and_krish',
    authority: 'explicit_continuation_agreement',
    precondition:
      'next_consequential_decision_or_evidenced_value_checkpoint_and_exit_or_revisit_condition',
    invalidation: 'superseded_period_projections',
    receipt: 'continuation_accepted',
  },
  {
    id: 'renew_continuing_period',
    from: 'continuing',
    to: 'continuing',
    actor: 'named_leader_and_krish',
    authority: 'fresh_checkpoint_agreement',
    precondition: 'next_consequential_decision_or_evidenced_value_and_exit_or_revisit_condition',
    invalidation: 'superseded_period_projections',
    receipt: 'continuing_period_renewed',
  },
  {
    id: 'pause_intensive_proof',
    from: 'intensive_proof',
    to: 'paused',
    actor: 'named_leader_or_krish',
    authority: 'pause_decision',
    precondition: 'current_period',
    invalidation: 'all_unsent_interventions',
    receipt: 'engagement_paused',
  },
  {
    id: 'pause_continuing',
    from: 'continuing',
    to: 'paused',
    actor: 'named_leader_or_krish',
    authority: 'pause_decision',
    precondition: 'current_period',
    invalidation: 'all_unsent_interventions',
    receipt: 'engagement_paused',
  },
  {
    id: 'resume_continuing',
    from: 'paused',
    to: 'continuing',
    actor: 'named_leader_and_krish',
    authority: 'revalidated_continuation_agreement',
    precondition:
      'purpose_identity_grants_audience_standing_freshness_next_value_and_checkpoint_revalidated',
    invalidation: 'all_stale_paused_projections',
    receipt: 'engagement_resumed',
  },
  {
    id: 'close_intensive_proof',
    from: 'intensive_proof',
    to: 'closing',
    actor: 'named_leader_or_krish',
    authority: 'close_request',
    precondition: 'current_period',
    invalidation: 'new_decision_shaping_work_and_unsent_interventions',
    receipt: 'engagement_close_requested',
  },
  {
    id: 'close_continuing',
    from: 'continuing',
    to: 'closing',
    actor: 'named_leader_or_krish',
    authority: 'close_request',
    precondition: 'current_period',
    invalidation: 'new_decision_shaping_work_and_unsent_interventions',
    receipt: 'engagement_close_requested',
  },
  {
    id: 'close_paused',
    from: 'paused',
    to: 'closing',
    actor: 'named_leader_or_krish',
    authority: 'close_request',
    precondition: 'current_period',
    invalidation: 'new_decision_shaping_work_and_unsent_interventions',
    receipt: 'engagement_close_requested',
  },
  {
    id: 'complete_close',
    from: 'closing',
    to: 'closed',
    actor: 'krish',
    authority: 'record_completion_under_named_human_close_request',
    precondition:
      'access_correction_separate_release_and_close_obligations_fulfilled_or_recorded_outstanding',
    invalidation: 'all_prepared_and_unsent_derivatives',
    receipt: 'engagement_closed',
  },
  {
    id: 'open_new_preparation_after_close',
    from: 'closed',
    to: 'preparing',
    actor: 'krish',
    authority: 'new_bounded_operator_private_preparation_decision',
    precondition: 'new_purpose_and_review_date_no_old_grant_revival',
    invalidation: 'none',
    receipt: 'new_preparation_opened',
  },
] as const

export type G24LifecycleTransition = (typeof G24_LIFECYCLE_TRANSITIONS)[number]
export type G24LifecycleTransitionId = G24LifecycleTransition['id']
export type G24LifecycleActorClass = G24LifecycleTransition['actor']
export type G24LifecycleAuthority = G24LifecycleTransition['authority']
export type G24LifecyclePrecondition = G24LifecycleTransition['precondition']
export type G24LifecycleReceiptType = G24LifecycleTransition['receipt']

export interface G24LifecycleReceipt {
  receiptId: string
  transitionId: G24LifecycleTransitionId
  idempotencyKey: string
  beforeState: G24EngagementStateOrNone
  beforeVersion: string | null
  afterState: G24EngagementState
  afterVersion: string
  actorClass: G24LifecycleActorClass
  actorRefs: string[]
  identityControlVersionRef: string
  authority: G24LifecycleAuthority
  authorityVersionRef: string
  precondition: G24LifecyclePrecondition
  preconditionEvidenceRefs: string[]
  invalidation: string
  receiptType: G24LifecycleReceiptType
  requestFingerprint: string
}

export interface G24LifecycleSnapshot {
  state: G24EngagementStateOrNone
  version: string | null
  namedLeaderRef: string
  identityControlVersion: string
  receipts: G24LifecycleReceipt[]
}

const g24LifecycleReceiptProofs = new WeakMap<G24LifecycleReceipt, string>()
const g24LifecycleSnapshotProofs = new WeakMap<G24LifecycleSnapshot, string>()

function fingerprintG24LifecycleReceipt(receipt: G24LifecycleReceipt): string {
  return stringifyG24Data(receipt)
}

function fingerprintG24LifecycleSnapshot(snapshot: G24LifecycleSnapshot): string {
  return stringifyG24Data(snapshot)
}

function cloneG24LifecycleSnapshotWithProofs(
  snapshot: G24LifecycleSnapshot,
): G24LifecycleSnapshot {
  const clone = structuredClone(snapshot)
  snapshot.receipts.forEach((receipt, index) => {
    const proof = g24LifecycleReceiptProofs.get(receipt)
    if (proof === fingerprintG24LifecycleReceipt(receipt)) {
      g24LifecycleReceiptProofs.set(clone.receipts[index], proof)
    }
  })
  const snapshotProof = g24LifecycleSnapshotProofs.get(snapshot)
  if (snapshotProof === fingerprintG24LifecycleSnapshot(snapshot)) {
    g24LifecycleSnapshotProofs.set(clone, snapshotProof)
  }
  return clone
}

export interface G24LifecycleTransitionRequest {
  transitionId: G24LifecycleTransitionId
  fromVersion: string | null
  afterVersion: string
  actorClass: G24LifecycleActorClass
  actorRefs: string[]
  identityControlVersionRef: string
  authority: G24LifecycleAuthority
  authorityVersionRef: string
  precondition: G24LifecyclePrecondition
  preconditionEvidenceRefs: string[]
  idempotencyKey: string
  receiptId: string
}

function fingerprintG24LifecycleRequest(request: G24LifecycleTransitionRequest): string {
  return stringifyG24Data({
    ...request,
    actorRefs: [...request.actorRefs].sort(compareText),
    preconditionEvidenceRefs: [...request.preconditionEvidenceRefs].sort(compareText),
  })
}

function lifecycleActorRefsAreValid(
  actorClass: G24LifecycleActorClass,
  actorRefs: readonly string[],
  namedLeaderRef: string,
): boolean {
  const refs = [...actorRefs]
  if (actorClass === 'krish') return refs.length === 1 && refs[0] === 'krish'
  if (actorClass === 'named_leader_and_krish') {
    return refs.length === 2 && refs.includes('krish') && refs.includes(namedLeaderRef)
  }
  if (actorClass === 'krish_or_krish_recording_named_leader_decline_or_withdrawal') {
    return (
      refs.includes('krish') && refs.every((ref) => ref === 'krish' || ref === namedLeaderRef)
    )
  }
  return refs.length === 1 && (refs[0] === 'krish' || refs[0] === namedLeaderRef)
}

function lifecycleRefsAreCanonical(refs: readonly string[]): boolean {
  return (
    refs.length === new Set(refs).size &&
    refs.every((ref) => typeof ref === 'string' && ref.length > 0 && ref === ref.trim())
  )
}

function lifecycleIdentifierIsCanonical(value: string): boolean {
  return typeof value === 'string' && value.length > 0 && value === value.trim()
}

function g24HasExactOwnKeys(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort(compareText)
  const expected = [...keys].sort(compareText)
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

function buildCanonicalG24LifecycleReceipt(
  definition: G24LifecycleTransition,
  request: G24LifecycleTransitionRequest,
): G24LifecycleReceipt {
  return {
    receiptId: request.receiptId,
    transitionId: request.transitionId,
    idempotencyKey: request.idempotencyKey,
    beforeState: definition.from,
    beforeVersion: request.fromVersion,
    afterState: definition.to,
    afterVersion: request.afterVersion,
    actorClass: request.actorClass,
    actorRefs: [...request.actorRefs].sort(compareText),
    identityControlVersionRef: request.identityControlVersionRef,
    authority: request.authority,
    authorityVersionRef: request.authorityVersionRef,
    precondition: request.precondition,
    preconditionEvidenceRefs: [...request.preconditionEvidenceRefs].sort(compareText),
    invalidation: definition.invalidation,
    receiptType: definition.receipt,
    requestFingerprint: fingerprintG24LifecycleRequest(request),
  }
}

function g24LifecycleHistoryIsStructurallyValid(snapshot: G24LifecycleSnapshot): boolean {
  if (!Array.isArray(snapshot.receipts)) return false
  if (
    snapshot.receipts.length > 0 &&
    g24LifecycleSnapshotProofs.get(snapshot) !== fingerprintG24LifecycleSnapshot(snapshot)
  ) {
    return false
  }
  const receiptIds = new Set<string>()
  const idempotencyKeys = new Set<string>()
  const afterVersions = new Set<string>()
  let previous: G24LifecycleReceipt | undefined
  for (const receipt of snapshot.receipts) {
    if (
      !receipt ||
      typeof receipt !== 'object' ||
      Array.isArray(receipt) ||
      !Array.isArray(receipt.actorRefs) ||
      !Array.isArray(receipt.preconditionEvidenceRefs)
    ) {
      return false
    }
    if (g24LifecycleReceiptProofs.get(receipt) !== fingerprintG24LifecycleReceipt(receipt)) {
      return false
    }
    const definition = G24_LIFECYCLE_TRANSITIONS.find(({ id }) => id === receipt.transitionId)
    if (!definition) return false
    const request: G24LifecycleTransitionRequest = {
      transitionId: receipt.transitionId,
      fromVersion: receipt.beforeVersion,
      afterVersion: receipt.afterVersion,
      actorClass: receipt.actorClass,
      actorRefs: [...receipt.actorRefs],
      identityControlVersionRef: receipt.identityControlVersionRef,
      authority: receipt.authority,
      authorityVersionRef: receipt.authorityVersionRef,
      precondition: receipt.precondition,
      preconditionEvidenceRefs: [...receipt.preconditionEvidenceRefs],
      idempotencyKey: receipt.idempotencyKey,
      receiptId: receipt.receiptId,
    }
    if (
      !lifecycleRefsAreCanonical(receipt.actorRefs) ||
      receipt.actorClass !== definition.actor ||
      !lifecycleActorRefsAreValid(receipt.actorClass, receipt.actorRefs, snapshot.namedLeaderRef) ||
      !lifecycleRefsAreCanonical(receipt.preconditionEvidenceRefs) ||
      receipt.preconditionEvidenceRefs.length === 0 ||
      receipt.authority !== definition.authority ||
      receipt.precondition !== definition.precondition ||
      receipt.identityControlVersionRef !== snapshot.identityControlVersion ||
      !lifecycleIdentifierIsCanonical(receipt.receiptId) ||
      !lifecycleIdentifierIsCanonical(receipt.idempotencyKey) ||
      !lifecycleIdentifierIsCanonical(receipt.afterVersion) ||
      (receipt.beforeVersion !== null &&
        !lifecycleIdentifierIsCanonical(receipt.beforeVersion)) ||
      !lifecycleIdentifierIsCanonical(receipt.identityControlVersionRef) ||
      !lifecycleIdentifierIsCanonical(receipt.authorityVersionRef) ||
      receiptIds.has(receipt.receiptId) ||
      idempotencyKeys.has(receipt.idempotencyKey) ||
      receipt.afterVersion === receipt.beforeVersion ||
      afterVersions.has(receipt.afterVersion) ||
      (previous === undefined &&
        (receipt.beforeState !== 'none' || receipt.beforeVersion !== null)) ||
      (previous !== undefined &&
        (receipt.beforeState !== previous.afterState ||
          receipt.beforeVersion !== previous.afterVersion)) ||
      stringifyG24Data(receipt) !==
        stringifyG24Data(buildCanonicalG24LifecycleReceipt(definition, request))
    ) {
      return false
    }
    receiptIds.add(receipt.receiptId)
    idempotencyKeys.add(receipt.idempotencyKey)
    afterVersions.add(receipt.afterVersion)
    previous = receipt
  }
  return previous === undefined
    ? snapshot.state === 'none' && snapshot.version === null
    : snapshot.state === previous.afterState && snapshot.version === previous.afterVersion
}

export function applyG24LifecycleTransition(
  snapshot: G24LifecycleSnapshot,
  request: G24LifecycleTransitionRequest,
): { accepted: boolean; reason: string; snapshot: G24LifecycleSnapshot } {
  const snapshotCopy = snapshotG24PlainData(snapshot)
  const requestCopy = snapshotG24PlainData(request)
  const safeRejectedSnapshot: G24LifecycleSnapshot = {
    state: 'none',
    version: null,
    namedLeaderRef: '',
    identityControlVersion: '',
    receipts: [],
  }
  if (!snapshotCopy.ok || !requestCopy.ok) {
    return { accepted: false, reason: 'lifecycle_requires_plain_data', snapshot: safeRejectedSnapshot }
  }
  if (
    !g24HasExactOwnKeys(snapshotCopy.value, [
      'state',
      'version',
      'namedLeaderRef',
      'identityControlVersion',
      'receipts',
    ]) ||
    !g24HasExactOwnKeys(requestCopy.value, [
      'transitionId',
      'fromVersion',
      'afterVersion',
      'actorClass',
      'actorRefs',
      'identityControlVersionRef',
      'authority',
      'authorityVersionRef',
      'precondition',
      'preconditionEvidenceRefs',
      'idempotencyKey',
      'receiptId',
    ])
  ) {
    return { accepted: false, reason: 'lifecycle_envelope_unknown_fields', snapshot: snapshotCopy.value }
  }
  snapshot.receipts.forEach((receipt, index) => {
    const proof = g24LifecycleReceiptProofs.get(receipt)
    if (proof === fingerprintG24LifecycleReceipt(receipt)) {
      g24LifecycleReceiptProofs.set(snapshotCopy.value.receipts[index], proof)
    }
  })
  const snapshotProof = g24LifecycleSnapshotProofs.get(snapshot)
  if (snapshotProof === fingerprintG24LifecycleSnapshot(snapshot)) {
    g24LifecycleSnapshotProofs.set(snapshotCopy.value, snapshotProof)
  }
  snapshot = snapshotCopy.value
  request = requestCopy.value
  if (
    !lifecycleIdentifierIsCanonical(snapshot.namedLeaderRef) ||
    !lifecycleIdentifierIsCanonical(snapshot.identityControlVersion)
  ) {
    return { accepted: false, reason: 'lifecycle_identity_binding_missing', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  if (!g24LifecycleHistoryIsStructurallyValid(snapshot)) {
    return {
      accepted: false,
      reason: 'lifecycle_receipt_history_invalid',
      snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot),
    }
  }
  const definition = G24_LIFECYCLE_TRANSITIONS.find(({ id }) => id === request.transitionId)
  if (!definition) return { accepted: false, reason: 'transition_unknown', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  if (
    request.actorClass !== definition.actor ||
    !lifecycleRefsAreCanonical(request.actorRefs) ||
    !lifecycleActorRefsAreValid(request.actorClass, request.actorRefs, snapshot.namedLeaderRef) ||
    request.identityControlVersionRef !== snapshot.identityControlVersion ||
    !lifecycleIdentifierIsCanonical(request.identityControlVersionRef) ||
    request.authority !== definition.authority ||
    !lifecycleIdentifierIsCanonical(request.authorityVersionRef)
  ) {
    return { accepted: false, reason: 'actor_or_authority_invalid', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  if (
    request.precondition !== definition.precondition ||
    request.preconditionEvidenceRefs.length === 0 ||
    !lifecycleRefsAreCanonical(request.preconditionEvidenceRefs)
  ) {
    return { accepted: false, reason: 'precondition_unsatisfied', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  if (
    !lifecycleIdentifierIsCanonical(request.afterVersion) ||
    (request.fromVersion !== null && !lifecycleIdentifierIsCanonical(request.fromVersion)) ||
    !lifecycleIdentifierIsCanonical(request.idempotencyKey) ||
    !lifecycleIdentifierIsCanonical(request.receiptId)
  ) {
    return { accepted: false, reason: 'transition_envelope_incomplete', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  const requestFingerprint = fingerprintG24LifecycleRequest(request)
  const prior = snapshot.receipts.find((receipt) => receipt.idempotencyKey === request.idempotencyKey)
  if (prior) {
    const canonicalPrior = buildCanonicalG24LifecycleReceipt(definition, request)
    if (
      prior.requestFingerprint !== requestFingerprint ||
      stringifyG24Data(prior) !== stringifyG24Data(canonicalPrior)
    ) {
      return {
        accepted: false,
        reason: 'idempotency_key_collision',
        snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot),
      }
    }
    return {
      accepted: true,
      reason: 'idempotent_replay',
      snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot),
    }
  }
  if (snapshot.receipts.some((receipt) => receipt.receiptId === request.receiptId)) {
    return { accepted: false, reason: 'receipt_id_collision', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  if (snapshot.state !== definition.from) {
    return { accepted: false, reason: 'transition_edge_not_allowed', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  if (definition.from === 'none') {
    if (request.fromVersion !== null || snapshot.version !== null) {
      return { accepted: false, reason: 'from_version_must_be_none', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
    }
  } else if (request.fromVersion !== snapshot.version) {
    return { accepted: false, reason: 'from_version_mismatch', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  if (request.afterVersion === snapshot.version) {
    return { accepted: false, reason: 'after_version_must_advance', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  if (
    snapshot.receipts.some(
      (receipt) =>
        receipt.beforeVersion === request.afterVersion || receipt.afterVersion === request.afterVersion,
    )
  ) {
    return { accepted: false, reason: 'after_version_already_used', snapshot: cloneG24LifecycleSnapshotWithProofs(snapshot) }
  }
  const receipt = buildCanonicalG24LifecycleReceipt(definition, request)
  g24LifecycleReceiptProofs.set(receipt, fingerprintG24LifecycleReceipt(receipt))
  const nextSnapshot: G24LifecycleSnapshot = {
    state: definition.to,
    version: request.afterVersion,
    namedLeaderRef: snapshot.namedLeaderRef,
    identityControlVersion: snapshot.identityControlVersion,
    receipts: [...snapshot.receipts, receipt],
  }
  g24LifecycleSnapshotProofs.set(nextSnapshot, fingerprintG24LifecycleSnapshot(nextSnapshot))
  return {
    accepted: true,
    reason: 'transition_accepted',
    snapshot: cloneG24LifecycleSnapshotWithProofs(nextSnapshot),
  }
}

export function renderG24SelectorReceipt(result: G24SelectorResult): string {
  const snapshot = snapshotG24PlainData(result)
  if (!snapshot.ok) return 'Standing: held with no action'
  result = snapshot.value
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
  planFingerprint: string
}

const g24EnrichmentExecutionPlanProofs = new WeakMap<G24EnrichmentExecutionPlan, string>()

export function fingerprintG24EnrichmentExecutionPlan(
  plan: Omit<G24EnrichmentExecutionPlan, 'planFingerprint'>,
): string {
  const snapshot = snapshotG24PlainData(plan)
  if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
  plan = snapshot.value
  return stringifyG24Data({
    planVersion: plan.planVersion,
    selectorResultVersion: plan.selectorResultVersion,
    selectorFingerprint: plan.selectorFingerprint,
    maximumWallClockMs: plan.maximumWallClockMs,
    maximumAttempts: plan.maximumAttempts,
  })
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
  planFingerprint: string
  attemptNumber: number
  attemptFingerprint: string
  status: G24ExecutionStatus
  sourceRef: string | null
  appendOnly: true
  standingAwarded: false
  canonicalEvidenceCreated: false
  brainChanged: false
  approvalCreated: false
  deliveryCreated: false
}

const g24ExecutionReceiptProofs = new WeakMap<G24ExecutionReceipt, string>()

function fingerprintG24ExecutionReceipt(receipt: G24ExecutionReceipt): string {
  return stringifyG24Data(receipt)
}

function cloneG24ExecutionReceiptsWithProofs(
  receipts: readonly G24ExecutionReceipt[],
): G24ExecutionReceipt[] {
  if (!Array.isArray(receipts)) return []
  const clones = structuredClone(receipts)
  receipts.forEach((receipt, index) => {
    if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return
    const proof = g24ExecutionReceiptProofs.get(receipt)
    if (proof === fingerprintG24ExecutionReceipt(receipt)) {
      g24ExecutionReceiptProofs.set(clones[index], proof)
    }
  })
  return clones
}

export type G24EnrichmentAttemptResult =
  | {
      receipt: G24ExecutionReceipt
      receipts: G24ExecutionReceipt[]
      replayed: boolean
      rejection: null
    }
  | {
      receipt: null
      receipts: G24ExecutionReceipt[]
      replayed: false
      rejection: {
        status: 'malformed_rejected' | 'stale_context_rejected'
        durableReceiptCreated: false
      }
    }

function g24ExecutionReceiptLedgerIsStructurallyValid(
  receipts: readonly G24ExecutionReceipt[],
  plan: G24EnrichmentExecutionPlan,
): boolean {
  const receiptIds = new Set<string>()
  const idempotencyKeys = new Set<string>()
  return receipts.every((receipt, index) => {
    if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return false
    if (g24ExecutionReceiptProofs.get(receipt) !== fingerprintG24ExecutionReceipt(receipt)) {
      return false
    }
    const sourceRefIsValid =
      receipt.status === 'proposed_evidence'
        ? typeof receipt.sourceRef === 'string' &&
          Boolean(receipt.sourceRef.trim()) &&
          receipt.sourceRef === receipt.sourceRef.trim()
        : receipt.sourceRef === null
    const identityIsCanonical =
      typeof receipt.receiptId === 'string' &&
      Boolean(receipt.receiptId.trim()) &&
      receipt.receiptId === receipt.receiptId.trim() &&
      typeof receipt.idempotencyKey === 'string' &&
      Boolean(receipt.idempotencyKey.trim()) &&
      receipt.idempotencyKey === receipt.idempotencyKey.trim() &&
      typeof receipt.attemptFingerprint === 'string' &&
      Boolean(receipt.attemptFingerprint)
    const unique =
      !receiptIds.has(receipt.receiptId) && !idempotencyKeys.has(receipt.idempotencyKey)
    receiptIds.add(receipt.receiptId)
    idempotencyKeys.add(receipt.idempotencyKey)
    return (
      identityIsCanonical &&
      unique &&
      receipt.planVersion === plan.planVersion &&
      receipt.planFingerprint === plan.planFingerprint &&
      receipt.attemptNumber === index + 1 &&
      (['proposed_evidence', 'failed_held', 'slow_held', 'stale_rejected', 'attempt_budget_held'] as unknown[]).includes(
        receipt.status,
      ) &&
      sourceRefIsValid &&
      receipt.appendOnly === true &&
      receipt.standingAwarded === false &&
      receipt.canonicalEvidenceCreated === false &&
      receipt.brainChanged === false &&
      receipt.approvalCreated === false &&
      receipt.deliveryCreated === false
    )
  })
}

export function createG24EnrichmentExecutionPlan(
  selector: G24SelectorResult,
  input: { planVersion: string; maximumWallClockMs: number; maximumAttempts: number },
): G24EnrichmentExecutionPlan {
  const selectorSnapshot = snapshotG24PlainData(selector)
  const inputSnapshot = snapshotG24PlainData(input)
  if (!selectorSnapshot.ok || !inputSnapshot.ok) {
    throw new Error('enrichment_plan_requires_plain_data')
  }
  selector = selectorSnapshot.value
  input = inputSnapshot.value
  if (selector.route !== 'enrich' || !selector.actionable) {
    throw new Error('enrichment_plan_requires_actionable_enrich_route')
  }
  if (
    !input.planVersion.trim() ||
    input.planVersion !== input.planVersion.trim() ||
    !Number.isFinite(input.maximumWallClockMs) ||
    input.maximumWallClockMs <= 0 ||
    !Number.isInteger(input.maximumAttempts) ||
    input.maximumAttempts <= 0
  ) {
    throw new Error('enrichment_plan_budget_invalid')
  }
  const planWithoutFingerprint = {
    planVersion: input.planVersion,
    selectorResultVersion: selector.selectorResultVersion,
    selectorFingerprint: selector.selectorFingerprint,
    maximumWallClockMs: input.maximumWallClockMs,
    maximumAttempts: input.maximumAttempts,
  }
  const plan: G24EnrichmentExecutionPlan = {
    ...planWithoutFingerprint,
    planFingerprint: fingerprintG24EnrichmentExecutionPlan(planWithoutFingerprint),
  }
  g24EnrichmentExecutionPlanProofs.set(plan, plan.planFingerprint)
  return plan
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
}): G24EnrichmentAttemptResult {
  const inputSnapshot = snapshotG24PlainData(input)
  if (!inputSnapshot.ok) {
    return {
      receipt: null,
      receipts: [],
      replayed: false,
      rejection: { status: 'malformed_rejected', durableReceiptCreated: false },
    }
  }
  const planProof = g24EnrichmentExecutionPlanProofs.get(input.plan)
  if (planProof === fingerprintG24EnrichmentExecutionPlan(input.plan)) {
    g24EnrichmentExecutionPlanProofs.set(inputSnapshot.value.plan, planProof)
  }
  if (Array.isArray(input.priorReceipts)) {
    input.priorReceipts.forEach((receipt, index) => {
      const proof = g24ExecutionReceiptProofs.get(receipt)
      if (proof === fingerprintG24ExecutionReceipt(receipt)) {
        g24ExecutionReceiptProofs.set(inputSnapshot.value.priorReceipts[index], proof)
      }
    })
  }
  input = inputSnapshot.value
  const priorReceiptLedgerIsAnArray = Array.isArray(input.priorReceipts)
  const receiptIdIsValid =
    typeof input.attempt.receiptId === 'string' &&
    Boolean(input.attempt.receiptId.trim()) &&
    input.attempt.receiptId === input.attempt.receiptId.trim()
  const idempotencyKeyIsValid =
    typeof input.attempt.idempotencyKey === 'string' &&
    Boolean(input.attempt.idempotencyKey.trim()) &&
    input.attempt.idempotencyKey === input.attempt.idempotencyKey.trim()
  const planVersionIsValid =
    typeof input.plan.planVersion === 'string' &&
    Boolean(input.plan.planVersion.trim()) &&
    input.plan.planVersion === input.plan.planVersion.trim()
  const sourceRefIsValid =
    input.attempt.sourceRef === undefined ||
    (typeof input.attempt.sourceRef === 'string' &&
      Boolean(input.attempt.sourceRef.trim()) &&
      input.attempt.sourceRef === input.attempt.sourceRef.trim())
  const planFingerprintIsValid =
    typeof input.plan.planFingerprint === 'string' && Boolean(input.plan.planFingerprint.trim())
  const computedPlanFingerprint = planFingerprintIsValid
    ? fingerprintG24EnrichmentExecutionPlan(input.plan)
    : null
  const issuedPlanFingerprint = g24EnrichmentExecutionPlanProofs.get(input.plan)
  const planIssuanceIsValid =
    computedPlanFingerprint === input.plan.planFingerprint &&
    issuedPlanFingerprint === input.plan.planFingerprint
  const malformed =
    !receiptIdIsValid ||
    !idempotencyKeyIsValid ||
    !sourceRefIsValid ||
    !Number.isFinite(input.attempt.elapsedMs) ||
    input.attempt.elapsedMs < 0 ||
    !(['succeeded', 'failed'] as unknown[]).includes(input.attempt.outcome) ||
    !planVersionIsValid ||
    !planFingerprintIsValid ||
    !planIssuanceIsValid ||
    !priorReceiptLedgerIsAnArray ||
    !Number.isFinite(input.plan.maximumWallClockMs) ||
    input.plan.maximumWallClockMs <= 0 ||
    !Number.isInteger(input.plan.maximumAttempts) ||
    input.plan.maximumAttempts <= 0
  if (malformed) {
    return {
      receipt: null,
      receipts: cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
      replayed: false,
      rejection: { status: 'malformed_rejected', durableReceiptCreated: false },
    }
  }
  if (!g24ExecutionReceiptLedgerIsStructurallyValid(input.priorReceipts, input.plan)) {
    return {
      receipt: null,
      receipts: cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
      replayed: false,
      rejection: { status: 'malformed_rejected', durableReceiptCreated: false },
    }
  }
  const attemptFingerprint = stringifyG24Data({
    plan: input.plan,
    currentSelectorVersion: input.currentSelector.selectorResultVersion,
    currentSelectorFingerprint: input.currentSelector.selectorFingerprint,
    receiptId: input.attempt.receiptId,
    idempotencyKey: input.attempt.idempotencyKey,
    elapsedMs: input.attempt.elapsedMs,
    outcome: input.attempt.outcome,
    sourceRef: input.attempt.sourceRef ?? null,
  })
  const priorIndex = input.priorReceipts.findIndex(
    ({ idempotencyKey }) => idempotencyKey === input.attempt.idempotencyKey,
  )
  const prior = priorIndex >= 0 ? input.priorReceipts[priorIndex] : undefined
  const currentSelectorMatchesPlan =
    input.currentSelector.route === 'enrich' &&
    input.currentSelector.actionable &&
    input.currentSelector.selectorResultVersion === input.plan.selectorResultVersion &&
    input.currentSelector.selectorFingerprint === input.plan.selectorFingerprint &&
    fingerprintG24SelectorResult(input.currentSelector) === input.currentSelector.selectorFingerprint
  const receiptIdAlreadyUsed = input.priorReceipts.some(
    ({ receiptId }) => receiptId === input.attempt.receiptId,
  )
  if (!currentSelectorMatchesPlan && (prior || receiptIdAlreadyUsed)) {
    return {
      receipt: null,
      receipts: cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
      replayed: false,
      rejection: { status: 'stale_context_rejected', durableReceiptCreated: false },
    }
  }

  const attemptNumber = prior ? priorIndex + 1 : input.priorReceipts.length + 1
  let status: G24ExecutionStatus
  if (!currentSelectorMatchesPlan) {
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
    planFingerprint: input.plan.planFingerprint,
    attemptNumber,
    attemptFingerprint,
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
  g24ExecutionReceiptProofs.set(receipt, fingerprintG24ExecutionReceipt(receipt))
  if (prior) {
    const sameAttemptIdentity =
      prior.receiptId === input.attempt.receiptId &&
      prior.planVersion === input.plan.planVersion &&
      prior.planFingerprint === input.plan.planFingerprint &&
      prior.attemptFingerprint === attemptFingerprint
    if (!sameAttemptIdentity) throw new Error('execution_idempotency_key_collision')
    if (stringifyG24Data(prior) !== stringifyG24Data(receipt)) {
      throw new Error('execution_receipt_history_invalid')
    }
    return {
      receipt: cloneG24ExecutionReceiptsWithProofs([receipt])[0],
      receipts: cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
      replayed: true,
      rejection: null,
    }
  }
  if (receiptIdAlreadyUsed) throw new Error('execution_receipt_id_collision')
  return {
    receipt,
    receipts: [...cloneG24ExecutionReceiptsWithProofs(input.priorReceipts), receipt],
    replayed: false,
    rejection: null,
  }
}

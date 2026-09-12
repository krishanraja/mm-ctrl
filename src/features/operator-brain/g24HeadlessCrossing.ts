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

type G24PlainCopy = { ok: true; value: unknown } | { ok: false }
type G24PlainSnapshot<T> =
  | { ok: true; value: T; sourceForOwned: WeakMap<object, object> }
  | { ok: false }

function snapshotG24PlainData<T>(value: T): G24PlainSnapshot<T> {
  const active = new WeakSet<object>()
  const sourceForOwned = new WeakMap<object, object>()
  const copy = (current: unknown): G24PlainCopy => {
    try {
      if (current === null || typeof current === 'string' || typeof current === 'boolean') {
        return { ok: true, value: current }
      }
      if (typeof current === 'number') {
        return Number.isFinite(current) && !Object.is(current, -0)
          ? { ok: true, value: current }
          : { ok: false }
      }
      if (typeof current !== 'object' || active.has(current)) return { ok: false }
      active.add(current)
      if (Object.getOwnPropertySymbols(current).length > 0) return { ok: false }

      if (Array.isArray(current)) {
        if (Object.getPrototypeOf(current) !== Array.prototype) return { ok: false }
        const names = Object.getOwnPropertyNames(current)
        const lengthDescriptor = Object.getOwnPropertyDescriptor(current, 'length')
        if (
          !lengthDescriptor ||
          !Object.prototype.hasOwnProperty.call(lengthDescriptor, 'value') ||
          typeof lengthDescriptor.value !== 'number' ||
          !Number.isSafeInteger(lengthDescriptor.value) ||
          lengthDescriptor.value < 0
        ) {
          return { ok: false }
        }
        const length = lengthDescriptor.value
        if (names.length !== length + 1 || !names.includes('length')) return { ok: false }
        const nameSet = new Set(names)
        for (let index = 0; index < length; index += 1) {
          if (!nameSet.has(String(index))) return { ok: false }
        }
        const result: unknown[] = []
        for (let index = 0; index < length; index += 1) {
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
        sourceForOwned.set(result, current)
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
      sourceForOwned.set(result, current)
      return { ok: true, value: result }
    } catch {
      return { ok: false }
    } finally {
      if (typeof current === 'object' && current !== null) active.delete(current)
    }
  }
  const copied = copy(value)
  return copied.ok
    ? { ok: true, value: copied.value as T, sourceForOwned }
    : { ok: false }
}

function g24SourceForOwned<T extends object>(
  snapshot: Extract<G24PlainSnapshot<unknown>, { ok: true }>,
  owned: T,
): T | undefined {
  return snapshot.sourceForOwned.get(owned) as T | undefined
}

function g24IdentifierIsCanonical(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim()
}

const G24_INVALID_FINGERPRINT = '__g24_invalid_nonplain_data__'

function g24FingerprintIsValid(value: unknown): value is string {
  return g24IdentifierIsCanonical(value) && value !== G24_INVALID_FINGERPRINT
}

function g24SetOwn<T>(record: Record<string, T>, key: string, value: T): void {
  Object.defineProperty(record, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}

function stringifyG24Data(value: unknown): string {
  const snapshot = snapshotG24PlainData(value)
  return snapshot.ok ? JSON.stringify(snapshot.value) : G24_INVALID_FINGERPRINT
}

const G24_SHA256_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const

function g24RotateRight(value: number, count: number): number {
  return (value >>> count) | (value << (32 - count))
}

function g24Sha256(value: string): string {
  const bytes = new TextEncoder().encode(value)
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 8, Math.floor(bytes.length / 0x20000000), false)
  view.setUint32(paddedLength - 4, (bytes.length << 3) >>> 0, false)

  const hash = new Uint32Array([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ])
  const words = new Uint32Array(64)
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false)
    }
    for (let index = 16; index < 64; index += 1) {
      const previous15 = words[index - 15]
      const previous2 = words[index - 2]
      const sigma0 =
        g24RotateRight(previous15, 7) ^
        g24RotateRight(previous15, 18) ^
        (previous15 >>> 3)
      const sigma1 =
        g24RotateRight(previous2, 17) ^
        g24RotateRight(previous2, 19) ^
        (previous2 >>> 10)
      words[index] =
        (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = hash
    for (let index = 0; index < 64; index += 1) {
      const sum1 = g24RotateRight(e, 6) ^ g24RotateRight(e, 11) ^ g24RotateRight(e, 25)
      const choice = (e & f) ^ (~e & g)
      const temporary1 =
        (h + sum1 + choice + G24_SHA256_CONSTANTS[index] + words[index]) >>> 0
      const sum0 = g24RotateRight(a, 2) ^ g24RotateRight(a, 13) ^ g24RotateRight(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const temporary2 = (sum0 + majority) >>> 0
      h = g
      g = f
      f = e
      e = (d + temporary1) >>> 0
      d = c
      c = b
      b = a
      a = (temporary1 + temporary2) >>> 0
    }
    hash[0] = (hash[0] + a) >>> 0
    hash[1] = (hash[1] + b) >>> 0
    hash[2] = (hash[2] + c) >>> 0
    hash[3] = (hash[3] + d) >>> 0
    hash[4] = (hash[4] + e) >>> 0
    hash[5] = (hash[5] + f) >>> 0
    hash[6] = (hash[6] + g) >>> 0
    hash[7] = (hash[7] + h) >>> 0
  }
  return `sha256:${[...hash].map((part) => part.toString(16).padStart(8, '0')).join('')}`
}

function validDate(value: string | undefined): number | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(
    value,
  )
  if (!match) return undefined
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)
  const offsetHour = match[10] === undefined ? 0 : Number(match[10])
  const offsetMinute = match[11] === undefined ? 0 : Number(match[11])
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth =
    month >= 1 && month <= 12
      ? [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
      : 0
  if (
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 14 ||
    offsetMinute > 59 ||
    (offsetHour === 14 && offsetMinute !== 0)
  ) {
    return undefined
  }
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
  if (
    !Array.isArray(roots) ||
    !roots.every(g24IdentifierIsCanonical) ||
    !Array.isArray(applicableControlKeys) ||
    !applicableControlKeys.every(g24IdentifierIsCanonical) ||
    typeof trustedAsOf !== 'string' ||
    typeof requireMinimum !== 'boolean' ||
    !g24ControlRegistryIsStructurallyValid(controls)
  ) {
    return { roots: [], watermarks: [], errors: ['control_closure_shape_invalid'] }
  }
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
  try {
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
  } catch {
    return '__g24_invalid_nonplain_data__'
  }
}

export function fingerprintG24Watermarks(watermarks: readonly G24ControlWatermark[]): string {
  try {
    const snapshot = snapshotG24PlainData(watermarks)
    if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
    watermarks = snapshot.value
    return stringifyG24Data(
      [...watermarks]
        .sort((left, right) => compareText(left.key, right.key))
        .map(({ key, lineageId, version }) => ({ key, lineageId, version })),
    )
  } catch {
    return '__g24_invalid_nonplain_data__'
  }
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
  burden: number
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

const g24SelectorAlternativeResultSchema = z
  .object({
    route: z.enum(['reuse', 'enrich', 'ask', 'session']),
    eligible: z.boolean(),
    burden: z.number(),
    rejectionReasons: z.array(z.string()),
  })
  .strict()

const g24SelectorResultSchema = z
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
    route: z.enum(G24_SELECTOR_ROUTES),
    reasonCode: z.enum([
      'current_sufficient',
      'source_eligible',
      'one_human_fact_required',
      'tacit_interdependence',
      'insufficient_authority',
      'source_incapable',
      'unresolved_contradiction',
      'unknowable',
      'deadline',
      'budget',
      'no_material_effect',
      'invalid_input',
    ]),
    unresolvedGap: z.enum(['sufficient', 'gap', 'ambiguity', 'contradiction']).nullable(),
    unresolvedEvidenceRefs: z.array(z.string()),
    expectedMaterialEffect: z.string(),
    alternatives: z.array(g24SelectorAlternativeResultSchema),
    controlRootKeys: z.array(z.string()),
    controlManifestVersion: z.string(),
    applicableControlKeys: z.array(z.string()),
    controlGraphFingerprint: z.string(),
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
    challengerSearchBoundary: z.string().nullable(),
    controllingWatermarks: z.array(
      z.object({ key: z.string(), lineageId: z.string(), version: z.string() }).strict(),
    ),
    controllingFingerprint: z.string(),
    selectorFingerprint: z.string().optional(),
    expiry: z.string().nullable(),
    replanningTrigger: z.literal('controlling_change_or_expiry'),
    actionable: z.boolean(),
    provisionalDiagnostic: z.string().optional(),
  })
  .strict()

function g24StringArrayIsCanonicalNormalForm(value: readonly string[]): boolean {
  return (
    value.every(g24IdentifierIsCanonical) &&
    new Set(value).size === value.length &&
    value.every((entry, index) => index === 0 || compareText(value[index - 1], entry) <= 0)
  )
}

function g24SelectorResultSemanticShapeIsValid(value: unknown): value is G24SelectorResult {
  const parsed = g24SelectorResultSchema.safeParse(value)
  if (!parsed.success || !g24IsRecord(value)) return false
  const result = parsed.data
  const hasSelectorFingerprint = Object.prototype.hasOwnProperty.call(
    value,
    'selectorFingerprint',
  )
  const expectedKeys = [
    'selectorResultVersion',
    'currentCaseRef',
    'evidenceNamespace',
    'evidenceNamespaceCaseRef',
    'purposeRef',
    'audienceRef',
    'sensitivityRef',
    'acceptedDecisionFrameRef',
    'decisionRequirementRef',
    'evidenceCoverageRef',
    'route',
    'reasonCode',
    'unresolvedGap',
    'unresolvedEvidenceRefs',
    'expectedMaterialEffect',
    'alternatives',
    'controlRootKeys',
    'controlManifestVersion',
    'applicableControlKeys',
    'controlGraphFingerprint',
    'trustedEvaluation',
    'challengerResult',
    'challengerSearchBoundary',
    'controllingWatermarks',
    'controllingFingerprint',
    'expiry',
    'replanningTrigger',
    'actionable',
  ]
  if (hasSelectorFingerprint) expectedKeys.push('selectorFingerprint')
  if (Object.prototype.hasOwnProperty.call(value, 'provisionalDiagnostic')) {
    expectedKeys.push('provisionalDiagnostic')
  }
  if (!g24HasExactOwnKeys(value, expectedKeys)) return false

  const canonicalIds = [
    result.selectorResultVersion,
    result.currentCaseRef,
    result.evidenceNamespace,
    result.evidenceNamespaceCaseRef,
    result.purposeRef,
    result.audienceRef,
    result.sensitivityRef,
    result.acceptedDecisionFrameRef,
    result.decisionRequirementRef,
    result.evidenceCoverageRef,
    result.controlManifestVersion,
    result.trustedEvaluation.evaluationVersion,
    result.trustedEvaluation.decisionRequirementVersion,
    result.trustedEvaluation.evidenceCoverageVersion,
    result.trustedEvaluation.trustedCutoffVersion,
    result.trustedEvaluation.epistemicPolicyVersion,
    result.trustedEvaluation.independentChallengerResultVersion,
    result.trustedEvaluation.controlManifestVersion,
  ]
  if (!canonicalIds.every(g24IdentifierIsCanonical)) return false
  if (
    !g24FingerprintIsValid(result.controlGraphFingerprint) ||
    !g24FingerprintIsValid(result.controllingFingerprint) ||
    !g24FingerprintIsValid(result.trustedEvaluation.controlGraphFingerprint)
  ) {
    return false
  }
  if (
    result.evidenceNamespaceCaseRef !== result.currentCaseRef ||
    result.trustedEvaluation.controlManifestVersion !== result.controlManifestVersion ||
    result.trustedEvaluation.controlGraphFingerprint !== result.controlGraphFingerprint ||
    result.trustedEvaluation.challengerResult !== result.challengerResult ||
    result.trustedEvaluation.challengerSearchBoundary !== result.challengerSearchBoundary ||
    !g24IdentifierIsCanonical(result.trustedEvaluation.trustedAsOf) ||
    validDate(result.trustedEvaluation.trustedAsOf) === undefined ||
    (result.expiry !== null &&
      (!g24IdentifierIsCanonical(result.expiry) || validDate(result.expiry) === undefined)) ||
    (result.challengerSearchBoundary !== null &&
      !g24IdentifierIsCanonical(result.challengerSearchBoundary)) ||
    (result.challengerResult === 'none_found_within_declared_boundary' &&
      result.challengerSearchBoundary === null) ||
    (result.expiry !== null &&
      Date.parse(result.expiry) <= Date.parse(result.trustedEvaluation.trustedAsOf)) ||
    (result.route !== 'abstain_hold' && !result.expectedMaterialEffect.trim())
  ) {
    return false
  }
  const watermarksByKey = new Map(
    result.controllingWatermarks.map((watermark) => [watermark.key, watermark]),
  )
  if (
    result.trustedEvaluation.decisionRequirementVersion !==
      watermarksByKey.get('decision_requirement_version')?.version ||
    result.trustedEvaluation.evidenceCoverageVersion !==
      watermarksByKey.get('evidence_coverage_version')?.version ||
    result.trustedEvaluation.trustedCutoffVersion !==
      watermarksByKey.get('trusted_cutoff')?.version ||
    result.trustedEvaluation.epistemicPolicyVersion !==
      watermarksByKey.get('epistemic_policy_version')?.version ||
    result.trustedEvaluation.independentChallengerResultVersion !==
      watermarksByKey.get('independent_challenger_result_version')?.version
  ) {
    return false
  }
  const routeForReason: Record<G24SelectorReasonCode, G24SelectorRoute> = {
    current_sufficient: 'reuse',
    source_eligible: 'enrich',
    one_human_fact_required: 'ask',
    tacit_interdependence: 'session',
    insufficient_authority: 'abstain_hold',
    source_incapable: 'abstain_hold',
    unresolved_contradiction: 'abstain_hold',
    unknowable: 'abstain_hold',
    deadline: 'abstain_hold',
    budget: 'abstain_hold',
    no_material_effect: 'abstain_hold',
    invalid_input: 'abstain_hold',
  }
  if (
    routeForReason[result.reasonCode] !== result.route ||
    result.actionable !== (result.route !== 'abstain_hold') ||
    (result.challengerResult === 'indeterminate' && result.actionable) ||
    (result.actionable && Boolean(result.provisionalDiagnostic?.trim())) ||
    (result.route === 'reuse' &&
      (result.unresolvedGap !== null || result.unresolvedEvidenceRefs.length > 0)) ||
    (result.actionable &&
      result.route !== 'reuse' &&
      (result.unresolvedGap === null ||
        result.unresolvedGap === 'sufficient' ||
        result.unresolvedEvidenceRefs.length === 0))
  ) {
    return false
  }
  const selectedAlternative = result.alternatives.find(
    (alternative) => alternative.route === result.route,
  )
  if (result.actionable && (!selectedAlternative || !selectedAlternative.eligible)) return false
  if (
    !g24StringArrayIsCanonicalNormalForm(result.unresolvedEvidenceRefs) ||
    !g24StringArrayIsCanonicalNormalForm(result.controlRootKeys) ||
    !g24StringArrayIsCanonicalNormalForm(result.applicableControlKeys) ||
    !result.controlRootKeys.every((key) => result.applicableControlKeys.includes(key)) ||
    new Set(result.alternatives.map(({ route }) => route)).size !== result.alternatives.length ||
    result.alternatives.some(
      (alternative, index) =>
        (index > 0 &&
          ROUTE_ORDER.indexOf(result.alternatives[index - 1].route) >
            ROUTE_ORDER.indexOf(alternative.route)) ||
        !Number.isFinite(alternative.burden) ||
        alternative.burden < 0 ||
        Object.is(alternative.burden, -0) ||
        alternative.eligible !== (alternative.rejectionReasons.length === 0) ||
        !g24StringArrayIsCanonicalNormalForm(alternative.rejectionReasons),
    ) ||
    result.controllingWatermarks.some((watermark, index) =>
      index > 0
        ? compareText(result.controllingWatermarks[index - 1].key, watermark.key) >= 0
        : false,
    ) ||
    !result.controllingWatermarks.every(g24WatermarkIsStructurallyValid) ||
    fingerprintG24Watermarks(result.controllingWatermarks) !== result.controllingFingerprint
  ) {
    return false
  }
  if (result.actionable && result.route !== 'reuse') {
    const leastBurdenEligibleRoute = result.alternatives
      .filter(
        (alternative) =>
          alternative.eligible &&
          RESOLVING_ROUTE_ORDER.includes(alternative.route as G24ResolvingRoute),
      )
      .sort((left, right) => {
        if (left.burden !== right.burden) return left.burden - right.burden
        return (
          RESOLVING_ROUTE_ORDER.indexOf(left.route as G24ResolvingRoute) -
          RESOLVING_ROUTE_ORDER.indexOf(right.route as G24ResolvingRoute)
        )
      })[0]?.route
    if (leastBurdenEligibleRoute !== result.route) return false
  }
  return true
}

export function fingerprintG24SelectorResult(
  result: Omit<G24SelectorResult, 'selectorFingerprint'> | G24SelectorResult,
): string {
  try {
    const snapshot = snapshotG24PlainData(result)
    if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
    result = snapshot.value
    if (!g24SelectorResultSemanticShapeIsValid(result)) return G24_INVALID_FINGERPRINT
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
        burden: alternative.burden,
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
  } catch {
    return '__g24_invalid_nonplain_data__'
  }
}

function g24SelectorResultHasExactEnvelope(value: unknown): value is G24SelectorResult {
  if (!g24IsRecord(value)) return false
  const keys = [
    'selectorResultVersion',
    'currentCaseRef',
    'evidenceNamespace',
    'evidenceNamespaceCaseRef',
    'purposeRef',
    'audienceRef',
    'sensitivityRef',
    'acceptedDecisionFrameRef',
    'decisionRequirementRef',
    'evidenceCoverageRef',
    'route',
    'reasonCode',
    'unresolvedGap',
    'unresolvedEvidenceRefs',
    'expectedMaterialEffect',
    'alternatives',
    'controlRootKeys',
    'controlManifestVersion',
    'applicableControlKeys',
    'controlGraphFingerprint',
    'trustedEvaluation',
    'challengerResult',
    'challengerSearchBoundary',
    'controllingWatermarks',
    'controllingFingerprint',
    'selectorFingerprint',
    'expiry',
    'replanningTrigger',
    'actionable',
  ]
  if (Object.prototype.hasOwnProperty.call(value, 'provisionalDiagnostic')) {
    keys.push('provisionalDiagnostic')
  }
  return g24HasExactOwnKeys(value, keys)
}

const g24SelectorResultProofs = new WeakMap<G24SelectorResult, string>()

function g24SelectorResultProof(result: G24SelectorResult): string {
  return stringifyG24Data(result)
}

function transferG24SelectorResultProof(
  snapshot: Extract<G24PlainSnapshot<unknown>, { ok: true }>,
  result: G24SelectorResult,
): void {
  const source = g24SourceForOwned(snapshot, result)
  const proof = source ? g24SelectorResultProofs.get(source) : undefined
  if (proof === g24SelectorResultProof(result)) {
    g24SelectorResultProofs.set(result, proof)
  }
}

function g24SelectorResultIsExact(value: unknown): value is G24SelectorResult {
  if (!g24SelectorResultSemanticShapeIsValid(value)) return false
  const canonicalFields = [
    value.selectorResultVersion,
    value.currentCaseRef,
    value.evidenceNamespace,
    value.evidenceNamespaceCaseRef,
    value.purposeRef,
    value.audienceRef,
    value.sensitivityRef,
    value.acceptedDecisionFrameRef,
    value.decisionRequirementRef,
    value.evidenceCoverageRef,
    value.controlManifestVersion,
  ]
  if (!canonicalFields.every(g24IdentifierIsCanonical)) return false
  if (
    !g24FingerprintIsValid(value.selectorFingerprint) ||
    !g24FingerprintIsValid(value.controlGraphFingerprint) ||
    !g24FingerprintIsValid(value.controllingFingerprint)
  ) {
    return false
  }
  if (
    !g24IsStringArray(value.unresolvedEvidenceRefs) ||
    !value.unresolvedEvidenceRefs.every(g24IdentifierIsCanonical) ||
    !g24IsStringArray(value.controlRootKeys) ||
    !value.controlRootKeys.every(g24IdentifierIsCanonical) ||
    new Set(value.controlRootKeys).size !== value.controlRootKeys.length ||
    !g24IsStringArray(value.applicableControlKeys) ||
    !value.applicableControlKeys.every(g24IdentifierIsCanonical) ||
    new Set(value.applicableControlKeys).size !== value.applicableControlKeys.length ||
    !Array.isArray(value.controllingWatermarks) ||
    !value.controllingWatermarks.every(g24WatermarkIsStructurallyValid) ||
    new Set(value.controllingWatermarks.map(({ key }) => key)).size !==
      value.controllingWatermarks.length ||
    fingerprintG24Watermarks(value.controllingWatermarks) !== value.controllingFingerprint
  ) {
    return false
  }
  const computed = fingerprintG24SelectorResult(value as G24SelectorResult)
  return (
    g24FingerprintIsValid(computed) &&
    computed === value.selectorFingerprint &&
    g24SelectorResultProofs.get(value) === g24SelectorResultProof(value)
  )
}

function finalizeG24SelectorResult(
  result: Omit<G24SelectorResult, 'selectorFingerprint'> | G24SelectorResult,
): G24SelectorResult {
  const finalized = { ...result, selectorFingerprint: fingerprintG24SelectorResult(result) }
  if (g24FingerprintIsValid(finalized.selectorFingerprint)) {
    g24SelectorResultProofs.set(finalized, g24SelectorResultProof(finalized))
  }
  return finalized
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
    !Number.isFinite(candidate.burden) || candidate.burden < 0 || Object.is(candidate.burden, -0)
      ? 'invalid_burden'
      : '',
  ].filter(Boolean)
  const normalizedCandidateReasons = candidate.rejectionReasons
    .map((reason) => reason.trim())
    .filter(Boolean)
  const rejectionReasons = [
    ...new Set([...normalizedCandidateReasons, ...generatedReasons]),
  ].sort(compareText)
  return {
    route: candidate.route,
    eligible: rejectionReasons.length === 0,
    burden:
      Number.isFinite(candidate.burden) && candidate.burden >= 0
        && !Object.is(candidate.burden, -0)
        ? candidate.burden
        : Number.MAX_SAFE_INTEGER,
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
    .sort((left, right) => Date.parse(left) - Date.parse(right) || compareText(left, right))
  return expiries[0] ?? null
}

function heldSelectorResult(
  input: G24SelectorInput,
  closure: G24ControlClosure,
  reasonCode: G24SelectorReasonCode,
  diagnostic: string,
  alternatives: G24SelectorAlternative[],
): G24SelectorResult {
  const challengerBoundaryIsNormal =
    input.challengerSearchBoundary !== undefined &&
    g24IdentifierIsCanonical(input.challengerSearchBoundary) &&
    input.trustedEvaluation.challengerSearchBoundary === input.challengerSearchBoundary
  const challengerSearchBoundary = challengerBoundaryIsNormal
    ? input.challengerSearchBoundary ?? null
    : null
  const challengerResult =
    input.challengerResult === 'none_found_within_declared_boundary' &&
    challengerSearchBoundary === null
      ? 'indeterminate'
      : input.challengerResult
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
    trustedEvaluation: {
      ...structuredClone(input.trustedEvaluation),
      challengerResult,
      challengerSearchBoundary,
    },
    challengerResult,
    challengerSearchBoundary,
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
      inputSnapshot.value,
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
    !g24IdentifierIsCanonical(input.selectorResultVersion)
      ? 'selector_result_version_missing'
      : '',
    !g24IdentifierIsCanonical(input.currentCaseRef) ? 'current_case_ref_missing' : '',
    !g24IdentifierIsCanonical(input.evidenceNamespace) ? 'evidence_namespace_missing' : '',
    input.evidenceNamespaceCaseRef !== input.currentCaseRef
      ? 'evidence_namespace_case_mismatch'
      : '',
    !g24IdentifierIsCanonical(input.purposeRef) ? 'purpose_ref_missing' : '',
    !g24IdentifierIsCanonical(input.audienceRef) ? 'audience_ref_missing' : '',
    !g24IdentifierIsCanonical(input.sensitivityRef) ? 'sensitivity_ref_missing' : '',
    !g24IdentifierIsCanonical(input.acceptedDecisionFrameRef)
      ? 'accepted_decision_frame_ref_missing'
      : '',
    !g24IdentifierIsCanonical(input.decisionRequirementRef)
      ? 'decision_requirement_ref_missing'
      : '',
    !g24IdentifierIsCanonical(input.evidenceCoverageRef) ? 'evidence_coverage_ref_missing' : '',
    !g24IdentifierIsCanonical(input.controlManifest.manifestVersion)
      ? 'control_manifest_version_missing'
      : '',
    input.controlManifest.applicableControlKeys.length === 0
      ? 'applicable_control_manifest_empty'
      : '',
    new Set(input.controlManifest.applicableControlKeys).size !==
    input.controlManifest.applicableControlKeys.length
      ? 'duplicate_applicable_control_key'
      : '',
    new Set(input.controlRootKeys).size !== input.controlRootKeys.length
      ? 'duplicate_control_root_key'
      : '',
    new Set(input.unresolvedEvidenceRefs).size !== input.unresolvedEvidenceRefs.length
      ? 'duplicate_unresolved_evidence_ref'
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
    !g24IdentifierIsCanonical(input.trustedEvaluation.evaluationVersion)
      ? 'trusted_evaluation_version_missing'
      : '',
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
    input.challengerSearchBoundary !== undefined &&
    !g24IdentifierIsCanonical(input.challengerSearchBoundary)
      ? 'challenger_boundary_not_canonical'
      : '',
    input.trustedEvaluation.challengerSearchBoundary !== null &&
    !g24IdentifierIsCanonical(input.trustedEvaluation.challengerSearchBoundary)
      ? 'trusted_challenger_boundary_not_canonical'
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
    input.candidates.some(
      ({ rejectionReasons }) =>
        rejectionReasons.length !== new Set(rejectionReasons).size ||
        rejectionReasons.some((reason) => !g24IdentifierIsCanonical(reason)),
    )
      ? 'candidate_rejection_reasons_not_canonical'
      : '',
    input.candidates.some(({ burden }) => Object.is(burden, -0))
      ? 'candidate_burden_not_canonical'
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
const g24ApprovalReceiptFingerprintsById = new Map<string, string>()

function g24InterventionPayloadHasExactShape(
  payload: unknown,
): payload is G24QuestionPayload | G24SessionPayload {
  if (!g24IsRecord(payload) || (payload.kind !== 'question' && payload.kind !== 'session')) {
    return false
  }
  if (payload.kind === 'session') {
    return (
      g24HasExactOwnKeys(payload, [
        'kind',
        'exactAgenda',
        'leaderVisiblePurpose',
        'expectedEndState',
        'leaderCanDeclineRejectOrReframe',
        'noContactScheduleCaptureOrLearningAuthority',
      ]) &&
      g24IsStringArray(payload.exactAgenda) &&
      typeof payload.leaderVisiblePurpose === 'string' &&
      typeof payload.expectedEndState === 'string'
    )
  }
  if (
    !g24HasExactOwnKeys(payload, [
      'kind',
      'visibleWording',
      'renderedControlPayload',
      'answerGrammar',
      'optionsOrComparator',
      'scopedWriteIn',
      'honestExits',
      'materialEffectDisclosure',
      'visibleChangedConsequence',
      'visibleUnknownConsequence',
      'answerEffects',
    ]) ||
    typeof payload.visibleWording !== 'string' ||
    typeof payload.renderedControlPayload !== 'string' ||
    !g24IsStringArray(payload.optionsOrComparator) ||
    !g24IsStringArray(payload.honestExits) ||
    typeof payload.materialEffectDisclosure !== 'string' ||
    typeof payload.visibleChangedConsequence !== 'string' ||
    typeof payload.visibleUnknownConsequence !== 'string' ||
    !g24IsRecord(payload.answerEffects)
  ) {
    return false
  }
  return Object.values(payload.answerEffects).every(
    (effect) =>
      g24IsRecord(effect) &&
      g24HasExactOwnKeys(effect, [
        'caseEffect',
        'visibleConsequence',
        'retireInterventionRefs',
        'pendingHumanOwnedProposal',
      ]) &&
      typeof effect.visibleConsequence === 'string' &&
      g24IsStringArray(effect.retireInterventionRefs) &&
      (effect.pendingHumanOwnedProposal === null ||
        typeof effect.pendingHumanOwnedProposal === 'string'),
  )
}

function g24ApprovalReceiptHasExactShape(
  receipt: unknown,
): receipt is G24InterventionApprovalReceipt {
  return (
    g24IsRecord(receipt) &&
    g24HasExactOwnKeys(receipt, [
      'receiptId',
      'atomVersion',
      'selectorResultVersion',
      'selectorFingerprint',
      'payloadFingerprint',
      'approvedByRef',
      'approvalAuthorityVersionRef',
      'approvalFingerprint',
    ]) &&
    g24IdentifierIsCanonical(receipt.receiptId) &&
    g24IdentifierIsCanonical(receipt.atomVersion) &&
    g24IdentifierIsCanonical(receipt.selectorResultVersion) &&
    g24FingerprintIsValid(receipt.selectorFingerprint) &&
    g24FingerprintIsValid(receipt.payloadFingerprint) &&
    receipt.approvedByRef === 'krish' &&
    g24IdentifierIsCanonical(receipt.approvalAuthorityVersionRef) &&
    g24FingerprintIsValid(receipt.approvalFingerprint)
  )
}

function g24InterventionAtomHasExactShape(atom: unknown): atom is G24InterventionAtom {
  return (
    g24IsRecord(atom) &&
    g24HasExactOwnKeys(atom, [
      'atomVersion',
      'selectorResultVersion',
      'selectorFingerprint',
      'controlVersion',
      'purpose',
      'audience',
      'sensitivity',
      'channel',
      'timing',
      'decisionFrameVersion',
      'evidenceVersions',
      'payloadFingerprint',
      'approvalState',
      'approvalReceipt',
      'payload',
    ]) &&
    [
      atom.atomVersion,
      atom.selectorResultVersion,
      atom.controlVersion,
      atom.purpose,
      atom.audience,
      atom.sensitivity,
      atom.channel,
      atom.timing,
      atom.decisionFrameVersion,
    ].every(g24IdentifierIsCanonical) &&
    g24FingerprintIsValid(atom.selectorFingerprint) &&
    g24FingerprintIsValid(atom.payloadFingerprint) &&
    g24IsStringArray(atom.evidenceVersions) &&
    atom.evidenceVersions.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(atom.evidenceVersions) &&
    g24InterventionPayloadHasExactShape(atom.payload) &&
    (atom.approvalState === 'proposed' || atom.approvalState === 'approved') &&
    ((atom.approvalState === 'proposed' && atom.approvalReceipt === null) ||
      (atom.approvalState === 'approved' &&
        g24ApprovalReceiptHasExactShape(atom.approvalReceipt)))
  )
}

function g24ApprovedAtomProof(atom: G24InterventionAtom): string {
  return stringifyG24Data(atom)
}

export function fingerprintG24InterventionAtom(
  atom: Omit<G24InterventionAtom, 'payloadFingerprint' | 'approvalState' | 'approvalReceipt'>,
): string {
  try {
    const snapshot = snapshotG24PlainData(atom)
    if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
    atom = snapshot.value
    if (
      !g24HasExactOwnKeys(atom, [
        'atomVersion',
        'selectorResultVersion',
        'selectorFingerprint',
        'controlVersion',
        'purpose',
        'audience',
        'sensitivity',
        'channel',
        'timing',
        'decisionFrameVersion',
        'evidenceVersions',
        'payload',
      ]) ||
      !g24InterventionPayloadHasExactShape(atom.payload) ||
      ![
        atom.atomVersion,
        atom.selectorResultVersion,
        atom.controlVersion,
        atom.purpose,
        atom.audience,
        atom.sensitivity,
        atom.channel,
        atom.timing,
        atom.decisionFrameVersion,
      ].every(g24IdentifierIsCanonical) ||
      !g24FingerprintIsValid(atom.selectorFingerprint) ||
      !g24IsStringArray(atom.evidenceVersions) ||
      atom.evidenceVersions.length === 0 ||
      !g24StringArrayIsCanonicalNormalForm(atom.evidenceVersions)
    ) {
      return G24_INVALID_FINGERPRINT
    }
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
      evidenceVersions: atom.evidenceVersions,
      payload: atom.payload,
    })
  } catch {
    return '__g24_invalid_nonplain_data__'
  }
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
  transferG24SelectorResultProof(selectorSnapshot, selectorSnapshot.value)
  selector = selectorSnapshot.value
  atom = atomSnapshot.value
  if (!g24SelectorResultIsExact(selector)) {
    throw new Error('intervention_atom_selector_invalid')
  }
  if (
    !g24HasExactOwnKeys(atom, [
      'atomVersion',
      'controlVersion',
      'purpose',
      'audience',
      'sensitivity',
      'channel',
      'timing',
      'decisionFrameVersion',
      'evidenceVersions',
      'payload',
    ]) ||
    !g24IsStringArray(atom.evidenceVersions) ||
    !g24InterventionPayloadHasExactShape(atom.payload)
  ) {
    throw new Error('intervention_atom_shape_invalid')
  }
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
    !g24IdentifierIsCanonical(atom.atomVersion) ||
    !g24IdentifierIsCanonical(atom.controlVersion) ||
    !g24IdentifierIsCanonical(atom.purpose) ||
    !g24IdentifierIsCanonical(atom.audience) ||
    !g24IdentifierIsCanonical(atom.sensitivity) ||
    !g24IdentifierIsCanonical(atom.channel) ||
    !g24IdentifierIsCanonical(atom.timing) ||
    !g24IdentifierIsCanonical(atom.decisionFrameVersion) ||
    atom.evidenceVersions.length === 0 ||
    atom.evidenceVersions.some((version) => !g24IdentifierIsCanonical(version)) ||
    new Set(atom.evidenceVersions).size !== atom.evidenceVersions.length
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
    atom.evidenceVersions.some((version) => !g24IdentifierIsCanonical(version))
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
    !g24IsStringArray(atom.payload.exactAgenda) ||
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
    evidenceVersions: [...atom.evidenceVersions].sort(compareText),
    selectorResultVersion: selector.selectorResultVersion,
    selectorFingerprint: selector.selectorFingerprint,
  }
  const payloadFingerprint = fingerprintG24InterventionAtom(withoutFingerprint)
  if (!g24FingerprintIsValid(payloadFingerprint)) {
    throw new Error('intervention_atom_fingerprint_invalid')
  }
  return {
    ...withoutFingerprint,
    payloadFingerprint,
    approvalState: 'proposed',
    approvalReceipt: null,
  }
}

export function validateG24InterventionAtom(atom: G24InterventionAtom): string[] {
  const atomSnapshot = snapshotG24PlainData(atom)
  if (!atomSnapshot.ok) return ['intervention_atom_nonplain_data']
  atom = atomSnapshot.value
  if (!g24InterventionAtomHasExactShape(atom)) return ['intervention_atom_invalid_shape']
  const {
    payloadFingerprint: _payloadFingerprint,
    approvalState: _approvalState,
    approvalReceipt: _approvalReceipt,
    ...content
  } = atom
  const expected = fingerprintG24InterventionAtom(content)
  return g24FingerprintIsValid(expected) && expected === atom.payloadFingerprint
    ? []
    : ['intervention_payload_changed_without_new_version']
}

function fingerprintG24ApprovalReceipt(
  receipt: Omit<G24InterventionApprovalReceipt, 'approvalFingerprint'>,
): string {
  if (
    !g24IsRecord(receipt) ||
    !g24HasExactOwnKeys(receipt, [
      'receiptId',
      'atomVersion',
      'selectorResultVersion',
      'selectorFingerprint',
      'payloadFingerprint',
      'approvedByRef',
      'approvalAuthorityVersionRef',
    ])
  ) {
    return G24_INVALID_FINGERPRINT
  }
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
  transferG24SelectorResultProof(selectorSnapshot, currentSelector)
  if (
    !g24InterventionAtomHasExactShape(atom) ||
    !g24IsRecord(currentSelector) ||
    !Array.isArray(currentSelector.controllingWatermarks) ||
    !g24SelectorResultHasExactEnvelope(currentSelector) ||
    !currentSelector.controllingWatermarks.every(g24WatermarkIsStructurallyValid) ||
    !g24HasExactOwnKeys(binding, [
      'atomVersion',
      'controlVersion',
      'purpose',
      'audience',
      'channel',
      'timing',
      'decisionFrameVersion',
      'evidenceVersions',
      'payloadFingerprint',
      'sensitivity',
      'approvalReceiptId',
      'approvedByRef',
      'approvalAuthorityVersionRef',
    ]) ||
    !g24IsStringArray(binding.evidenceVersions) ||
    !g24StringArrayIsCanonicalNormalForm(binding.evidenceVersions)
  ) {
    throw new Error('intervention_approval_shape_invalid')
  }
  const currentAuthorityWatermark = currentSelector.controllingWatermarks.find(
    ({ key }) => key === 'authority_version',
  )
  const bindingMatches =
    g24SelectorResultIsExact(currentSelector) &&
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
    binding.evidenceVersions.length === atom.evidenceVersions.length &&
    binding.evidenceVersions.every(
      (version, index) => version === atom.evidenceVersions[index],
    ) &&
    binding.payloadFingerprint === atom.payloadFingerprint &&
    g24IdentifierIsCanonical(binding.approvalReceiptId) &&
    binding.approvedByRef === 'krish' &&
    g24IdentifierIsCanonical(binding.approvalAuthorityVersionRef) &&
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
  const approvalFingerprint = fingerprintG24ApprovalReceipt(receiptWithoutFingerprint)
  if (!g24FingerprintIsValid(approvalFingerprint)) {
    throw new Error('intervention_approval_fingerprint_invalid')
  }
  const priorApprovalFingerprint = g24ApprovalReceiptFingerprintsById.get(
    binding.approvalReceiptId,
  )
  if (priorApprovalFingerprint && priorApprovalFingerprint !== approvalFingerprint) {
    throw new Error('intervention_approval_receipt_id_collision')
  }
  g24ApprovalReceiptFingerprintsById.set(binding.approvalReceiptId, approvalFingerprint)
  const approved: G24InterventionAtom = {
    ...structuredClone(atom),
    approvalState: 'approved',
    approvalReceipt: {
      ...receiptWithoutFingerprint,
      approvalFingerprint,
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

function g24AnswerReceiptHasExactShape(receipt: unknown): receipt is G24AnswerReceipt {
  if (
    !g24IsRecord(receipt) ||
    !g24HasExactOwnKeys(receipt, [
      'receiptId',
      'atomVersion',
      'interventionFingerprint',
      'approvalReceiptId',
      'approvalFingerprint',
      'approvalAuthorityVersionRef',
      'answerKind',
      'value',
      'immutableCaseEvidence',
      'caseEffect',
      'pendingHumanOwnedProposal',
      'retiredInterventionRefs',
      'visibleConsequence',
      'automaticReaskPressure',
      'automaticSessionEscalation',
    ]) ||
    ![
      receipt.receiptId,
      receipt.atomVersion,
      receipt.approvalReceiptId,
      receipt.approvalAuthorityVersionRef,
      receipt.visibleConsequence,
    ].every(g24IdentifierIsCanonical) ||
    !g24FingerprintIsValid(receipt.interventionFingerprint) ||
    !g24FingerprintIsValid(receipt.approvalFingerprint) ||
    typeof receipt.answerKind !== 'string' ||
    !G24_ANSWER_KINDS.includes(receipt.answerKind as G24AnswerKind) ||
    receipt.immutableCaseEvidence !== true ||
    (receipt.caseEffect !== 'rebuild_required' && receipt.caseEffect !== 'no_case_change') ||
    (receipt.pendingHumanOwnedProposal !== null &&
      !g24IdentifierIsCanonical(receipt.pendingHumanOwnedProposal)) ||
    !g24IsStringArray(receipt.retiredInterventionRefs) ||
    !g24StringArrayIsCanonicalNormalForm(receipt.retiredInterventionRefs) ||
    receipt.automaticReaskPressure !== false ||
    receipt.automaticSessionEscalation !== false
  ) {
    return false
  }
  if (receipt.value === null) return true
  if (typeof receipt.value === 'string') return g24IdentifierIsCanonical(receipt.value)
  return (
    g24IsStringArray(receipt.value) &&
    receipt.value.every(g24IdentifierIsCanonical) &&
    new Set(receipt.value).size === receipt.value.length
  )
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
  if (priorReceipts === undefined) throw new Error('answer_receipt_ledger_required')
  const atomSnapshot = snapshotG24PlainData(atom)
  const answerSnapshot = snapshotG24PlainData(answer)
  const ledgerSnapshot = snapshotG24PlainData(priorReceipts)
  if (!atomSnapshot.ok || !answerSnapshot.ok || !ledgerSnapshot.ok) {
    throw new Error('answer_requires_plain_data')
  }
  if (!g24IsRecord(answerSnapshot.value)) throw new Error('answer_shape_invalid')
  const answerKeys = ['receiptId', 'kind']
  if (Object.prototype.hasOwnProperty.call(answerSnapshot.value, 'value')) {
    answerKeys.push('value')
  }
  if (!g24HasExactOwnKeys(answerSnapshot.value, answerKeys)) {
    throw new Error('answer_shape_invalid')
  }
  if (!Array.isArray(ledgerSnapshot.value)) throw new Error('answer_receipt_ledger_required')
  if (!g24InterventionAtomHasExactShape(atomSnapshot.value)) {
    throw new Error('answer_requires_current_exact_atom')
  }
  if (!ledgerSnapshot.value.every(g24AnswerReceiptHasExactShape)) {
    throw new Error('answer_receipt_ledger_invalid')
  }
  const atomSource = g24SourceForOwned(atomSnapshot, atomSnapshot.value)
  const atomProof = atomSource ? g24ApprovedAtomProofs.get(atomSource) : undefined
  if (atomProof === g24ApprovedAtomProof(atomSnapshot.value)) {
    g24ApprovedAtomProofs.set(atomSnapshot.value, atomProof)
  }
  ledgerSnapshot.value.forEach((receipt) => {
    const source = g24SourceForOwned(ledgerSnapshot, receipt)
    const proof = source ? g24AnswerReceiptProofs.get(source) : undefined
    if (proof === fingerprintG24AnswerReceipt(receipt)) {
      g24AnswerReceiptProofs.set(receipt, proof)
    }
  })
  atom = atomSnapshot.value
  answer = answerSnapshot.value
  priorReceipts = ledgerSnapshot.value
  const priorReceiptIds = priorReceipts.map(({ receiptId }) => receiptId)
  if (
    priorReceipts.some(
      (receipt) =>
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

function g24AnswerCorrectionReceiptHasExactShape(
  receipt: unknown,
): receipt is G24AnswerCorrectionReceipt {
  return (
    g24IsRecord(receipt) &&
    g24HasExactOwnKeys(receipt, [
      'receiptId',
      'idempotencyKey',
      'atomVersion',
      'correctsAnswerReceiptId',
      'originalAnswerFingerprint',
      'replacementAnswerReceiptId',
      'replacementAnswerFingerprint',
      'dependencyGraphVersion',
      'dependencyGraphFingerprint',
      'retiredDerivativeRefs',
      'affectedDecisionRefs',
      'rebuildRequired',
    ]) &&
    [
      receipt.receiptId,
      receipt.idempotencyKey,
      receipt.atomVersion,
      receipt.correctsAnswerReceiptId,
      receipt.replacementAnswerReceiptId,
      receipt.dependencyGraphVersion,
    ].every(g24IdentifierIsCanonical) &&
    g24FingerprintIsValid(receipt.originalAnswerFingerprint) &&
    g24FingerprintIsValid(receipt.replacementAnswerFingerprint) &&
    g24FingerprintIsValid(receipt.dependencyGraphFingerprint) &&
    g24IsStringArray(receipt.retiredDerivativeRefs) &&
    g24StringArrayIsCanonicalNormalForm(receipt.retiredDerivativeRefs) &&
    g24IsStringArray(receipt.affectedDecisionRefs) &&
    g24StringArrayIsCanonicalNormalForm(receipt.affectedDecisionRefs) &&
    receipt.rebuildRequired === true
  )
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
    !g24IsRecord(graph) ||
    !g24HasExactOwnKeys(graph, [
      'graphVersion',
      'derivativeDependencies',
      'decisionDependencies',
    ]) ||
    !g24IdentifierIsCanonical(graph.graphVersion)
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
  const originalSnapshot = snapshotG24PlainData(original)
  const replacementSnapshot = snapshotG24PlainData(replacement)
  const detailsSnapshot = snapshotG24PlainData(details)
  if (!originalSnapshot.ok || !replacementSnapshot.ok || !detailsSnapshot.ok) {
    throw new Error('correction_requires_plain_data')
  }
  if (
    !g24IsRecord(detailsSnapshot.value) ||
    !g24HasExactOwnKeys(detailsSnapshot.value, [
      'receiptId',
      'idempotencyKey',
      'dependencyGraph',
      'priorCorrections',
    ])
  ) {
    throw new Error('correction_shape_invalid')
  }
  if (!Array.isArray(detailsSnapshot.value.priorCorrections)) {
    throw new Error('correction_receipt_ledger_required')
  }
  if (!g24AnswerReceiptHasExactShape(originalSnapshot.value)) {
    throw new Error('replacement_answer_approval_mismatch')
  }
  if (!g24AnswerReceiptHasExactShape(replacementSnapshot.value)) {
    throw new Error('replacement_answer_approval_mismatch')
  }
  if (!detailsSnapshot.value.priorCorrections.every(g24AnswerCorrectionReceiptHasExactShape)) {
    throw new Error('correction_receipt_ledger_invalid')
  }
  const originalSource = g24SourceForOwned(originalSnapshot, originalSnapshot.value)
  const originalProof = originalSource ? g24AnswerReceiptProofs.get(originalSource) : undefined
  if (originalProof === fingerprintG24AnswerReceipt(originalSnapshot.value)) {
    g24AnswerReceiptProofs.set(originalSnapshot.value, originalProof)
  }
  const replacementSource = g24SourceForOwned(replacementSnapshot, replacementSnapshot.value)
  const replacementProof = replacementSource
    ? g24AnswerReceiptProofs.get(replacementSource)
    : undefined
  if (replacementProof === fingerprintG24AnswerReceipt(replacementSnapshot.value)) {
    g24AnswerReceiptProofs.set(replacementSnapshot.value, replacementProof)
  }
  detailsSnapshot.value.priorCorrections.forEach((receipt) => {
    const source = g24SourceForOwned(detailsSnapshot, receipt)
    const proof = source ? g24AnswerCorrectionReceiptProofs.get(source) : undefined
    if (proof === fingerprintG24AnswerCorrectionReceipt(receipt)) {
      g24AnswerCorrectionReceiptProofs.set(receipt, proof)
    }
  })
  original = originalSnapshot.value
  replacement = replacementSnapshot.value
  details = detailsSnapshot.value
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
  try {
    const snapshot = snapshotG24PlainData(projection)
    if (!snapshot.ok) return '__g24_invalid_nonplain_data__'
    projection = snapshot.value
    const sortedStringRecord = (record: Record<string, string>) =>
      Object.entries(record).sort(([left], [right]) => compareText(left, right))
    const sortedArrayRecord = <T>(
      record: Record<string, T[]>,
      sortItem: (left: T, right: T) => number,
    ) =>
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
  } catch {
    return '__g24_invalid_nonplain_data__'
  }
}

export interface G24ReleaseCompileResult {
  projection: G24PendingReleaseProjection | null
  errors: string[]
}

const g24ReleaseProjectionFingerprintsByVersion = new Map<string, string>()

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
  try {
    const inputSnapshot = snapshotG24PlainData(input)
    if (!inputSnapshot.ok) {
      return { projection: null, errors: ['release_compile_requires_plain_data'] }
    }
    input = inputSnapshot.value
    if (Array.isArray(input.selectorResults)) {
      input.selectorResults.forEach((selector) =>
        transferG24SelectorResultProof(inputSnapshot, selector),
      )
    }
    if (
      !g24HasExactOwnKeys(input, [
        'projectionVersion',
        'purpose',
        'audience',
        'selectorResults',
        'controls',
        'trustedAsOf',
        'includedCanonicalSourceVersions',
        'includedCanonicalBrainVersions',
      ]) ||
      typeof input.projectionVersion !== 'string' ||
      typeof input.purpose !== 'string' ||
      typeof input.audience !== 'string' ||
      !Array.isArray(input.selectorResults) ||
      !g24ControlRegistryIsStructurallyValid(input.controls) ||
      typeof input.trustedAsOf !== 'string' ||
      !g24IsStringArray(input.includedCanonicalSourceVersions) ||
      !g24IsStringArray(input.includedCanonicalBrainVersions)
    ) {
      return { projection: null, errors: ['release_compile_shape_invalid'] }
    }
    const errors: string[] = []
    const merged = new Map<string, G24ControlWatermark>()
    const selectorControlRoots = Object.create(null) as Record<string, string[]>
    const selectorControlManifests = Object.create(null) as Record<string, G24ControlManifest>
    const selectorResultFingerprints = Object.create(null) as Record<string, string>
    const selectorControllingWatermarks = Object.create(null) as Record<
      string,
      G24ControlWatermark[]
    >
  const selectorVersions = input.selectorResults.map(({ selectorResultVersion }) =>
    selectorResultVersion.trim(),
  )
  if (new Set(selectorVersions).size !== selectorVersions.length) {
    errors.push('selector_result_versions_must_be_unique')
  }

  for (const selector of input.selectorResults) {
    if (!g24SelectorResultIsExact(selector)) {
      errors.push('selector_result_invalid')
    }
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
    if (selector.expiry !== earliestExpiry(closure.watermarks, input.controls)) {
      errors.push(`${selector.selectorResultVersion}:selector_expiry_changed`)
    }
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
    if (!g24IdentifierIsCanonical(selector.selectorResultVersion)) {
      errors.push('selector_result_version_required')
    }
    if (!g24IdentifierIsCanonical(selector.selectorFingerprint)) {
      errors.push(`${selector.selectorResultVersion}:selector_fingerprint_required`)
    }
    if (!g24IdentifierIsCanonical(selector.controlManifestVersion)) {
      errors.push(`${selector.selectorResultVersion}:control_manifest_version_required`)
    }
    if (!g24IdentifierIsCanonical(selector.controlGraphFingerprint)) {
      errors.push(`${selector.selectorResultVersion}:control_graph_fingerprint_required`)
    }
    if (selector.audienceRef !== input.audience) {
      errors.push(`${selector.selectorResultVersion}:selector_release_audience_mismatch`)
    }
    if (selector.purposeRef !== input.purpose) {
      errors.push(`${selector.selectorResultVersion}:selector_release_purpose_mismatch`)
    }
    g24SetOwn(selectorControlRoots, selector.selectorResultVersion, closure.roots)
    g24SetOwn(selectorControlManifests, selector.selectorResultVersion, {
      manifestVersion: selector.controlManifestVersion,
      applicableControlKeys: [...selector.applicableControlKeys].sort(compareText),
      graphFingerprint: selector.controlGraphFingerprint,
    })
    g24SetOwn(
      selectorResultFingerprints,
      selector.selectorResultVersion,
      selector.selectorFingerprint,
    )
    g24SetOwn(
      selectorControllingWatermarks,
      selector.selectorResultVersion,
      closure.watermarks,
    )
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
  if (!g24IdentifierIsCanonical(input.projectionVersion)) errors.push('projection_version_required')
  if (!g24IdentifierIsCanonical(input.purpose)) errors.push('purpose_required')
  if (!g24IdentifierIsCanonical(input.audience)) errors.push('audience_required')
  if (
    input.includedCanonicalSourceVersions.length === 0 ||
    input.includedCanonicalSourceVersions.some(
      (version) => !g24IdentifierIsCanonical(version),
    ) ||
    new Set(input.includedCanonicalSourceVersions).size !==
      input.includedCanonicalSourceVersions.length
  ) {
    errors.push('canonical_source_version_required')
  }
  if (
    input.includedCanonicalBrainVersions.length === 0 ||
    input.includedCanonicalBrainVersions.some(
      (version) => !g24IdentifierIsCanonical(version),
    ) ||
    new Set(input.includedCanonicalBrainVersions).size !==
      input.includedCanonicalBrainVersions.length
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
      selectorControlRoots: Object.fromEntries(
        Object.entries(selectorControlRoots).sort(([left], [right]) =>
          compareText(left, right),
        ),
      ),
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
  const projection: G24PendingReleaseProjection = {
      ...projectionWithoutFingerprint,
      projectionFingerprint: fingerprintG24PendingReleaseProjection(projectionWithoutFingerprint),
  }
  if (projection.projectionFingerprint === '__g24_invalid_nonplain_data__') {
    return { projection: null, errors: ['release_projection_fingerprint_invalid'] }
  }
  const priorProjectionFingerprint = g24ReleaseProjectionFingerprintsByVersion.get(
    projection.projectionVersion,
  )
  if (
    priorProjectionFingerprint &&
    priorProjectionFingerprint !== projection.projectionFingerprint
  ) {
    return { projection: null, errors: ['release_projection_version_collision'] }
  }
  g24ReleaseProjectionFingerprintsByVersion.set(
    projection.projectionVersion,
    projection.projectionFingerprint,
  )
  return { projection, errors: [] }
  } catch {
    return { projection: null, errors: ['release_compile_shape_invalid'] }
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
  projectionFingerprint: string
  observedControlStateFingerprint: string
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

const g24ReleaseInvalidationReceiptFingerprintsById = new Map<string, string>()

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
      ([key, entry]) => g24IdentifierIsCanonical(key) && g24IdentifierIsCanonical(entry),
    )
  )
}

function g24WatermarkIsStructurallyValid(value: unknown): value is G24ControlWatermark {
  return (
    g24IsRecord(value) &&
    g24HasExactOwnKeys(value, ['key', 'lineageId', 'version']) &&
    g24IdentifierIsCanonical(value.key) &&
    g24IdentifierIsCanonical(value.lineageId) &&
    g24IdentifierIsCanonical(value.version)
  )
}

function g24ControlManifestIsStructurallyValid(value: unknown): value is G24ControlManifest {
  return (
    g24IsRecord(value) &&
    g24HasExactOwnKeys(value, ['manifestVersion', 'applicableControlKeys', 'graphFingerprint']) &&
    g24IdentifierIsCanonical(value.manifestVersion) &&
    g24IsStringArray(value.applicableControlKeys) &&
    value.applicableControlKeys.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(value.applicableControlKeys) &&
    g24FingerprintIsValid(value.graphFingerprint)
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
      g24IdentifierIsCanonical(entry.key) &&
      g24IdentifierIsCanonical(entry.lineageId) &&
      g24IdentifierIsCanonical(entry.version) &&
      (['current', 'unknown', 'mismatched', 'invalid', 'indeterminate'] as unknown[]).includes(
        entry.state,
      ) &&
      g24IsStringArray(entry.dependencies) &&
      entry.dependencies.every(g24IdentifierIsCanonical) &&
      (!Object.prototype.hasOwnProperty.call(entry, 'validFrom') ||
        (g24IdentifierIsCanonical(entry.validFrom) && validDate(entry.validFrom) !== undefined)) &&
      (!Object.prototype.hasOwnProperty.call(entry, 'validUntil') ||
        (g24IdentifierIsCanonical(entry.validUntil) && validDate(entry.validUntil) !== undefined))
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
  const selectorVersions = g24IsStringArray(value.selectorResultVersions)
    ? value.selectorResultVersions
    : []
  const selectorVersionSet = new Set(selectorVersions)
  const canonicalSources = g24IsStringArray(value.includedCanonicalSourceVersions)
    ? value.includedCanonicalSourceVersions
    : []
  const canonicalBrains = g24IsStringArray(value.includedCanonicalBrainVersions)
    ? value.includedCanonicalBrainVersions
    : []
  const topWatermarks = Array.isArray(value.controllingWatermarks)
    ? value.controllingWatermarks
    : []
  const selectorFingerprintsAreValid =
    g24IsStringRecord(value.selectorResultFingerprints) &&
    Object.values(value.selectorResultFingerprints).every(g24FingerprintIsValid)
  const selectorRootsAreCanonicalAndUnique =
    g24IsRecord(value.selectorControlRoots) &&
    Object.values(value.selectorControlRoots).every(
      (roots) => g24IsStringArray(roots) && g24StringArrayIsCanonicalNormalForm(roots),
    )
  const selectorWatermarksAreCanonicalAndUnique =
    g24IsRecord(value.selectorControllingWatermarks) &&
    Object.values(value.selectorControllingWatermarks).every(
      (watermarks) =>
        Array.isArray(watermarks) &&
        watermarks.every(g24WatermarkIsStructurallyValid) &&
        watermarks.every((watermark, index) =>
          index === 0 ? true : compareText(watermarks[index - 1].key, watermark.key) < 0,
        ),
    )
  return (
    g24IdentifierIsCanonical(value.projectionVersion) &&
    g24FingerprintIsValid(value.projectionFingerprint) &&
    g24IdentifierIsCanonical(value.purpose) &&
    g24IdentifierIsCanonical(value.audience) &&
    selectorVersions.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(selectorVersions) &&
    selectorVersionSet.size === selectorVersions.length &&
    selectorFingerprintsAreValid &&
    selectorRootsAreCanonicalAndUnique &&
    g24IsRecord(value.selectorControlManifests) &&
    Object.values(value.selectorControlManifests).every(g24ControlManifestIsStructurallyValid) &&
    selectorWatermarksAreCanonicalAndUnique &&
    topWatermarks.every(g24WatermarkIsStructurallyValid) &&
    topWatermarks.every((watermark, index) =>
      index === 0 ? true : compareText(topWatermarks[index - 1].key, watermark.key) < 0,
    ) &&
    g24FingerprintIsValid(value.controllingFingerprint) &&
    fingerprintG24Watermarks(topWatermarks) === value.controllingFingerprint &&
    canonicalSources.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(canonicalSources) &&
    canonicalBrains.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(canonicalBrains)
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
    g24IdentifierIsCanonical(value.authorityVersion) &&
    g24IdentifierIsCanonical(value.authorityControlVersion) &&
    value.actor === 'named_leader' &&
    g24IdentifierIsCanonical(value.projectionVersion) &&
    g24FingerprintIsValid(value.projectionFingerprint) &&
    g24IdentifierIsCanonical(value.purpose) &&
    g24IdentifierIsCanonical(value.audience) &&
    g24IsStringArray(value.selectorResultVersions) &&
    value.selectorResultVersions.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(value.selectorResultVersions) &&
    g24IsStringRecord(value.selectorResultFingerprints) &&
    Object.values(value.selectorResultFingerprints).every(g24FingerprintIsValid) &&
    g24FingerprintIsValid(value.controllingFingerprint) &&
    g24IsStringArray(value.includedCanonicalSourceVersions) &&
    value.includedCanonicalSourceVersions.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(value.includedCanonicalSourceVersions) &&
    g24IsStringArray(value.includedCanonicalBrainVersions) &&
    value.includedCanonicalBrainVersions.length > 0 &&
    g24StringArrayIsCanonicalNormalForm(value.includedCanonicalBrainVersions)
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

function fingerprintG24ObservedReleaseControlState(
  projection: G24PendingReleaseProjection,
  controls: G24ControlRegistry,
  trustedAsOf: string,
): string {
  const relevantKeys = new Set([
    ...Object.values(projection.selectorControlRoots).flat(),
    ...Object.values(projection.selectorControlManifests).flatMap(
      ({ applicableControlKeys }) => applicableControlKeys,
    ),
  ])
  const pending = [...relevantKeys]
  while (pending.length > 0) {
    const key = pending.pop()
    if (!key) continue
    const control = Object.prototype.hasOwnProperty.call(controls, key)
      ? controls[key]
      : undefined
    if (!control) continue
    for (const dependency of control.dependencies) {
      if (relevantKeys.has(dependency)) continue
      relevantKeys.add(dependency)
      pending.push(dependency)
    }
  }
  const applicableKeys = [...relevantKeys].sort(compareText)
  return stringifyG24Data({
    trustedAsOf,
    controls: applicableKeys.map((key) => {
      const control = Object.prototype.hasOwnProperty.call(controls, key)
        ? controls[key]
        : undefined
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
  })
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
  if (
    g24ReleaseProjectionFingerprintsByVersion.get(input.projection.projectionVersion) !==
    input.projection.projectionFingerprint
  ) {
    stateErrors.push('release_projection_not_issued')
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
  if (stateErrors.length > 0 || validDate(input.trustedAsOf) === undefined) {
    return { eligible: false, reason: 'controlling_state_invalid', receipt: null }
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
    if (!g24IdentifierIsCanonical(input.receiptId)) {
      return {
        eligible: false,
        reason: 'invalidation_receipt_identity_invalid',
        receipt: null,
      }
    }
    const receipt: G24ReleaseInvalidationReceipt = {
      receiptId: input.receiptId,
      projectionVersion: input.projection.projectionVersion,
      projectionFingerprint: input.projection.projectionFingerprint,
      observedControlStateFingerprint: fingerprintG24ObservedReleaseControlState(
        input.projection,
        input.controls,
        input.trustedAsOf,
      ),
      changedControls,
      appendOnly: true,
      approvalCreated: false,
      deliveryCreated: false,
      externalSideEffectCreated: false,
    }
    const receiptFingerprint = stringifyG24Data(receipt)
    const priorReceiptFingerprint = g24ReleaseInvalidationReceiptFingerprintsById.get(
      receipt.receiptId,
    )
    if (priorReceiptFingerprint && priorReceiptFingerprint !== receiptFingerprint) {
      return {
        eligible: false,
        reason: 'invalidation_receipt_identity_invalid',
        receipt: null,
      }
    }
    g24ReleaseInvalidationReceiptFingerprintsById.set(
      receipt.receiptId,
      receiptFingerprint,
    )
    return {
      eligible: false,
      reason: stateErrors.length > 0 ? 'controlling_state_invalid' : 'controlling_watermark_changed',
      receipt,
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
  return g24IdentifierIsCanonical(value)
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
    ]) ||
    !Array.isArray(snapshotCopy.value.receipts) ||
    !Array.isArray(requestCopy.value.actorRefs) ||
    !Array.isArray(requestCopy.value.preconditionEvidenceRefs)
  ) {
    return { accepted: false, reason: 'lifecycle_envelope_unknown_fields', snapshot: snapshotCopy.value }
  }
  snapshotCopy.value.receipts.forEach((receipt) => {
    const source = g24SourceForOwned(snapshotCopy, receipt)
    const proof = source ? g24LifecycleReceiptProofs.get(source) : undefined
    if (proof === fingerprintG24LifecycleReceipt(receipt)) {
      g24LifecycleReceiptProofs.set(receipt, proof)
    }
  })
  const snapshotSource = g24SourceForOwned(snapshotCopy, snapshotCopy.value)
  const snapshotProof = snapshotSource
    ? g24LifecycleSnapshotProofs.get(snapshotSource)
    : undefined
  if (snapshotProof === fingerprintG24LifecycleSnapshot(snapshotCopy.value)) {
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

function g24ReceiptTextContainsControl(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0
    if (
      codePoint <= 0x1f ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      codePoint === 0x2028 ||
      codePoint === 0x2029 ||
      /\p{Cf}/u.test(character)
    ) {
      return true
    }
  }
  return false
}

export function renderG24SelectorReceipt(result: G24SelectorResult): string {
  try {
    const snapshot = snapshotG24PlainData(result)
    if (!snapshot.ok) return 'Standing: held with no action'
    result = snapshot.value
    transferG24SelectorResultProof(snapshot, result)
    if (!g24SelectorResultIsExact(result)) return 'Standing: held with no action'
    if (
      [
        result.expectedMaterialEffect,
        result.unresolvedGap ?? '',
        ...result.unresolvedEvidenceRefs,
      ].some(g24ReceiptTextContainsControl)
    ) {
      return 'Standing: held with no action'
    }
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
  } catch {
    return 'Standing: held with no action'
  }
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
  plan: unknown,
): string {
  try {
    const snapshot = snapshotG24PlainData(plan)
    if (!snapshot.ok || !g24IsRecord(snapshot.value)) return G24_INVALID_FINGERPRINT
    const value = snapshot.value
    const withoutFingerprint = [
      'planVersion',
      'selectorResultVersion',
      'selectorFingerprint',
      'maximumWallClockMs',
      'maximumAttempts',
    ]
    const keys = Object.prototype.hasOwnProperty.call(value, 'planFingerprint')
      ? [...withoutFingerprint, 'planFingerprint']
      : withoutFingerprint
    if (
      !g24HasExactOwnKeys(value, keys) ||
      !g24IdentifierIsCanonical(value.planVersion) ||
      !g24IdentifierIsCanonical(value.selectorResultVersion) ||
      !g24FingerprintIsValid(value.selectorFingerprint) ||
      !Number.isFinite(value.maximumWallClockMs) ||
      (value.maximumWallClockMs as number) <= 0 ||
      !Number.isInteger(value.maximumAttempts) ||
      (value.maximumAttempts as number) <= 0 ||
      (value.maximumAttempts as number) > G24_MAX_ENRICHMENT_ATTEMPTS ||
      (keys.length === 6 && !g24FingerprintIsValid(value.planFingerprint))
    ) {
      return G24_INVALID_FINGERPRINT
    }
    return stringifyG24Data({
      planVersion: value.planVersion,
      selectorResultVersion: value.selectorResultVersion,
      selectorFingerprint: value.selectorFingerprint,
      maximumWallClockMs: value.maximumWallClockMs,
      maximumAttempts: value.maximumAttempts,
    })
  } catch {
    return G24_INVALID_FINGERPRINT
  }
}

function g24EnrichmentExecutionPlanIsExact(
  value: unknown,
): value is G24EnrichmentExecutionPlan {
  if (
    !g24IsRecord(value) ||
    !g24HasExactOwnKeys(value, [
      'planVersion',
      'selectorResultVersion',
      'selectorFingerprint',
      'maximumWallClockMs',
      'maximumAttempts',
      'planFingerprint',
    ]) ||
    !g24FingerprintIsValid(value.planFingerprint)
  ) {
    return false
  }
  const computed = fingerprintG24EnrichmentExecutionPlan(value)
  return g24FingerprintIsValid(computed) && computed === value.planFingerprint
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
  priorLedgerFingerprint: string
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
const G24_MAX_ENRICHMENT_ATTEMPTS = 32
const G24_MAX_EXECUTION_RECEIPTS = G24_MAX_ENRICHMENT_ATTEMPTS + 1
const G24_EXECUTION_CHAIN_DOMAIN = 'g24:execution-receipt-chain:v1'
const G24_EXECUTION_CHAIN_GENESIS = g24Sha256(`${G24_EXECUTION_CHAIN_DOMAIN}:genesis`)
const g24TerminalExecutionReceiptsByPlan = new WeakMap<
  G24EnrichmentExecutionPlan,
  Map<string, G24ExecutionReceipt>
>()

function g24ExecutionChainFingerprintIsValid(value: unknown): value is string {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value)
}

function fingerprintG24ExecutionReceipt(receipt: G24ExecutionReceipt): string {
  try {
    return stringifyG24Data(receipt)
  } catch {
    return G24_INVALID_FINGERPRINT
  }
}

function g24ExecutionReceiptHasExactShape(value: unknown): value is G24ExecutionReceipt {
  return (
    g24IsRecord(value) &&
    g24HasExactOwnKeys(value, [
      'receiptId',
      'idempotencyKey',
      'planVersion',
      'planFingerprint',
      'attemptNumber',
      'priorLedgerFingerprint',
      'attemptFingerprint',
      'status',
      'sourceRef',
      'appendOnly',
      'standingAwarded',
      'canonicalEvidenceCreated',
      'brainChanged',
      'approvalCreated',
      'deliveryCreated',
    ]) &&
    g24IdentifierIsCanonical(value.receiptId) &&
    g24IdentifierIsCanonical(value.idempotencyKey) &&
    g24IdentifierIsCanonical(value.planVersion) &&
    g24FingerprintIsValid(value.planFingerprint) &&
    Number.isInteger(value.attemptNumber) &&
    (value.attemptNumber as number) > 0 &&
    g24ExecutionChainFingerprintIsValid(value.priorLedgerFingerprint) &&
    g24FingerprintIsValid(value.attemptFingerprint) &&
    (
      ['proposed_evidence', 'failed_held', 'slow_held', 'stale_rejected', 'attempt_budget_held'] as unknown[]
    ).includes(value.status) &&
    (value.sourceRef === null || g24IdentifierIsCanonical(value.sourceRef)) &&
    value.appendOnly === true &&
    value.standingAwarded === false &&
    value.canonicalEvidenceCreated === false &&
    value.brainChanged === false &&
    value.approvalCreated === false &&
    value.deliveryCreated === false
  )
}

function advanceG24ExecutionReceiptChain(
  priorLedgerFingerprint: string,
  receipt: G24ExecutionReceipt,
): string {
  const canonicalReceipt = stringifyG24Data(receipt)
  if (
    !g24ExecutionChainFingerprintIsValid(priorLedgerFingerprint) ||
    canonicalReceipt === G24_INVALID_FINGERPRINT
  ) {
    return G24_INVALID_FINGERPRINT
  }
  return g24Sha256(
    stringifyG24Data({
      domain: G24_EXECUTION_CHAIN_DOMAIN,
      priorLedgerFingerprint,
      receipt: canonicalReceipt,
    }),
  )
}

function fingerprintG24ExecutionReceiptLedger(
  receipts: readonly G24ExecutionReceipt[],
): string {
  let fingerprint = G24_EXECUTION_CHAIN_GENESIS
  for (const receipt of receipts) {
    fingerprint = advanceG24ExecutionReceiptChain(fingerprint, receipt)
    if (!g24ExecutionChainFingerprintIsValid(fingerprint)) {
      return G24_INVALID_FINGERPRINT
    }
  }
  return fingerprint
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

function g24BoundedPlainArrayPreflight(value: unknown, maximumLength: number): boolean {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
    return (
      Boolean(lengthDescriptor) &&
      Object.prototype.hasOwnProperty.call(lengthDescriptor, 'value') &&
      typeof lengthDescriptor?.value === 'number' &&
      Number.isSafeInteger(lengthDescriptor.value) &&
      lengthDescriptor.value >= 0 &&
      lengthDescriptor.value <= maximumLength
    )
  } catch {
    return false
  }
}

function preserveIssuedG24ExecutionReceiptLedger(value: unknown): G24ExecutionReceipt[] {
  try {
    if (!g24BoundedPlainArrayPreflight(value, G24_MAX_EXECUTION_RECEIPTS)) return []
    const snapshot = snapshotG24PlainData(value)
    if (!snapshot.ok || !Array.isArray(snapshot.value)) return []
    const receipts = snapshot.value
    if (receipts.length > G24_MAX_EXECUTION_RECEIPTS) return []
    receipts.forEach((receipt) => {
      if (!g24ExecutionReceiptHasExactShape(receipt)) return
      const source = g24SourceForOwned(snapshot, receipt)
      const proof = source ? g24ExecutionReceiptProofs.get(source) : undefined
      if (proof === fingerprintG24ExecutionReceipt(receipt)) {
        g24ExecutionReceiptProofs.set(receipt, proof)
      }
    })
    const receiptIds = new Set<string>()
    const idempotencyKeys = new Set<string>()
    const first = receipts[0]
    let expectedPriorLedgerFingerprint = G24_EXECUTION_CHAIN_GENESIS
    const valid = receipts.every((receipt, index) => {
      if (!g24ExecutionReceiptHasExactShape(receipt)) return false
      const fingerprint = fingerprintG24ExecutionReceipt(receipt)
      if (
        !g24FingerprintIsValid(fingerprint) ||
        g24ExecutionReceiptProofs.get(receipt) !== fingerprint ||
        receipt.attemptNumber !== index + 1 ||
        receipt.priorLedgerFingerprint !== expectedPriorLedgerFingerprint ||
        (first !== undefined &&
          (receipt.planVersion !== first.planVersion ||
            receipt.planFingerprint !== first.planFingerprint)) ||
        receiptIds.has(receipt.receiptId) ||
        idempotencyKeys.has(receipt.idempotencyKey)
      ) {
        return false
      }
      receiptIds.add(receipt.receiptId)
      idempotencyKeys.add(receipt.idempotencyKey)
      expectedPriorLedgerFingerprint = advanceG24ExecutionReceiptChain(
        expectedPriorLedgerFingerprint,
        receipt,
      )
      return true
    })
    return valid ? cloneG24ExecutionReceiptsWithProofs(receipts) : []
  } catch {
    return []
  }
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
        status:
          | 'malformed_rejected'
          | 'stale_context_rejected'
          | 'attempt_budget_exhausted'
        durableReceiptCreated: false
      }
    }

function g24ExecutionReceiptLedgerIsStructurallyValid(
  receipts: readonly G24ExecutionReceipt[],
  plan: G24EnrichmentExecutionPlan,
): boolean {
  if (
    receipts.length > G24_MAX_EXECUTION_RECEIPTS ||
    receipts.length > plan.maximumAttempts + 1
  ) {
    return false
  }
  const receiptIds = new Set<string>()
  const idempotencyKeys = new Set<string>()
  let expectedPriorLedgerFingerprint = G24_EXECUTION_CHAIN_GENESIS
  return receipts.every((receipt, index) => {
    if (!g24ExecutionReceiptHasExactShape(receipt)) return false
    const computedReceiptFingerprint = fingerprintG24ExecutionReceipt(receipt)
    if (
      !g24FingerprintIsValid(computedReceiptFingerprint) ||
      g24ExecutionReceiptProofs.get(receipt) !== computedReceiptFingerprint
    ) {
      return false
    }
    const sourceRefIsValid =
      receipt.status === 'proposed_evidence'
        ? typeof receipt.sourceRef === 'string' &&
          Boolean(receipt.sourceRef.trim()) &&
          receipt.sourceRef === receipt.sourceRef.trim()
        : receipt.sourceRef === null
    const unique =
      !receiptIds.has(receipt.receiptId) && !idempotencyKeys.has(receipt.idempotencyKey)
    receiptIds.add(receipt.receiptId)
    idempotencyKeys.add(receipt.idempotencyKey)
    const valid =
      unique &&
      receipt.planVersion === plan.planVersion &&
      receipt.planFingerprint === plan.planFingerprint &&
      receipt.attemptNumber === index + 1 &&
      receipt.priorLedgerFingerprint === expectedPriorLedgerFingerprint &&
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
    if (valid) {
      expectedPriorLedgerFingerprint = advanceG24ExecutionReceiptChain(
        expectedPriorLedgerFingerprint,
        receipt,
      )
    }
    return valid
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
  transferG24SelectorResultProof(selectorSnapshot, selectorSnapshot.value)
  selector = selectorSnapshot.value
  input = inputSnapshot.value
  if (
    !g24SelectorResultIsExact(selector) ||
    selector.route !== 'enrich' ||
    !selector.actionable
  ) {
    throw new Error('enrichment_plan_requires_actionable_enrich_route')
  }
  if (
    !g24HasExactOwnKeys(input, ['planVersion', 'maximumWallClockMs', 'maximumAttempts']) ||
    !g24IdentifierIsCanonical(input.planVersion) ||
    !Number.isFinite(input.maximumWallClockMs) ||
    input.maximumWallClockMs <= 0 ||
    !Number.isInteger(input.maximumAttempts) ||
    input.maximumAttempts <= 0 ||
    input.maximumAttempts > G24_MAX_ENRICHMENT_ATTEMPTS
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
  if (!g24FingerprintIsValid(plan.planFingerprint)) {
    throw new Error('enrichment_plan_fingerprint_invalid')
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
  const priorReceiptsPreflight = (() => {
    try {
      if (typeof input !== 'object' || input === null) return { ok: false } as const
      const descriptor = Object.getOwnPropertyDescriptor(input, 'priorReceipts')
      if (
        !descriptor ||
        !Object.prototype.hasOwnProperty.call(descriptor, 'value') ||
        !g24BoundedPlainArrayPreflight(
          descriptor.value,
          G24_MAX_EXECUTION_RECEIPTS,
        )
      ) {
        return { ok: false } as const
      }
      return { ok: true, value: descriptor.value } as const
    } catch {
      return { ok: false } as const
    }
  })()
  if (!priorReceiptsPreflight.ok) {
    return {
      receipt: null,
      receipts: [],
      replayed: false,
      rejection: { status: 'malformed_rejected', durableReceiptCreated: false },
    }
  }
  const recoverablePriorReceipts = preserveIssuedG24ExecutionReceiptLedger(
    priorReceiptsPreflight.value,
  )
  const malformedResult = (): G24EnrichmentAttemptResult => ({
    receipt: null,
    receipts: cloneG24ExecutionReceiptsWithProofs(recoverablePriorReceipts),
    replayed: false,
    rejection: { status: 'malformed_rejected', durableReceiptCreated: false },
  })
  const inputSnapshot = snapshotG24PlainData(input)
  if (!inputSnapshot.ok || !g24IsRecord(inputSnapshot.value)) {
    return malformedResult()
  }
  const ownedInput = inputSnapshot.value
  if (
    !g24HasExactOwnKeys(ownedInput, ['plan', 'currentSelector', 'priorReceipts', 'attempt']) ||
    !g24EnrichmentExecutionPlanIsExact(ownedInput.plan) ||
    !g24SelectorResultHasExactEnvelope(ownedInput.currentSelector) ||
    !Array.isArray(ownedInput.priorReceipts) ||
    !g24IsRecord(ownedInput.attempt)
  ) {
    return malformedResult()
  }
  transferG24SelectorResultProof(inputSnapshot, ownedInput.currentSelector)
  const attemptKeys = ['receiptId', 'idempotencyKey', 'elapsedMs', 'outcome']
  if (Object.prototype.hasOwnProperty.call(ownedInput.attempt, 'sourceRef')) {
    attemptKeys.push('sourceRef')
  }
  if (!g24HasExactOwnKeys(ownedInput.attempt, attemptKeys)) {
    return malformedResult()
  }
  const ownedPlan = ownedInput.plan
  const planSource =
    typeof ownedPlan === 'object' && ownedPlan !== null
      ? g24SourceForOwned(inputSnapshot, ownedPlan)
      : undefined
  const planProof = planSource ? g24EnrichmentExecutionPlanProofs.get(planSource) : undefined
  if (planProof === fingerprintG24EnrichmentExecutionPlan(ownedPlan)) {
    g24EnrichmentExecutionPlanProofs.set(ownedPlan, planProof)
  }
  if (Array.isArray(ownedInput.priorReceipts)) {
    ownedInput.priorReceipts.forEach((receipt) => {
      const source = g24SourceForOwned(inputSnapshot, receipt)
      const proof = source ? g24ExecutionReceiptProofs.get(source) : undefined
      const computed = g24ExecutionReceiptHasExactShape(receipt)
        ? fingerprintG24ExecutionReceipt(receipt)
        : G24_INVALID_FINGERPRINT
      if (g24FingerprintIsValid(computed) && proof === computed) {
        g24ExecutionReceiptProofs.set(receipt, proof)
      }
    })
  }
  input = ownedInput as unknown as typeof input
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
  const planFingerprintIsValid = g24FingerprintIsValid(input.plan.planFingerprint)
  const computedPlanFingerprint = fingerprintG24EnrichmentExecutionPlan(input.plan)
  const issuedPlanFingerprint = g24EnrichmentExecutionPlanProofs.get(input.plan)
  const planIssuanceIsValid =
    g24FingerprintIsValid(computedPlanFingerprint) &&
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
    input.plan.maximumAttempts <= 0 ||
    input.plan.maximumAttempts > G24_MAX_ENRICHMENT_ATTEMPTS
  if (malformed) {
    return {
      receipt: null,
      receipts: cloneG24ExecutionReceiptsWithProofs(recoverablePriorReceipts),
      replayed: false,
      rejection: { status: 'malformed_rejected', durableReceiptCreated: false },
    }
  }
  if (!g24ExecutionReceiptLedgerIsStructurallyValid(input.priorReceipts, input.plan)) {
    return {
      receipt: null,
      receipts: preserveIssuedG24ExecutionReceiptLedger(input.priorReceipts),
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
    g24SelectorResultIsExact(input.currentSelector)
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

  if (
    !prior &&
    !receiptIdAlreadyUsed &&
    input.priorReceipts.length >=
      Math.min(G24_MAX_EXECUTION_RECEIPTS, input.plan.maximumAttempts + 1)
  ) {
    return {
      receipt: null,
      receipts: cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
      replayed: false,
      rejection: { status: 'attempt_budget_exhausted', durableReceiptCreated: false },
    }
  }

  const attemptNumber = prior ? priorIndex + 1 : input.priorReceipts.length + 1
  if (
    !prior &&
    attemptNumber > input.plan.maximumAttempts &&
    !currentSelectorMatchesPlan
  ) {
    return {
      receipt: null,
      receipts: cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
      replayed: false,
      rejection: { status: 'attempt_budget_exhausted', durableReceiptCreated: false },
    }
  }
  const terminalPrefixFingerprint =
    !prior && attemptNumber > input.plan.maximumAttempts
      ? g24Sha256(
          stringifyG24Data({
            domain: 'g24:terminal-execution-prefix:v1',
            planFingerprint: input.plan.planFingerprint,
            priorLedgerFingerprint: fingerprintG24ExecutionReceiptLedger(
              input.priorReceipts,
            ),
            terminalOrdinal: attemptNumber,
          }),
        )
      : null
  const terminalReceipts = planSource
    ? g24TerminalExecutionReceiptsByPlan.get(planSource)
    : undefined
  const issuedTerminalReceipt = terminalPrefixFingerprint
    ? terminalReceipts?.get(terminalPrefixFingerprint)
    : undefined
  if (issuedTerminalReceipt) {
    const sameTerminalAttempt =
      issuedTerminalReceipt.receiptId === input.attempt.receiptId &&
      issuedTerminalReceipt.idempotencyKey === input.attempt.idempotencyKey &&
      issuedTerminalReceipt.attemptFingerprint === attemptFingerprint
    if (!sameTerminalAttempt) {
      return {
        receipt: null,
        receipts: cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
        replayed: false,
        rejection: { status: 'attempt_budget_exhausted', durableReceiptCreated: false },
      }
    }
    const receiptClone = cloneG24ExecutionReceiptsWithProofs([
      issuedTerminalReceipt,
    ])[0]
    return {
      receipt: receiptClone,
      receipts: [
        ...cloneG24ExecutionReceiptsWithProofs(input.priorReceipts),
        cloneG24ExecutionReceiptsWithProofs([issuedTerminalReceipt])[0],
      ],
      replayed: true,
      rejection: null,
    }
  }
  let status: G24ExecutionStatus
  if (attemptNumber > input.plan.maximumAttempts) {
    status = 'attempt_budget_held'
  } else if (!currentSelectorMatchesPlan) {
    status = 'stale_rejected'
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
    priorLedgerFingerprint: fingerprintG24ExecutionReceiptLedger(
      prior ? input.priorReceipts.slice(0, priorIndex) : input.priorReceipts,
    ),
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
  if (terminalPrefixFingerprint && planSource) {
    const planTerminalReceipts =
      terminalReceipts ?? new Map<string, G24ExecutionReceipt>()
    const receiptClone = cloneG24ExecutionReceiptsWithProofs([receipt])[0]
    planTerminalReceipts.set(terminalPrefixFingerprint, receiptClone)
    if (!terminalReceipts) {
      g24TerminalExecutionReceiptsByPlan.set(planSource, planTerminalReceipts)
    }
  }
  return {
    receipt,
    receipts: [...cloneG24ExecutionReceiptsWithProofs(input.priorReceipts), receipt],
    replayed: false,
    rejection: null,
  }
}

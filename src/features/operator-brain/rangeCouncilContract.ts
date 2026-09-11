export const EXTERNAL_EVIDENCE_DEPTHS = [
  'none_or_unusable',
  'sparse',
  'useful',
  'rich_longitudinal',
] as const

export const INTERNAL_EVIDENCE_DEPTHS = [
  'none',
  'basic_intake',
  'work_evidence',
  'longitudinal_corrections',
] as const

export const RANGE_RUNTIME_STATES = ['initial', 'contradicted', 'corrected'] as const

export const EVIDENCE_NAMESPACES = [
  'real_public',
  'consented_private',
  'consented_anonymised',
  'synthetic_fixture',
] as const

export type ExternalEvidenceDepth = (typeof EXTERNAL_EVIDENCE_DEPTHS)[number]
export type InternalEvidenceDepth = (typeof INTERNAL_EVIDENCE_DEPTHS)[number]
export type RangeRuntimeState = (typeof RANGE_RUNTIME_STATES)[number]
export type EvidenceNamespace = (typeof EVIDENCE_NAMESPACES)[number]

export interface RangeProfileManifest {
  profileId: string
  displayLabel: string
  namespace: EvidenceNamespace
  externalDepth: ExternalEvidenceDepth
  internalDepth: InternalEvidenceDepth
  realNamedPerson: boolean
  publicSourceLocators: string[]
  consentRecordId?: string
  syntheticDisclosure?: string
}

export interface RangeCase {
  caseId: string
  profileId: string
  runtimeState: RangeRuntimeState
  expectedNotices: string[]
  forbiddenClaims: string[]
}

export interface RangePopulation {
  profiles: RangeProfileManifest[]
  cases: RangeCase[]
}

const PROFILE_ID_PATTERN = /^RANGE-[A-Z0-9-]+$/
const SYMBOLIC_CONSENT_PATTERN = /^CONSENT-[A-Z0-9-]+$/

function hasEveryCoordinate(profiles: RangeProfileManifest[]): boolean {
  return EXTERNAL_EVIDENCE_DEPTHS.every((externalDepth) =>
    INTERNAL_EVIDENCE_DEPTHS.every((internalDepth) =>
      profiles.some(
        (profile) => profile.externalDepth === externalDepth && profile.internalDepth === internalDepth,
      ),
    ),
  )
}

export function validateProfileManifest(profile: RangeProfileManifest): string[] {
  const errors: string[] = []

  if (!PROFILE_ID_PATTERN.test(profile.profileId)) errors.push('profile_id_invalid')
  if (!profile.displayLabel.trim()) errors.push('display_label_required')

  if (profile.realNamedPerson && profile.namespace !== 'real_public') {
    errors.push('real_named_person_wrong_namespace')
  }

  if (profile.namespace === 'real_public') {
    if (!profile.realNamedPerson) errors.push('real_public_requires_named_subject')
    if (profile.internalDepth !== 'none') errors.push('real_public_cannot_contain_internal_evidence')
    if (profile.publicSourceLocators.length === 0) errors.push('real_public_requires_attributable_source')
    if (profile.consentRecordId) errors.push('real_public_cannot_claim_private_consent')
  }

  if (profile.namespace === 'consented_private' || profile.namespace === 'consented_anonymised') {
    if (!profile.consentRecordId || !SYMBOLIC_CONSENT_PATTERN.test(profile.consentRecordId)) {
      errors.push('consented_namespace_requires_symbolic_consent_record')
    }
  }

  if (profile.namespace === 'synthetic_fixture') {
    if (profile.realNamedPerson) errors.push('synthetic_fixture_cannot_name_real_person')
    if (profile.consentRecordId) errors.push('synthetic_fixture_cannot_claim_consent')
    if (!profile.syntheticDisclosure?.toLowerCase().includes('fictional')) {
      errors.push('synthetic_fixture_requires_fictional_disclosure')
    }
  }

  return errors
}

export function validateRangePopulation(population: RangePopulation): string[] {
  const errors: string[] = []
  const profileIds = population.profiles.map((profile) => profile.profileId)
  const caseIds = population.cases.map((rangeCase) => rangeCase.caseId)

  if (population.profiles.length !== 16) errors.push('range_requires_16_profiles')
  if (new Set(profileIds).size !== profileIds.length) errors.push('profile_ids_must_be_unique')
  if (!hasEveryCoordinate(population.profiles)) errors.push('range_missing_evidence_coordinate')
  if (population.cases.length !== 48) errors.push('range_requires_48_cases')
  if (new Set(caseIds).size !== caseIds.length) errors.push('case_ids_must_be_unique')

  for (const profile of population.profiles) {
    errors.push(...validateProfileManifest(profile).map((error) => `${profile.profileId}:${error}`))
    const profileCases = population.cases.filter((rangeCase) => rangeCase.profileId === profile.profileId)
    if (profileCases.length !== RANGE_RUNTIME_STATES.length) {
      errors.push(`${profile.profileId}:requires_three_runtime_cases`)
      continue
    }
    const runtimeStates = new Set(profileCases.map((rangeCase) => rangeCase.runtimeState))
    for (const runtimeState of RANGE_RUNTIME_STATES) {
      if (!runtimeStates.has(runtimeState)) errors.push(`${profile.profileId}:missing_${runtimeState}`)
    }
  }

  for (const rangeCase of population.cases) {
    if (!profileIds.includes(rangeCase.profileId)) errors.push(`${rangeCase.caseId}:unknown_profile`)
    if (!RANGE_RUNTIME_STATES.includes(rangeCase.runtimeState)) {
      errors.push(`${rangeCase.caseId}:unknown_runtime_state`)
    }
    if (rangeCase.expectedNotices.length === 0) errors.push(`${rangeCase.caseId}:expected_notice_required`)
    if (rangeCase.forbiddenClaims.length === 0) errors.push(`${rangeCase.caseId}:forbidden_claim_required`)
  }

  return errors
}

export function buildRangeCases(profiles: RangeProfileManifest[]): RangeCase[] {
  return profiles.flatMap((profile) =>
    RANGE_RUNTIME_STATES.map((runtimeState) => ({
      caseId: `${profile.profileId}-${runtimeState.toUpperCase()}`,
      profileId: profile.profileId,
      runtimeState,
      expectedNotices: [`Notice the evidence and lifecycle conditions for ${runtimeState}.`],
      forbiddenClaims: ['Do not convert missing or provisional evidence into a fact about the person.'],
    })),
  )
}

export const COUNCIL_JUDGES = [
  'human_agency',
  'epistemic_integrity',
  'subject_audience_lifecycle_safety',
  'consequential_usefulness',
  'living_brain_integrity',
  'human_comprehension_and_access',
  'behavioural_and_implementation_reality',
] as const

export type CouncilJudge = (typeof COUNCIL_JUDGES)[number]
export type CouncilVerdict = 'pass' | 'fail' | 'inconclusive'
export type CouncilPhase = 'sealed_review' | 'cross_examination' | 'adjudication'

export const NON_VOTING_COUNCIL_ROLES = ['standards_prosecutor', 'founder_calibration'] as const

export const COUNCIL_EVENT_FAMILIES = [
  'council_contract_events',
  'council_run_events',
  'judge_ruling_events',
  'profile_manifest_events',
  'range_case_events',
  'responsibility_gate_events',
] as const

export interface JudgeRuling {
  rulingId: string
  runId: string
  judge: CouncilJudge
  phase: CouncilPhase
  verdict: CouncilVerdict
  criterionVersion: string
  artifactHash: string
  theoryPackHash: string
  claims: string[]
  evidenceLocators: string[]
  recordedAt: string
  supersedesRulingId?: string
  missingEvidence?: string[]
  resolvingTest?: string
  veto?: {
    ruleId: string
    failure: string
    resolvingTest: string
  }
}

export const FROZEN_RANGE_RULING_FIELDS = [
  'runId',
  'judge',
  'criterionVersion',
  'artifactCompositeSha256',
  'verdict',
  'claims',
  'evidenceLocators',
  'veto',
  'missingEvidence',
  'resolvingTest',
  'recordedAt',
] as const

export const FROZEN_RANGE_RULING_FIELDS_V4 = [
  ...FROZEN_RANGE_RULING_FIELDS,
  'reviewBoundaryAttestation',
] as const

const FROZEN_RANGE_CONTRACT_FIELDS = [
  'runId',
  'artifactCompositeSha256',
  'criterionVersions',
] as const
const FROZEN_RANGE_CONTRACT_FIELDS_V4 = [
  ...FROZEN_RANGE_CONTRACT_FIELDS,
  'reviewBoundary',
] as const
const FROZEN_RANGE_VETO_FIELDS = ['ruleId', 'failure', 'resolvingTest'] as const
const FROZEN_RANGE_REVIEW_BOUNDARY_FIELDS = [
  'protocolVersion',
  'semanticReviewCompositeSha256',
] as const
const FROZEN_RANGE_REVIEW_ATTESTATION_FIELDS = [
  'semanticReviewCompositeSha256',
  'excludedHistoryEncountered',
] as const

export interface FrozenRangeReviewBoundary {
  protocolVersion: 'history-free-semantic-allowlist:v1'
  semanticReviewCompositeSha256: string
}

export interface FrozenRangeReviewBoundaryAttestation {
  semanticReviewCompositeSha256: string
  excludedHistoryEncountered: false
}

export interface FrozenRangeJudgeRuling {
  runId: string
  judge: CouncilJudge
  criterionVersion: string
  artifactCompositeSha256: string
  verdict: CouncilVerdict
  claims: string[]
  evidenceLocators: string[]
  veto: {
    ruleId: string
    failure: string
    resolvingTest: string
  } | null
  missingEvidence: string[]
  resolvingTest: string | null
  recordedAt: string
  reviewBoundaryAttestation?: FrozenRangeReviewBoundaryAttestation
}

export interface FrozenRangeCouncilContract {
  runId: string
  artifactCompositeSha256: string
  criterionVersions: Record<CouncilJudge, string>
  reviewBoundary?: FrozenRangeReviewBoundary
}

const G21_HISTORY_BEARING_SEMANTIC_PATHS = new Set([
  'project-documentation/ctrl-evolution/README.md',
  'project-documentation/ctrl-evolution/g21-evidence-range-council-contract.md',
  'project-documentation/ctrl-evolution/g21-internal-range-canary.md',
  'project-documentation/ctrl-evolution/g21-v4-contract-separation.md',
  'project-documentation/ctrl-evolution/session-method-learning-log.md',
  'scripts/check-g21-internal-council.mjs',
])

const G21_HISTORY_BEARING_PATH_PATTERN =
  /(?:^|\/)judge-history\/|(?:^|\/)runs\/g21-internal-range-freeze-\d{3}\/(?:judges|readers)\/|(?:^|\/)(?:adjudication|rulings-manifest|standards-prosecutor|founder-calibration|review-protocol-failure)\.(?:json|md)$/

function validRepositoryPath(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !value.includes('\\') &&
    !value.startsWith('/') &&
    !value.split('/').includes('..')
  )
}

function denseArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) return false
  }
  return true
}

export function validateG21SemanticReviewAllowlist(
  semanticReviewPaths: readonly unknown[],
  provenanceOnlyPaths: readonly unknown[],
): string[] {
  const errors: string[] = []
  if (!denseArray(semanticReviewPaths) || semanticReviewPaths.length === 0) {
    errors.push('semantic_review_allowlist_required')
    return errors
  }
  if (!denseArray(provenanceOnlyPaths)) {
    errors.push('provenance_only_paths_array_required')
    return errors
  }
  if (!semanticReviewPaths.every(validRepositoryPath)) {
    errors.push('semantic_review_paths_invalid')
  }
  if (!provenanceOnlyPaths.every(validRepositoryPath)) {
    errors.push('provenance_only_paths_invalid')
  }
  const semantic = semanticReviewPaths.filter(validRepositoryPath)
  const provenance = provenanceOnlyPaths.filter(validRepositoryPath)
  if (new Set(semantic).size !== semantic.length) {
    errors.push('semantic_review_paths_must_be_unique')
  }
  if (new Set(provenance).size !== provenance.length) {
    errors.push('provenance_only_paths_must_be_unique')
  }
  if (semantic.some((path) => provenance.includes(path))) {
    errors.push('semantic_and_provenance_paths_must_be_disjoint')
  }
  for (const path of semantic) {
    if (
      G21_HISTORY_BEARING_SEMANTIC_PATHS.has(path) ||
      G21_HISTORY_BEARING_PATH_PATTERN.test(path)
    ) {
      errors.push(`history_bearing_semantic_path_forbidden_${path}`)
    }
  }
  return errors
}

function sameFieldSet(actual: string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((field) => expected.includes(field as (typeof expected)[number]))
  )
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonemptyStringArray(value: unknown): value is string[] {
  return denseArray(value) && value.length > 0 && value.every(
    (item) => typeof item === 'string' && item.trim().length > 0,
  )
}

function stringArray(value: unknown): value is string[] {
  return denseArray(value) && value.every(
    (item) => typeof item === 'string' && item.trim().length > 0,
  )
}

function requiresHistoryFreeReviewBoundary(runId: unknown): boolean {
  if (typeof runId !== 'string') return false
  const match = /G21-INTERNAL-RANGE-FREEZE-(\d{3})$/.exec(runId)
  return Boolean(match && Number(match[1]) >= 4)
}

export function validateFrozenRangeCouncil(
  rulings: readonly unknown[],
  contract: FrozenRangeCouncilContract,
): string[] {
  const errors: string[] = []
  if (!denseArray(rulings)) return ['frozen_range_rulings_array_required']
  if (!isPlainRecord(contract)) return ['frozen_range_contract_object_required']
  const reviewBoundaryRequired = requiresHistoryFreeReviewBoundary(contract.runId)
  const contractFields = reviewBoundaryRequired
    ? FROZEN_RANGE_CONTRACT_FIELDS_V4
    : FROZEN_RANGE_CONTRACT_FIELDS
  if (!sameFieldSet(Object.keys(contract), contractFields)) {
    errors.push('frozen_range_contract_fields_invalid')
  }
  if (reviewBoundaryRequired) {
    if (
      !isPlainRecord(contract.reviewBoundary) ||
      !sameFieldSet(
        Object.keys(contract.reviewBoundary),
        FROZEN_RANGE_REVIEW_BOUNDARY_FIELDS,
      ) ||
      contract.reviewBoundary.protocolVersion !== 'history-free-semantic-allowlist:v1' ||
      typeof contract.reviewBoundary.semanticReviewCompositeSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(contract.reviewBoundary.semanticReviewCompositeSha256)
    ) {
      errors.push('frozen_range_review_boundary_invalid')
    }
  } else if (contract.reviewBoundary !== undefined) {
    errors.push('legacy_frozen_range_cannot_claim_v4_review_boundary')
  }
  if (
    !isPlainRecord(contract.criterionVersions) ||
    !sameFieldSet(Object.keys(contract.criterionVersions), COUNCIL_JUDGES)
  ) {
    return [...errors, 'frozen_range_criterion_versions_invalid']
  }
  if (rulings.length !== COUNCIL_JUDGES.length) errors.push('frozen_range_requires_seven_rulings')

  for (const judge of COUNCIL_JUDGES) {
    const matches = rulings.filter((ruling) => isPlainRecord(ruling) && ruling.judge === judge)
    if (matches.length === 0) errors.push(`frozen_range_missing_${judge}`)
    if (matches.length > 1) errors.push(`frozen_range_duplicate_${judge}`)
  }

  for (const rawRuling of rulings) {
    if (!isPlainRecord(rawRuling)) {
      errors.push('frozen_ruling_object_invalid')
      continue
    }
    const ruling = rawRuling as unknown as FrozenRangeJudgeRuling
    const judgeLabel = typeof ruling.judge === 'string' ? ruling.judge : 'unknown_judge'
    const rulingFields = reviewBoundaryRequired
      ? FROZEN_RANGE_RULING_FIELDS_V4
      : FROZEN_RANGE_RULING_FIELDS
    if (!sameFieldSet(Object.keys(ruling), rulingFields)) {
      errors.push(`${judgeLabel}:frozen_ruling_fields_invalid`)
    }
    if (ruling.runId !== contract.runId) errors.push(`${judgeLabel}:frozen_run_id_mismatch`)
    if (ruling.artifactCompositeSha256 !== contract.artifactCompositeSha256) {
      errors.push(`${judgeLabel}:frozen_artifact_hash_mismatch`)
    }
    if (!COUNCIL_JUDGES.includes(ruling.judge)) errors.push(`${judgeLabel}:frozen_judge_invalid`)
    if (ruling.criterionVersion !== contract.criterionVersions[ruling.judge]) {
      errors.push(`${judgeLabel}:frozen_criterion_version_mismatch`)
    }
    if (!['pass', 'fail', 'inconclusive'].includes(ruling.verdict)) {
      errors.push(`${judgeLabel}:frozen_verdict_invalid`)
    }
    if (!nonemptyStringArray(ruling.claims)) {
      errors.push(`${judgeLabel}:frozen_claims_invalid`)
    }
    if (!nonemptyStringArray(ruling.evidenceLocators)) {
      errors.push(`${judgeLabel}:frozen_evidence_invalid`)
    }
    if (typeof ruling.recordedAt !== 'string' || Number.isNaN(Date.parse(ruling.recordedAt))) {
      errors.push(`${judgeLabel}:frozen_recorded_at_invalid`)
    }
    if (!stringArray(ruling.missingEvidence)) {
      errors.push(`${judgeLabel}:frozen_missing_evidence_invalid`)
    }
    if (reviewBoundaryRequired) {
      const attestation = ruling.reviewBoundaryAttestation
      if (
        !isPlainRecord(attestation) ||
        !sameFieldSet(
          Object.keys(attestation),
          FROZEN_RANGE_REVIEW_ATTESTATION_FIELDS,
        ) ||
        attestation.semanticReviewCompositeSha256 !==
          contract.reviewBoundary?.semanticReviewCompositeSha256 ||
        attestation.excludedHistoryEncountered !== false
      ) {
        errors.push(`${judgeLabel}:frozen_review_boundary_attestation_invalid`)
      }
    } else if (ruling.reviewBoundaryAttestation !== undefined) {
      errors.push(`${judgeLabel}:legacy_ruling_cannot_claim_v4_review_attestation`)
    }
    if (ruling.verdict === 'pass') {
      if (ruling.veto !== null) errors.push(`${judgeLabel}:frozen_pass_cannot_veto`)
      if (ruling.resolvingTest !== null) {
        errors.push(`${judgeLabel}:frozen_pass_cannot_require_resolving_test`)
      }
      if (Array.isArray(ruling.missingEvidence) && ruling.missingEvidence.length > 0) {
        errors.push(`${judgeLabel}:frozen_pass_cannot_claim_missing_evidence`)
      }
    }
    if (ruling.verdict === 'fail') {
      if (!ruling.veto) errors.push(`${judgeLabel}:frozen_fail_requires_veto`)
      if (typeof ruling.resolvingTest !== 'string' || !ruling.resolvingTest.trim()) {
        errors.push(`${judgeLabel}:frozen_fail_requires_resolving_test`)
      }
    }
    if (ruling.verdict === 'inconclusive') {
      if (!Array.isArray(ruling.missingEvidence) || !ruling.missingEvidence.length) {
        errors.push(`${judgeLabel}:frozen_inconclusive_requires_evidence_gap`)
      }
      if (typeof ruling.resolvingTest !== 'string' || !ruling.resolvingTest.trim()) {
        errors.push(`${judgeLabel}:frozen_inconclusive_requires_resolving_test`)
      }
      if (ruling.veto !== null) errors.push(`${judgeLabel}:frozen_inconclusive_cannot_veto`)
    }
    if (ruling.veto) {
      if (
        !isPlainRecord(ruling.veto) ||
        !sameFieldSet(Object.keys(ruling.veto), FROZEN_RANGE_VETO_FIELDS) ||
        typeof ruling.veto.ruleId !== 'string' ||
        !ruling.veto.ruleId.trim() ||
        typeof ruling.veto.failure !== 'string' ||
        !ruling.veto.failure.trim() ||
        typeof ruling.veto.resolvingTest !== 'string' ||
        !ruling.veto.resolvingTest.trim()
      ) {
        errors.push(`${judgeLabel}:frozen_veto_invalid`)
      }
      if (ruling.resolvingTest !== ruling.veto.resolvingTest) {
        errors.push(`${judgeLabel}:frozen_resolving_test_must_match_veto`)
      }
    }
  }

  return errors
}

export type FrozenRangeCouncilAdjudication =
  | { status: 'invalid'; errors: string[] }
  | { status: 'blocked'; vetoes: NonNullable<FrozenRangeJudgeRuling['veto']>[] }
  | { status: 'needs_evidence'; judges: CouncilJudge[] }
  | { status: 'failed'; judges: CouncilJudge[] }
  | { status: 'passed' }

export function adjudicateFrozenRangeCouncil(
  rulings: FrozenRangeJudgeRuling[],
  contract: FrozenRangeCouncilContract,
): FrozenRangeCouncilAdjudication {
  const errors = validateFrozenRangeCouncil(rulings, contract)
  if (errors.length) return { status: 'invalid', errors }

  const vetoes = rulings.flatMap((ruling) => (ruling.veto ? [structuredClone(ruling.veto)] : []))
  if (vetoes.length) return { status: 'blocked', vetoes }

  const inconclusive = rulings
    .filter((ruling) => ruling.verdict === 'inconclusive')
    .map((ruling) => ruling.judge)
  if (inconclusive.length) return { status: 'needs_evidence', judges: inconclusive }

  const failed = rulings.filter((ruling) => ruling.verdict === 'fail').map((ruling) => ruling.judge)
  if (failed.length) return { status: 'failed', judges: failed }

  return { status: 'passed' }
}

export function validateSealedCouncil(rulings: JudgeRuling[]): string[] {
  const errors: string[] = []
  const sealed = rulings.filter((ruling) => ruling.phase === 'sealed_review')
  const represented = new Set(sealed.map((ruling) => ruling.judge))
  const runIds = new Set(sealed.map((ruling) => ruling.runId))
  const artifactHashes = new Set(sealed.map((ruling) => ruling.artifactHash))
  const rulingIds = rulings.map((ruling) => ruling.rulingId)

  if (sealed.length !== COUNCIL_JUDGES.length) errors.push('sealed_review_requires_seven_rulings')
  if (runIds.size !== 1) errors.push('sealed_review_requires_one_run_id')
  if (artifactHashes.size !== 1) errors.push('sealed_review_requires_one_artifact_hash')
  if (new Set(rulingIds).size !== rulingIds.length) errors.push('ruling_ids_must_be_unique')
  for (const judge of COUNCIL_JUDGES) {
    const count = sealed.filter((ruling) => ruling.judge === judge).length
    if (!represented.has(judge)) errors.push(`sealed_review_missing_${judge}`)
    if (count > 1) errors.push(`sealed_review_duplicate_${judge}`)
  }

  for (const ruling of rulings) {
    if (!ruling.rulingId.trim()) errors.push(`${ruling.judge}:ruling_id_required`)
    if (!ruling.runId.trim()) errors.push(`${ruling.judge}:run_id_required`)
    if (!COUNCIL_JUDGES.includes(ruling.judge)) errors.push(`${ruling.judge}:judge_invalid`)
    if (!['sealed_review', 'cross_examination', 'adjudication'].includes(ruling.phase)) {
      errors.push(`${ruling.judge}:phase_invalid`)
    }
    if (!['pass', 'fail', 'inconclusive'].includes(ruling.verdict)) {
      errors.push(`${ruling.judge}:verdict_invalid`)
    }
    if (!ruling.criterionVersion.trim()) errors.push(`${ruling.judge}:criterion_version_required`)
    if (!ruling.artifactHash.trim()) errors.push(`${ruling.judge}:artifact_hash_required`)
    if (!ruling.theoryPackHash.trim()) errors.push(`${ruling.judge}:theory_pack_hash_required`)
    if (ruling.claims.length === 0) errors.push(`${ruling.judge}:claim_required`)
    if (ruling.evidenceLocators.length === 0) errors.push(`${ruling.judge}:evidence_required`)
    if (ruling.claims.some((claim) => typeof claim !== 'string' || !claim.trim())) {
      errors.push(`${ruling.judge}:claims_must_be_nonempty_strings`)
    }
    if (
      ruling.evidenceLocators.some(
        (locator) => typeof locator !== 'string' || !locator.trim(),
      )
    ) {
      errors.push(`${ruling.judge}:evidence_locators_must_be_nonempty_strings`)
    }
    if (Number.isNaN(Date.parse(ruling.recordedAt))) errors.push(`${ruling.judge}:recorded_at_invalid`)
    if (ruling.supersedesRulingId === ruling.rulingId) errors.push(`${ruling.judge}:cannot_supersede_self`)
    if (ruling.veto && ruling.verdict !== 'fail') errors.push(`${ruling.judge}:veto_requires_fail_verdict`)
    if (ruling.verdict === 'inconclusive') {
      if (!ruling.missingEvidence?.length) errors.push(`${ruling.judge}:inconclusive_requires_missing_evidence`)
      if (!ruling.resolvingTest?.trim()) errors.push(`${ruling.judge}:inconclusive_requires_resolving_test`)
    }
    if (ruling.missingEvidence?.some((item) => typeof item !== 'string' || !item.trim())) {
      errors.push(`${ruling.judge}:missing_evidence_cannot_be_empty`)
    }
    if (ruling.veto && !ruling.veto.resolvingTest.trim()) {
      errors.push(`${ruling.judge}:veto_requires_resolving_test`)
    }
  }

  return errors
}

export type CouncilAdjudication =
  | { status: 'invalid'; errors: string[] }
  | { status: 'blocked'; vetoes: NonNullable<JudgeRuling['veto']>[] }
  | { status: 'needs_evidence'; judges: CouncilJudge[] }
  | { status: 'failed'; judges: CouncilJudge[] }
  | { status: 'passed' }

export function adjudicateSealedCouncil(rulings: JudgeRuling[]): CouncilAdjudication {
  const errors = validateSealedCouncil(rulings)
  if (errors.length > 0) return { status: 'invalid', errors }

  const vetoes = rulings.flatMap((ruling) => (ruling.veto ? [ruling.veto] : []))
  if (vetoes.length > 0) return { status: 'blocked', vetoes }

  const inconclusive = rulings
    .filter((ruling) => ruling.verdict === 'inconclusive')
    .map((ruling) => ruling.judge)
  if (inconclusive.length > 0) return { status: 'needs_evidence', judges: inconclusive }

  const failed = rulings.filter((ruling) => ruling.verdict === 'fail').map((ruling) => ruling.judge)
  if (failed.length > 0) return { status: 'failed', judges: failed }

  return { status: 'passed' }
}

export const THEORY_PACK_SEQUENCE = [
  'blind_truth',
  'historical_calibration',
  'adversarial_challenge',
] as const

export const RESPONSIBILITY_GATES = [0, 1, 2, 3, 4] as const
export type ResponsibilityGate = (typeof RESPONSIBILITY_GATES)[number]

export const RESPONSIBILITY_GATE_LABELS: Record<ResponsibilityGate, string> = {
  0: 'Observe',
  1: 'Explore',
  2: 'Influence',
  3: 'Commit',
  4: 'Restricted',
}

export interface ResponsibilityAssessment {
  harm: ResponsibilityGate
  irreversibility: ResponsibilityGate
  externalReach: ResponsibilityGate
  evidenceUncertainty: ResponsibilityGate
  changesToMoneyRightsEmploymentReputationAccessOrDurableTruth: ResponsibilityGate
}

export function resolveResponsibilityGate(assessment: ResponsibilityAssessment): ResponsibilityGate {
  const values = Object.values(assessment)
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 4)) {
    throw new Error('Responsibility assessments must use integer gates from 0 to 4.')
  }
  return Math.max(...values) as ResponsibilityGate
}

export const THEORY_TRIGGERS = [
  'claim_or_inference',
  'consequential_choice',
  'tacit_judgement',
  'memory_change',
  'self_correction',
  'question_generation',
  'expert_judgement_claim',
] as const

export type TheoryTrigger = (typeof THEORY_TRIGGERS)[number]

export interface TheoryCard {
  cardId: string
  label: string
  sourceLocator: string
  rule: string
  advisoryOnly: true
  warning?: string
}

export const SHARED_THEORY_CARDS: TheoryCard[] = [
  {
    cardId: 'agency',
    label: 'Human agency',
    sourceLocator: 'project-documentation/ctrl-evolution/README.md#product-truth-locked-through-g12',
    rule: 'Humans own purpose, boundaries, standards, exceptions and the final consequential call.',
    advisoryOnly: true,
  },
  {
    cardId: 'evidence',
    label: 'Evidence standing',
    sourceLocator: 'docs/current/architecture.md#architecture-invariants',
    rule: 'Keep explicit facts, inferred candidates and behavioural feedback as different data types.',
    advisoryOnly: true,
  },
  {
    cardId: 'boundary',
    label: 'Subject and audience boundary',
    sourceLocator: 'docs/current/architecture.md#trust-boundaries',
    rule: 'Prove subject, ownership, audience and authority before an item can travel or act.',
    advisoryOnly: true,
  },
  {
    cardId: 'reality',
    label: 'Behavioural reality',
    sourceLocator: 'project-documentation/ctrl-evolution/session-method-learning-log.md#confirmed-by-krish',
    rule: 'Judge the real task and consequence, not an elegant description of the intended system.',
    advisoryOnly: true,
  },
]

export const OPTIONAL_THEORY_CARDS: Record<TheoryTrigger, TheoryCard[]> = {
  claim_or_inference: [
    {
      cardId: 'claim-decomposition',
      label: 'Claim decomposition',
      sourceLocator: 'docs/history/2026-09-07-intel-methodology-critical-thinking.md',
      rule: 'Type the claim, identify its load-bearing assumption and name evidence that would disconfirm it.',
      advisoryOnly: true,
    },
    {
      cardId: 'strongest-countercase',
      label: 'Strongest countercase',
      sourceLocator: 'docs/history/2026-09-07-LLM_CRITICAL_THINKING_TRAINING.md',
      rule: 'Build the strongest plausible countercase before accepting a confident synthesis.',
      advisoryOnly: true,
    },
  ],
  consequential_choice: [
    {
      cardId: 'reversibility-premortem',
      label: 'Reversibility and premortem',
      sourceLocator: 'docs/history/2026-09-07-CTRL-DECISIONING-FRAMEWORK.md',
      rule: 'Test reversibility, premortem failure and opportunity cost separately from predicted upside.',
      advisoryOnly: true,
    },
    {
      cardId: 'decision-not-outcome',
      label: 'Decision quality',
      sourceLocator: 'docs/history/2026-09-07-DECISIONING CORPUS.md',
      rule: 'Assess the quality of the decision process separately from the eventual outcome.',
      advisoryOnly: true,
    },
  ],
  tacit_judgement: [
    {
      cardId: 'critical-incident-comparison',
      label: 'Critical incident comparison',
      sourceLocator: 'docs/history/2026-09-07-_INTAKE-HARNESS-SPEC.md',
      rule: 'Elicit tacit standards through real critical incidents, timeline sweeps and contrasting examples.',
      advisoryOnly: true,
    },
  ],
  memory_change: [
    {
      cardId: 'bitemporal-provenance',
      label: 'Bi-temporal provenance',
      sourceLocator: 'docs/history/2026-09-07-AI Memory Systems for Multi-Agent Architectures  The Canonical Reference (2025-2026).md',
      rule: 'Preserve valid time, recorded time, provenance, contradiction and explicit supersession.',
      advisoryOnly: true,
    },
    {
      cardId: 'memory-poisoning',
      label: 'Memory poisoning containment',
      sourceLocator: 'docs/history/2026-09-07-intel-methodology-memory-identity.md',
      rule: 'Structurally isolate untrusted content so it cannot become instruction, identity or durable truth.',
      advisoryOnly: true,
    },
  ],
  self_correction: [
    {
      cardId: 'external-feedback-loop',
      label: 'External correction loop',
      sourceLocator: 'docs/history/2026-09-07-app-data-learning.md',
      rule: 'A correction must repair downstream projections and become a regression case before the system claims learning.',
      advisoryOnly: true,
    },
  ],
  question_generation: [
    {
      cardId: 'recognition-first-intake',
      label: 'Recognition-first intake',
      sourceLocator: 'docs/history/2026-09-07-_INTERROGATION_PROMPT.md',
      rule: 'Interpret the evidence first, then ask one concrete question only when its answer can change the route.',
      advisoryOnly: true,
    },
  ],
  expert_judgement_claim: [
    {
      cardId: 'expert-judgement-quarantine',
      label: 'Expert judgement source quarantine',
      sourceLocator: 'docs/history/2026-09-07-md (2).md',
      rule: 'Use this source only to generate hypotheses or search terms until its citations are rebuilt from primary evidence.',
      advisoryOnly: true,
      warning: 'Broken or mismatched claim-to-source citations were located in the expert judgement and taste section.',
    },
  ],
}

export interface TheoryPack {
  shared: TheoryCard[]
  optional: TheoryCard[]
  splitRequired: boolean
}

export function buildTheoryPack(triggers: TheoryTrigger[]): TheoryPack {
  const optionalById = new Map<string, TheoryCard>()
  for (const trigger of triggers) {
    for (const card of OPTIONAL_THEORY_CARDS[trigger]) optionalById.set(card.cardId, card)
  }
  const optional = [...optionalById.values()]
  return {
    shared: [...SHARED_THEORY_CARDS],
    optional: optional.slice(0, 8),
    splitRequired: optional.length > 8,
  }
}

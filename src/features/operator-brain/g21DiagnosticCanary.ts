import {
  PUBLIC_CLAIM_STANDINGS,
  PUBLIC_DIAGNOSTIC_MODES,
  G21_PUBLIC_ROW_CANARY,
  type PublicClaimStanding,
  type PublicDiagnosticMode,
  type PublicEvidenceCoverage,
  type PublicEvidenceSource,
} from './g21PublicRowCanary'
import type { ExternalEvidenceDepth, ResponsibilityGate, TheoryTrigger } from './rangeCouncilContract'

export const G21_DIAGNOSTIC_SCHEMA_VERSIONS = [
  'g21-public-row-diagnostic:v1',
  'g21-public-row-diagnostic:v2',
] as const
export const G21_DIAGNOSTIC_SCHEMA_VERSION = G21_DIAGNOSTIC_SCHEMA_VERSIONS[1]
export const G21_DIAGNOSTIC_RUN_ID = 'G21-PUBLIC-ROW-RUN-002' as const

export type G21DiagnosticSchemaVersion = (typeof G21_DIAGNOSTIC_SCHEMA_VERSIONS)[number]

export const G21_RECOMMENDATION_STATES = ['abstain', 'provisional_frame'] as const
export type G21RecommendationState = (typeof G21_RECOMMENDATION_STATES)[number]

export interface G21BlindDiagnosticInput {
  schemaVersion: G21DiagnosticSchemaVersion
  runId: string
  profileId: string
  subjectLabel: string
  externalDepth: ExternalEvidenceDepth
  coverage: PublicEvidenceCoverage
  evidence: PublicEvidenceSource[]
  task: string
  authority: {
    responsibilityGate: ResponsibilityGate
    mayFrameDecision: true
    mayRecommendConsequentialAction: false
    mayInferPrivatePersonhood: false
    mayEvaluateNamedEmployees: false
  }
  theoryTriggers: TheoryTrigger[]
}

export interface G21DiagnosticNotice {
  noticeId: string
  standing: PublicClaimStanding
  claimScope: 'public_person_identity' | 'company' | 'evidence_gap'
  text: string
  evidenceIds: string[]
}

export interface G21DiagnosticResult {
  profileId: string
  diagnosticMode: PublicDiagnosticMode
  recommendationState: G21RecommendationState
  decisionFrame: string
  notices: G21DiagnosticNotice[]
  unresolved: string[]
  routeChangingQuestion: string
  answerWouldChange: string
  humanDecisionBoundary: string
}

export interface G21DiagnosticRunOutput {
  schemaVersion: G21DiagnosticSchemaVersion
  runId: string
  results: G21DiagnosticResult[]
}

const MODE_BY_DEPTH: Record<ExternalEvidenceDepth, PublicDiagnosticMode> = {
  none_or_unusable: 'intake_required',
  sparse: 'gap_first',
  useful: 'decision_pressure',
  rich_longitudinal: 'longitudinal_pressure',
}

export function buildG21BlindDiagnosticInputs(
  runId: string = G21_DIAGNOSTIC_RUN_ID,
  schemaVersion: G21DiagnosticSchemaVersion = G21_DIAGNOSTIC_SCHEMA_VERSION,
): G21BlindDiagnosticInput[] {
  return G21_PUBLIC_ROW_CANARY.map(({ manifest, coverage, evidence }) => ({
    schemaVersion,
    runId,
    profileId: manifest.profileId,
    subjectLabel: manifest.displayLabel,
    externalDepth: manifest.externalDepth,
    coverage: structuredClone(coverage),
    evidence: structuredClone(evidence),
    task:
      'Produce the most specific defensible decision diagnostic this evidence earns. Separate fact, public statement, bounded inference and evidence gap. Ask one question only when its answer could change the route. Do not fill missing evidence with generic advice.',
    authority: {
      responsibilityGate: 1,
      mayFrameDecision: true,
      mayRecommendConsequentialAction: false,
      mayInferPrivatePersonhood: false,
      mayEvaluateNamedEmployees: false,
    },
    theoryTriggers: ['claim_or_inference', 'consequential_choice', 'question_generation'],
  }))
}

function requiredText(value: string, code: string, errors: string[], max = 420): void {
  if (!value.trim()) errors.push(code)
  if (value.length > max) errors.push(`${code}_too_long`)
}

const SURFACE_JARGON = [
  /\battribut(?:e|able|ion)\b/i,
  /\bcommercial causation\b/i,
  /\bcontribution margin\b/i,
  /\bworkload-level economics\b/i,
  /\bcapacity-constrained\b/i,
  /\bportfolio-allocation\b/i,
] as const

function validatePlainLanguageSurface(result: G21DiagnosticResult, errors: string[]): void {
  const fields = [
    ['decision_frame', result.decisionFrame],
    ['route_changing_question', result.routeChangingQuestion],
    ['answer_effect', result.answerWouldChange],
  ] as const
  for (const [field, value] of fields) {
    if (SURFACE_JARGON.some((pattern) => pattern.test(value))) {
      errors.push(`${result.profileId}:${field}_contains_specialist_jargon`)
    }
  }

  const questionMarks = [...result.routeChangingQuestion].filter((character) => character === '?').length
  const questionWords = result.routeChangingQuestion.trim().split(/\s+/).filter(Boolean).length
  if (questionMarks !== 1 || !result.routeChangingQuestion.trim().endsWith('?')) {
    errors.push(`${result.profileId}:one_explicit_question_required`)
  }
  if (questionWords > 30) errors.push(`${result.profileId}:question_too_complex_for_surface`)
  if (result.decisionFrame.trim().split(/\s+/).filter(Boolean).length > 75) {
    errors.push(`${result.profileId}:decision_frame_too_complex_for_surface`)
  }
}

export function validateG21DiagnosticRun(
  inputs: G21BlindDiagnosticInput[],
  output: G21DiagnosticRunOutput,
): string[] {
  const errors: string[] = []
  const inputById = new Map(inputs.map((input) => [input.profileId, input]))
  const outputIds = output.results.map((result) => result.profileId)
  const inputRunIds = new Set(inputs.map((input) => input.runId))

  const inputSchemaVersions = new Set(inputs.map((input) => input.schemaVersion))
  if (!G21_DIAGNOSTIC_SCHEMA_VERSIONS.includes(output.schemaVersion)) {
    errors.push('schema_version_invalid')
  }
  if (inputSchemaVersions.size !== 1 || !inputSchemaVersions.has(output.schemaVersion)) {
    errors.push('schema_version_mismatch')
  }
  if (inputRunIds.size !== 1) errors.push('input_requires_one_run_id')
  if (!/^G21-PUBLIC-ROW-RUN-\d{3}$/.test(output.runId)) errors.push('run_id_invalid')
  if (inputRunIds.size === 1 && !inputRunIds.has(output.runId)) errors.push('run_id_mismatch')
  if (output.results.length !== inputs.length) errors.push('one_result_per_input_required')
  if (new Set(outputIds).size !== outputIds.length) errors.push('result_profile_ids_must_be_unique')

  for (const input of inputs) {
    if (!outputIds.includes(input.profileId)) errors.push(`${input.profileId}:result_required`)
  }

  for (const result of output.results) {
    const input = inputById.get(result.profileId)
    if (!input) {
      errors.push(`${result.profileId}:unknown_profile`)
      continue
    }

    const evidenceIds = input.evidence.map((source) => source.sourceId)
    if (!PUBLIC_DIAGNOSTIC_MODES.includes(result.diagnosticMode)) {
      errors.push(`${result.profileId}:diagnostic_mode_invalid`)
    }
    if (result.diagnosticMode !== MODE_BY_DEPTH[input.externalDepth]) {
      errors.push(`${result.profileId}:diagnostic_mode_depth_mismatch`)
    }
    if (!G21_RECOMMENDATION_STATES.includes(result.recommendationState)) {
      errors.push(`${result.profileId}:recommendation_state_invalid`)
    }
    if (
      (input.externalDepth === 'none_or_unusable' || input.externalDepth === 'sparse') &&
      result.recommendationState !== 'abstain'
    ) {
      errors.push(`${result.profileId}:weak_evidence_requires_abstention`)
    }

    requiredText(result.decisionFrame, `${result.profileId}:decision_frame_required`, errors)
    requiredText(
      result.routeChangingQuestion,
      `${result.profileId}:route_changing_question_required`,
      errors,
      260,
    )
    requiredText(
      result.answerWouldChange,
      `${result.profileId}:answer_effect_required`,
      errors,
      320,
    )
    requiredText(
      result.humanDecisionBoundary,
      `${result.profileId}:human_decision_boundary_required`,
      errors,
      320,
    )
    if (output.schemaVersion === 'g21-public-row-diagnostic:v2') {
      validatePlainLanguageSurface(result, errors)
    }

    if (result.notices.length < 1 || result.notices.length > 3) {
      errors.push(`${result.profileId}:requires_one_to_three_notices`)
    }
    if (result.unresolved.length < 1 || result.unresolved.length > 3) {
      errors.push(`${result.profileId}:requires_one_to_three_unknowns`)
    }
    if (result.unresolved.some((item) => !item.trim() || item.length > 300)) {
      errors.push(`${result.profileId}:unknown_invalid`)
    }

    const noticeIds = result.notices.map((notice) => notice.noticeId)
    if (new Set(noticeIds).size !== noticeIds.length) {
      errors.push(`${result.profileId}:notice_ids_must_be_unique`)
    }

    for (const notice of result.notices) {
      if (!/^DIAG-[A-Z0-9-]+$/.test(notice.noticeId)) {
        errors.push(`${result.profileId}:${notice.noticeId}:notice_id_invalid`)
      }
      if (!PUBLIC_CLAIM_STANDINGS.includes(notice.standing)) {
        errors.push(`${result.profileId}:${notice.noticeId}:standing_invalid`)
      }
      requiredText(
        notice.text,
        `${result.profileId}:${notice.noticeId}:notice_text_required`,
        errors,
        360,
      )
      if (notice.standing === 'evidence_gap') {
        if (notice.evidenceIds.length > 0) {
          errors.push(`${result.profileId}:${notice.noticeId}:gap_cannot_claim_evidence`)
        }
        if (notice.claimScope !== 'evidence_gap') {
          errors.push(`${result.profileId}:${notice.noticeId}:gap_scope_required`)
        }
      } else {
        if (notice.evidenceIds.length === 0) {
          errors.push(`${result.profileId}:${notice.noticeId}:evidence_required`)
        }
        if (notice.claimScope === 'evidence_gap') {
          errors.push(`${result.profileId}:${notice.noticeId}:evidenced_notice_scope_invalid`)
        }
      }
      if (notice.standing === 'bounded_inference' && notice.evidenceIds.length < 2) {
        errors.push(`${result.profileId}:${notice.noticeId}:bounded_inference_requires_two_sources`)
      }
      for (const evidenceId of notice.evidenceIds) {
        if (!evidenceIds.includes(evidenceId)) {
          errors.push(`${result.profileId}:${notice.noticeId}:unknown_${evidenceId}`)
        }
      }
    }

    if (input.externalDepth === 'none_or_unusable') {
      if (result.notices.some((notice) => notice.standing !== 'evidence_gap')) {
        errors.push(`${result.profileId}:cold_start_may_only_report_gaps`)
      }
      if (result.notices.some((notice) => notice.evidenceIds.length > 0)) {
        errors.push(`${result.profileId}:cold_start_cannot_cite_evidence`)
      }
    }
  }

  return errors
}

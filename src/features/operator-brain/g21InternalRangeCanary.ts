import {
  EXTERNAL_EVIDENCE_DEPTHS,
  INTERNAL_EVIDENCE_DEPTHS,
  RANGE_RUNTIME_STATES,
  validateProfileManifest,
  type ExternalEvidenceDepth,
  type InternalEvidenceDepth,
  type RangeCase,
  type RangeProfileManifest,
  type RangeRuntimeState,
} from './rangeCouncilContract'
import {
  G21_PUBLIC_ROW_CANARY,
  type PublicEvidenceCoverage,
} from './g21PublicRowCanary'

export const G21_NONZERO_INTERNAL_DEPTHS = [
  'basic_intake',
  'work_evidence',
  'longitudinal_corrections',
] as const satisfies readonly InternalEvidenceDepth[]

export const G21_INTERNAL_SOURCE_TYPES = [
  'opening_intake',
  'leader_reflection',
  'meeting_transcript',
  'work_artifact',
  'operating_metric',
  'customer_evidence',
  'staff_evidence',
  'observed_choice',
  'decision_outcome',
  'direct_correction',
] as const

export const G21_SYNTHETIC_EXTERNAL_SOURCE_TYPES = [
  'company_identity',
  'company_strategy',
  'company_result',
  'market_signal',
  'countercase',
  'historical_record',
] as const

export const G21_INTERNAL_CLAIM_STANDINGS = [
  'synthetic_public_context',
  'direct_statement',
  'work_observation',
  'measured_result',
  'supported_pattern',
  'authorised_correction',
  'evidence_gap',
] as const

export const G21_INTERNAL_AUDIENCES = ['leader_private', 'company_private'] as const

export const G21_INTERNAL_SUBJECT_SCOPES = [
  'leader',
  'company',
  'customer',
  'staff_group',
  'work',
] as const

export const G21_INTERNAL_ASSERTION_KINDS = [
  'direct_statement',
  'observation',
  'interpretation',
  'authorised_correction',
] as const

export const G21_ANSWER_SHAPES = [
  'choice',
  'number',
  'threshold',
  'yes_no',
  'short_description',
] as const

export const G21_ROUTE_EFFECT_TYPES = ['select', 'stop', 'bound', 'reshape'] as const

export const G21_INTERNAL_RANGE_EVIDENCE_AS_OF = '2026-09-10T17:54:06.000Z'

export type G21NonzeroInternalDepth = (typeof G21_NONZERO_INTERNAL_DEPTHS)[number]
export type G21InternalSourceType = (typeof G21_INTERNAL_SOURCE_TYPES)[number]
export type G21InternalClaimStanding = (typeof G21_INTERNAL_CLAIM_STANDINGS)[number]
export type G21InternalAudience = (typeof G21_INTERNAL_AUDIENCES)[number]
export type G21InternalSubjectScope = (typeof G21_INTERNAL_SUBJECT_SCOPES)[number]
export type G21InternalAssertionKind = (typeof G21_INTERNAL_ASSERTION_KINDS)[number]
export type G21AnswerShape = (typeof G21_ANSWER_SHAPES)[number]
export type G21RouteEffectType = (typeof G21_ROUTE_EFFECT_TYPES)[number]

export interface G21FictionalIdentity {
  fictionalIdentityKey: string
  displayName: string
  role: string
  organisation: string
  organisationDescription: string
  decisionFamily: string
}

export interface G21SyntheticExternalEvidence {
  sourceId: string
  locator: string
  title: string
  sourceType:
    | 'company_identity'
    | 'company_strategy'
    | 'company_result'
    | 'market_signal'
    | 'countercase'
    | 'historical_record'
  publishedOn: string
  retrievedOn: string
  summary: string
  limitations: string[]
  syntheticDisclosure: string
}

export interface G21InternalEvidenceClaim {
  claimId: string
  text: string
  kind: G21InternalAssertionKind
  subjectScope: G21InternalSubjectScope
  challengesClaimIds: string[]
  supersedesClaimIds: string[]
}

export interface G21InternalEvidenceRecord {
  evidenceId: string
  sourceType: G21InternalSourceType
  subjectScope: G21InternalSubjectScope
  audience: G21InternalAudience
  validAt: string
  recordedAt: string
  content: string
  sourceLocator: string
  fixtureAuthority: 'synthetic_fixture_authoring'
  claims: G21InternalEvidenceClaim[]
}

export interface G21InternalAudienceAuthority {
  authorityId: string
  evidenceId: string
  authorisedAudience: G21InternalAudience
  authorityType: 'synthetic_fixture_authoring'
  authorisedAt: string
}

export interface G21ResolvedInternalClaim extends G21InternalEvidenceClaim {
  evidenceId: string
  sourceLocator: string
  audience: G21InternalAudience
  status: 'current' | 'disputed' | 'superseded'
  challengedByClaimIds: string[]
  supersededByClaimIds: string[]
}

export interface G21RouteAnswerContract {
  options: string[]
  unit: string | null
  denominator: string | null
  comparator: string | null
  unknownAllowed: true
  evidenceRequestIfUnknown: string
  optionalNoteAllowed: true
  routeEffects: {
    answer: string
    effect: G21RouteEffectType
    routeChange: string
  }[]
  unknownRouteEffect: {
    effect: G21RouteEffectType
    routeChange: string
  }
}

export interface G21InternalAllowedNotice {
  noticeId: string
  standing: G21InternalClaimStanding
  text: string
  evidenceIds: string[]
}

export interface G21InternalOracle {
  decisionMagnitude: string
  decisionFocus: string
  strongestSupportedView: string
  countercase: string
  allowedNotices: G21InternalAllowedNotice[]
  unresolved: string[]
  routeChangingQuestion: string
  expectedAnswerShape: G21AnswerShape
  answerContract: G21RouteAnswerContract
  answerWouldChange: string
  humanDecisionBoundary: string
  expectedDiagnosticBehaviours: string[]
  forbiddenClaims: string[]
}

export interface G21InternalLifecycleOracle {
  runtimeState: RangeRuntimeState
  evidenceIdsAdded: string[]
  expectedNotices: string[]
  forbiddenClaims: string[]
}

export interface G21InternalRangeProfile {
  manifest: RangeProfileManifest
  familyId: string
  identity: G21FictionalIdentity
  externalCoverage: PublicEvidenceCoverage
  externalEvidence: G21SyntheticExternalEvidence[]
  evidenceAsOf: string
  internalEvidence: G21InternalEvidenceRecord[]
  lifecycleEvidence: G21InternalEvidenceRecord[]
  audienceAuthorities: G21InternalAudienceAuthority[]
  lifecycleOracle: Record<RangeRuntimeState, G21InternalLifecycleOracle>
  oracle: G21InternalOracle
}

export interface G21InternalBlindInput {
  schemaVersion: 'g21-internal-range-input:v4'
  runId: string
  caseId: string
  profileId: string
  runtimeState: RangeRuntimeState
  subject: G21FictionalIdentity
  externalDepth: ExternalEvidenceDepth
  internalDepth: G21NonzeroInternalDepth
  evidenceAsOf: string
  externalCoverage: PublicEvidenceCoverage
  externalEvidence: G21SyntheticExternalEvidence[]
  internalEvidence: G21InternalEvidenceRecord[]
  audienceAuthorities: G21InternalAudienceAuthority[]
  currentClaims: G21ResolvedInternalClaim[]
  task: string
  authority: {
    responsibilityGate: 1
    mayFrameDecision: true
    mayRecommendConsequentialAction: false
    mayPromoteDurableTruth: false
    mayEvaluateNamedEmployees: false
  }
}

type G21InternalEvidenceClaimDraft = Pick<G21InternalEvidenceClaim, 'claimId' | 'text'> &
  Partial<
    Pick<
      G21InternalEvidenceClaim,
      'kind' | 'subjectScope' | 'challengesClaimIds' | 'supersedesClaimIds'
    >
  >

type G21InternalEvidenceDraft = Omit<
  G21InternalEvidenceRecord,
  'fixtureAuthority' | 'claims'
> & {
  claims?: G21InternalEvidenceClaimDraft[]
  challengesClaimIds?: string[]
  supersedesClaimIds?: string[]
}

type AllowedNoticeDraft = Omit<G21InternalAllowedNotice, 'noticeId'>

interface OracleDraft extends Omit<G21InternalOracle, 'allowedNotices' | 'answerContract'> {
  allowedNotices: AllowedNoticeDraft[]
}

interface LifecycleDraft {
  conflict: Omit<G21InternalEvidenceDraft, 'evidenceId'>
  correction: Omit<G21InternalEvidenceDraft, 'evidenceId' | 'supersedesClaimIds'>
  retireConflictClaimIndexes?: number[]
  contradictedExpected: string[]
  correctedExpected: string[]
  additionalForbidden: string[]
}

interface StageDraft {
  oracle: OracleDraft
  lifecycle: LifecycleDraft
}

interface FamilyDraft {
  familyId: string
  code: string
  externalDepth: ExternalEvidenceDepth
  identity: G21FictionalIdentity
  externalEvidence: G21SyntheticExternalEvidence[]
  basicEvidence: G21InternalEvidenceRecord[]
  workEvidence: G21InternalEvidenceRecord[]
  longitudinalEvidence: G21InternalEvidenceRecord[]
  stages: Record<G21NonzeroInternalDepth, StageDraft>
}

const FICTIONAL_DISCLOSURE =
  'Wholly fictional leader, company and private evidence authored only for deterministic product testing.'
const SYNTHETIC_EXTERNAL_DISCLOSURE =
  'Fictional public-style source authored for evidence-range testing. It is not real company research.'

const EXPECTED_EXTERNAL_COVERAGE: Record<ExternalEvidenceDepth, PublicEvidenceCoverage> = {
  none_or_unusable: {
    currentIdentity: false,
    currentBusinessContext: false,
    currentDecisionTension: false,
    currentOutcomeEvidence: false,
    currentCountercase: false,
    longitudinalContinuity: false,
  },
  sparse: {
    currentIdentity: true,
    currentBusinessContext: true,
    currentDecisionTension: false,
    currentOutcomeEvidence: false,
    currentCountercase: false,
    longitudinalContinuity: false,
  },
  useful: {
    currentIdentity: true,
    currentBusinessContext: true,
    currentDecisionTension: true,
    currentOutcomeEvidence: true,
    currentCountercase: true,
    longitudinalContinuity: false,
  },
  rich_longitudinal: {
    currentIdentity: true,
    currentBusinessContext: true,
    currentDecisionTension: true,
    currentOutcomeEvidence: true,
    currentCountercase: true,
    longitudinalContinuity: true,
  },
}

const BASIC_SOURCE_TYPES: readonly G21InternalSourceType[] = [
  'opening_intake',
  'leader_reflection',
]
const WORK_SOURCE_TYPES: readonly G21InternalSourceType[] = [
  'meeting_transcript',
  'work_artifact',
  'operating_metric',
  'customer_evidence',
  'staff_evidence',
  'observed_choice',
]
const MEASURED_SOURCE_TYPES: readonly G21InternalSourceType[] = [
  'operating_metric',
  'decision_outcome',
]
const DIRECT_SOURCE_TYPES: readonly G21InternalSourceType[] = [
  'opening_intake',
  'leader_reflection',
  'direct_correction',
]
const SOURCE_SUBJECT_CAPABILITIES: Record<
  G21InternalSourceType,
  readonly G21InternalSubjectScope[]
> = {
  opening_intake: ['leader', 'company'],
  leader_reflection: ['leader'],
  meeting_transcript: ['leader', 'company', 'staff_group', 'work'],
  work_artifact: ['company', 'staff_group', 'work'],
  operating_metric: ['company', 'customer', 'staff_group', 'work'],
  customer_evidence: ['customer'],
  staff_evidence: ['staff_group'],
  observed_choice: ['leader', 'company'],
  decision_outcome: ['company', 'customer', 'staff_group', 'work'],
  direct_correction: ['leader', 'company', 'customer', 'staff_group', 'work'],
}
const ROUTE_QUESTION_JARGON = [
  /\bheld[- ]out\b/i,
  /\boperating model\b/i,
  /\bcausal(?:ity)?\b/i,
  /\battribut(?:e|able|ion)\b/i,
  /\bleverage\b/i,
  /\bbad referral data\b/i,
  /\bscheduling logic\b/i,
  /\bcustomer risk\b/i,
  /\bexceptions?\b/i,
  /\bticket intent\b/i,
  /\bfair comparison\b/i,
  /\bexhausting core fans\b/i,
] as const
const CATEGORICAL_CAUSAL_CLAIM =
  /\b(?:causes?|caused|proves? that|is the cause of|led directly to)\b/i
const NON_HUMAN_FINAL_CALL_OPTION = /\b(?:ai|system|model|automation|agent)\b/i

function externalSource(
  draft: Omit<G21SyntheticExternalEvidence, 'syntheticDisclosure'>,
): G21SyntheticExternalEvidence {
  return { ...draft, syntheticDisclosure: SYNTHETIC_EXTERNAL_DISCLOSURE }
}

function defaultAssertionKind(sourceType: G21InternalSourceType): G21InternalAssertionKind {
  if (sourceType === 'direct_correction') return 'authorised_correction'
  if (DIRECT_SOURCE_TYPES.includes(sourceType)) return 'direct_statement'
  return 'observation'
}

function internalEvidence(draft: G21InternalEvidenceDraft): G21InternalEvidenceRecord {
  const {
    claims: claimDrafts,
    challengesClaimIds = [],
    supersedesClaimIds = [],
    ...record
  } = draft
  const claims = claimDrafts ?? [
    {
      claimId: `${draft.evidenceId}-CLAIM-01`,
      text: draft.content,
    },
  ]
  return {
    ...record,
    claims: claims.map((claim, index) => ({
      ...claim,
      kind: claim.kind ?? defaultAssertionKind(draft.sourceType),
      subjectScope: claim.subjectScope ?? draft.subjectScope,
      challengesClaimIds: claim.challengesClaimIds ?? (index === 0 ? challengesClaimIds : []),
      supersedesClaimIds: claim.supersedesClaimIds ?? (index === 0 ? supersedesClaimIds : []),
    })),
    fixtureAuthority: 'synthetic_fixture_authoring',
  }
}

function audienceAuthority(record: G21InternalEvidenceRecord): G21InternalAudienceAuthority {
  return {
    authorityId: `AUTH-${record.evidenceId}`,
    evidenceId: record.evidenceId,
    authorisedAudience: record.audience,
    authorityType: 'synthetic_fixture_authoring',
    authorisedAt: record.recordedAt,
  }
}

function sameStringSet(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.every((value) => right.includes(value))
  )
}

function sameStringsInOrder(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function validIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/.test(value)) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value
}

function exactCoverage(
  actual: PublicEvidenceCoverage,
  expected: PublicEvidenceCoverage,
): boolean {
  return Object.entries(expected).every(
    ([key, value]) => actual[key as keyof PublicEvidenceCoverage] === value,
  )
}

function depthCode(depth: G21NonzeroInternalDepth): string {
  return {
    basic_intake: 'I1',
    work_evidence: 'I2',
    longitudinal_corrections: 'I3',
  }[depth]
}

function evidenceForDepth(
  family: FamilyDraft,
  depth: G21NonzeroInternalDepth,
): G21InternalEvidenceRecord[] {
  const evidence = [...family.basicEvidence]
  if (depth === 'work_evidence' || depth === 'longitudinal_corrections') {
    evidence.push(...family.workEvidence)
  }
  if (depth === 'longitudinal_corrections') evidence.push(...family.longitudinalEvidence)
  return evidence
}

function makeProfile(
  family: FamilyDraft,
  internalDepth: G21NonzeroInternalDepth,
): G21InternalRangeProfile {
  const stage = family.stages[internalDepth]
  const profileId = `RANGE-INTERNAL-${family.code}-${depthCode(internalDepth)}`
  const conflictId = `LIFE-${family.code}-${depthCode(internalDepth)}-CONFLICT`
  const correctionId = `LIFE-${family.code}-${depthCode(internalDepth)}-CORRECTION`
  const conflict = internalEvidence({ evidenceId: conflictId, ...stage.lifecycle.conflict })
  const retireConflictClaimIndexes = stage.lifecycle.retireConflictClaimIndexes ?? [0]
  const correction = internalEvidence({
    evidenceId: correctionId,
    ...stage.lifecycle.correction,
    supersedesClaimIds: retireConflictClaimIndexes.map(
      (index) => conflict.claims[index]?.claimId ?? `${conflictId}-CLAIM-MISSING`,
    ),
  })
  const forbiddenClaims = [...stage.oracle.forbiddenClaims]
  const depthEvidence = structuredClone(evidenceForDepth(family, internalDepth))
  const lifecycleEvidence = [conflict, correction]

  return {
    manifest: {
      profileId,
      displayLabel: `${family.identity.displayName} at ${family.identity.organisation}, fictional fixture`,
      namespace: 'synthetic_fixture',
      externalDepth: family.externalDepth,
      internalDepth,
      realNamedPerson: false,
      publicSourceLocators: family.externalEvidence.map((source) => source.locator),
      syntheticDisclosure: FICTIONAL_DISCLOSURE,
    },
    familyId: family.familyId,
    identity: structuredClone(family.identity),
    externalCoverage: { ...EXPECTED_EXTERNAL_COVERAGE[family.externalDepth] },
    externalEvidence: structuredClone(family.externalEvidence),
    evidenceAsOf: G21_INTERNAL_RANGE_EVIDENCE_AS_OF,
    internalEvidence: depthEvidence,
    lifecycleEvidence,
    audienceAuthorities: [...depthEvidence, ...lifecycleEvidence].map(audienceAuthority),
    lifecycleOracle: {
      initial: {
        runtimeState: 'initial',
        evidenceIdsAdded: [],
        expectedNotices: [...stage.oracle.expectedDiagnosticBehaviours],
        forbiddenClaims,
      },
      contradicted: {
        runtimeState: 'contradicted',
        evidenceIdsAdded: [conflictId],
        expectedNotices: [...stage.lifecycle.contradictedExpected],
        forbiddenClaims: [...forbiddenClaims, ...stage.lifecycle.additionalForbidden],
      },
      corrected: {
        runtimeState: 'corrected',
        evidenceIdsAdded: [conflictId, correctionId],
        expectedNotices: [...stage.lifecycle.correctedExpected],
        forbiddenClaims: [...forbiddenClaims, ...stage.lifecycle.additionalForbidden],
      },
    },
    oracle: {
      ...structuredClone(stage.oracle),
      answerContract: structuredClone(G21_ANSWER_CONTRACTS[profileId]),
      allowedNotices: stage.oracle.allowedNotices.map((notice, index) => ({
        ...structuredClone(notice),
        noticeId: `NOTICE-${family.code}-${depthCode(internalDepth)}-${String(index + 1).padStart(2, '0')}`,
      })),
    },
  }
}

const familyDrafts: FamilyDraft[] = [
  {
    familyId: 'fictional-care-scheduling',
    code: 'CARE',
    externalDepth: 'none_or_unusable',
    identity: {
      fictionalIdentityKey: 'fictional-elena-ward',
      displayName: 'Elena Ward',
      role: 'Chief Executive',
      organisation: 'Marrow & Tide Care',
      organisationDescription:
        'A fictional six-district home-care provider deciding whether AI should coordinate visits at scale.',
      decisionFamily: 'work_allocation_and_human_ai_boundary',
    },
    externalEvidence: [],
    basicEvidence: [
      internalEvidence({
        evidenceId: 'INT-CARE-001',
        sourceType: 'opening_intake',
        subjectScope: 'company',
        audience: 'leader_private',
        validAt: '2026-06-02T09:00:00.000Z',
        recordedAt: '2026-06-02T09:04:00.000Z',
        content:
          'We have six weeks to decide whether to scale an AI scheduling pilot from one district to all six. The board has set aside GBP 1.8 million. My current preference is a limited pilot because a missed care visit is not an acceptable price for speed.',
        sourceLocator: 'fixture://care/opening-intake/001',
      }),
      internalEvidence({
        evidenceId: 'INT-CARE-002',
        sourceType: 'leader_reflection',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-06-02T09:08:00.000Z',
        recordedAt: '2026-06-02T09:09:00.000Z',
        content:
          'My current main gate is that a coordinator must own every exception. I must own the scale decision. Saving staff time on its own will not earn a rollout.',
        claims: [
          {
            claimId: 'INT-CARE-002-CLAIM-01',
            text: 'Coordinator ownership of every exception is the main rollout gate.',
          },
          {
            claimId: 'INT-CARE-002-CLAIM-02',
            text: 'Elena owns the scale decision.',
          },
          {
            claimId: 'INT-CARE-002-CLAIM-03',
            text: 'Saving staff time alone will not earn a rollout.',
          },
        ],
        sourceLocator: 'fixture://care/leader-reflection/002',
      }),
    ],
    workEvidence: [
      internalEvidence({
        evidenceId: 'INT-CARE-003',
        sourceType: 'operating_metric',
        subjectScope: 'work',
        audience: 'company_private',
        validAt: '2026-06-16T17:00:00.000Z',
        recordedAt: '2026-06-17T08:00:00.000Z',
        content:
          'An eight-week sample shows coordinators spent 31 percent of their time re-keying referrals and manually repaired 17 percent of scheduled visits.',
        sourceLocator: 'fixture://care/operations/eight-week-sample',
      }),
      internalEvidence({
        evidenceId: 'INT-CARE-004',
        sourceType: 'operating_metric',
        subjectScope: 'work',
        audience: 'company_private',
        validAt: '2026-06-19T16:00:00.000Z',
        recordedAt: '2026-06-19T16:20:00.000Z',
        content:
          'In a blind planning test, the AI schedule filled 96.2 percent of visits versus 91.7 percent for the current process, but it created two travel sequences that a coordinator rejected as unsafe.',
        claims: [
          {
            claimId: 'INT-CARE-004-CLAIM-01',
            text: 'The AI schedule filled 96.2 percent of visits versus 91.7 percent for the current process.',
          },
          {
            claimId: 'INT-CARE-004-CLAIM-02',
            text: 'The AI schedule created two travel sequences that a coordinator rejected as unsafe.',
          },
        ],
        sourceLocator: 'fixture://care/blind-comparison/004',
      }),
      internalEvidence({
        evidenceId: 'INT-CARE-005',
        sourceType: 'customer_evidence',
        subjectScope: 'customer',
        audience: 'company_private',
        validAt: '2026-06-21T15:00:00.000Z',
        recordedAt: '2026-06-22T09:10:00.000Z',
        content:
          'Nine of twelve interviewed families with complex care needs ranked continuity of carer above a tighter arrival window.',
        sourceLocator: 'fixture://care/family-interviews/005',
      }),
      internalEvidence({
        evidenceId: 'INT-CARE-006',
        sourceType: 'observed_choice',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-06-23T11:00:00.000Z',
        recordedAt: '2026-06-23T11:08:00.000Z',
        content:
          'Elena rejected the higher-fill schedule when it assigned four carers to one complex case and chose a plan with one late window but one consistent carer.',
        sourceLocator: 'fixture://care/decision-review/006',
      }),
    ],
    longitudinalEvidence: [
      internalEvidence({
        evidenceId: 'INT-CARE-007',
        sourceType: 'decision_outcome',
        subjectScope: 'company',
        audience: 'company_private',
        validAt: '2026-08-28T17:00:00.000Z',
        recordedAt: '2026-08-29T09:00:00.000Z',
        content:
          'After twelve pilot weeks, unfilled visits fell from 8.3 to 4.9 percent and coordinator admin time fell 26 percent, while continuity for complex cases fell from 82 to 71 percent.',
        sourceLocator: 'fixture://care/pilot/outcome-007',
      }),
      internalEvidence({
        evidenceId: 'INT-CARE-008',
        sourceType: 'direct_correction',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-08-30T10:00:00.000Z',
        recordedAt: '2026-08-30T10:02:00.000Z',
        content:
          'I was wrong to make exception ownership the main gate. Continuity for complex care is the gate. Coordinator review is one way to protect it, not the result itself.',
        sourceLocator: 'fixture://care/correction/008',
        supersedesClaimIds: ['INT-CARE-002-CLAIM-01'],
      }),
      internalEvidence({
        evidenceId: 'INT-CARE-009',
        sourceType: 'observed_choice',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-08-31T14:00:00.000Z',
        recordedAt: '2026-08-31T14:03:00.000Z',
        content:
          'Elena paused expansion to the other five districts despite the time saving and asked the team to restore complex-care continuity first.',
        sourceLocator: 'fixture://care/scale-gate/009',
      }),
    ],
    stages: {
      basic_intake: {
        oracle: {
          decisionMagnitude: 'A board-backed GBP 1.8 million rollout across six care districts.',
          decisionFocus:
            'Whether to run a limited AI scheduling pilot or commit the whole care network before the safety and service gates are known.',
          strongestSupportedView:
            'Elena has set a human-owned exception and scale boundary, but no operating evidence yet shows whether the pilot is safe or valuable.',
          countercase:
            'A limited pilot can still expose vulnerable customers to harm if the stopping rules are vague.',
          allowedNotices: [
            {
              standing: 'direct_statement',
              text: 'The board has reserved GBP 1.8 million and expects a scale decision within six weeks.',
              evidenceIds: ['INT-CARE-001'],
            },
            {
              standing: 'direct_statement',
              text: 'Elena says time saving alone cannot earn rollout and keeps the scale call with a human.',
              evidenceIds: ['INT-CARE-002'],
            },
            {
              standing: 'evidence_gap',
              text: 'No comparison yet shows service, safety or continuity under the pilot.',
              evidenceIds: [],
            },
          ],
          unresolved: ['The stopping conditions and baseline service measures are not defined.'],
          routeChangingQuestion:
            'Which failure would make you stop the pilot even if it saves staff time?',
          expectedAnswerShape: 'short_description',
          answerWouldChange:
            'It decides whether a bounded pilot is responsible enough to start and what must be monitored from day one.',
          humanDecisionBoundary:
            'Elena sets the safety and service gates, approves the pilot and owns any decision to scale.',
          expectedDiagnosticBehaviours: [
            'Name the decision, money, deadline and human boundary without choosing a route.',
            'Ask for one stopping rule before requesting more personal context.',
          ],
          forbiddenClaims: [
            'The pilot is safe, valuable or ready to scale.',
            'Elena distrusts staff or resists AI.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'leader_reflection',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-06-03T10:00:00.000Z',
            recordedAt: '2026-06-03T10:01:00.000Z',
            content: 'Speed may matter enough that we should scale first and repair exceptions as we go.',
            sourceLocator: 'fixture://care/lifecycle/basic/conflict',
            challengesClaimIds: [
              'INT-CARE-001-CLAIM-01',
              'INT-CARE-002-CLAIM-01',
              'INT-CARE-002-CLAIM-03',
            ],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-06-04T09:00:00.000Z',
            recordedAt: '2026-06-04T09:01:00.000Z',
            content:
              'Do not treat yesterday as a new policy. It was pressure-testing. The limited pilot remains my current view until the stop rules are explicit.',
            sourceLocator: 'fixture://care/lifecycle/basic/correction',
          },
          contradictedExpected: [
            'Show two incompatible leader statements and ask which one is current.',
            'Stop either statement from silently becoming a settled policy.',
          ],
          correctedExpected: [
            'Restore the limited-pilot view as current while preserving the pressure-test in history.',
            'Keep the stopping-rule gap open.',
          ],
          additionalForbidden: ['Recency alone proves that full rollout is Elena current policy.'],
        },
      },
      work_evidence: {
        oracle: {
          decisionMagnitude: 'A board-backed GBP 1.8 million rollout affecting care across six districts.',
          decisionFocus:
            'Whether the service gain survives the two unsafe schedules and the continuity standard families value.',
          strongestSupportedView:
            'The pilot may remove real admin and fill more visits, but its safety and continuity failure modes are now more important than raw fill rate.',
          countercase:
            'The two unsafe sequences may be caused by bad referral data rather than the scheduling logic.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'The blind test filled more visits but produced two schedules a coordinator judged unsafe.',
              evidenceIds: ['INT-CARE-004'],
            },
            {
              standing: 'supported_pattern',
              text: 'For complex care, continuity can matter more than a tighter time window.',
              evidenceIds: ['INT-CARE-005', 'INT-CARE-006'],
            },
            {
              standing: 'evidence_gap',
              text: 'The source of the unsafe schedules is not yet established.',
              evidenceIds: [],
            },
          ],
          unresolved: ['Whether source data or scheduling logic caused the unsafe travel sequences.'],
          routeChangingQuestion:
            'Out of 1,000 scheduled journeys, how many unsafe ones would stop the rollout?',
          expectedAnswerShape: 'threshold',
          answerWouldChange:
            'It sets the safety limit. The evidence beneath it can then locate whether data, scheduling or both need repair.',
          humanDecisionBoundary:
            'Care coordinators can reject unsafe schedules, while Elena owns the service standard and scale decision.',
          expectedDiagnosticBehaviours: [
            'Put safety and continuity ahead of the better fill rate.',
            'Separate a data failure from a scheduling failure before recommending a test.',
          ],
          forbiddenClaims: [
            'The AI schedule is safer or ready to scale.',
            'Continuity always matters more than arrival time for every family.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'operating_metric',
            subjectScope: 'work',
            audience: 'company_private',
            validAt: '2026-06-25T17:00:00.000Z',
            recordedAt: '2026-06-26T08:00:00.000Z',
            content:
              'A corrected dashboard reports that no unsafe travel sequences occurred during the blind planning test.',
            sourceLocator: 'fixture://care/lifecycle/work/conflict',
            challengesClaimIds: ['INT-CARE-004-CLAIM-02'],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'work',
            audience: 'company_private',
            validAt: '2026-06-27T11:00:00.000Z',
            recordedAt: '2026-06-27T11:02:00.000Z',
            content:
              'The dashboard filtered out rejected schedules. Two unsafe sequences did occur and must remain in the pilot record.',
            sourceLocator: 'fixture://care/lifecycle/work/correction',
          },
          contradictedExpected: [
            'Flag the disagreement between the dashboard and the blind-test artifact.',
            'Pause any safety conclusion until the filter and source rows are checked.',
          ],
          correctedExpected: [
            'Supersede the filtered dashboard claim, preserve both records and restore the two safety failures to the current view.',
            'Keep the cause of those failures unresolved.',
          ],
          additionalForbidden: ['The latest dashboard automatically outranks the underlying test artifact.'],
        },
      },
      longitudinal_corrections: {
        oracle: {
          decisionMagnitude: 'A board-backed GBP 1.8 million rollout affecting care across six districts.',
          decisionFocus:
            'Whether the pilot can restore complex-care continuity without Elena becoming the permanent exception handler.',
          strongestSupportedView:
            'The pilot earns more testing because it reduced unfilled visits and admin, but it has not earned scale because the leader corrected the gate to complex-care continuity and paused expansion when that worsened.',
          countercase:
            'The continuity drop may be a temporary tuning problem rather than a reason to reject the operating model.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'The pilot improved visit fill and admin time while complex-care continuity fell eleven points.',
              evidenceIds: ['INT-CARE-007'],
            },
            {
              standing: 'authorised_correction',
              text: 'Elena replaced exception ownership with complex-care continuity as the main scale gate.',
              evidenceIds: ['INT-CARE-008'],
            },
            {
              standing: 'supported_pattern',
              text: 'Elena stops a rollout when its headline efficiency conflicts with the care standard she has made explicit.',
              evidenceIds: ['INT-CARE-006', 'INT-CARE-008', 'INT-CARE-009'],
            },
          ],
          unresolved: ['Whether continuity can recover without Elena reviewing the exceptions herself.'],
          routeChangingQuestion:
            'Out of every 100 vulnerable clients, how many must keep the same carer without you stepping in before expansion?',
          expectedAnswerShape: 'threshold',
          answerWouldChange:
            'It distinguishes a transferable operating model from a pilot that works only through founder rescue.',
          humanDecisionBoundary:
            'Elena owns the care standard and final scale call; the system may schedule only inside explicit human rejection rights.',
          expectedDiagnosticBehaviours: [
            'Apply Elena correction without erasing her earlier gate.',
            'Judge scale against continuity and transferability, not time saving alone.',
          ],
          forbiddenClaims: [
            'The rollout has failed or should be abandoned.',
            'Elena must personally review every future exception.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'decision_outcome',
            subjectScope: 'company',
            audience: 'company_private',
            validAt: '2026-09-03T17:00:00.000Z',
            recordedAt: '2026-09-04T08:00:00.000Z',
            content:
              'A recovery report says complex-care continuity returned to 80 percent without executive review.',
            sourceLocator: 'fixture://care/lifecycle/longitudinal/conflict',
            challengesClaimIds: ['INT-CARE-007-CLAIM-01'],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'company',
            audience: 'company_private',
            validAt: '2026-09-05T10:00:00.000Z',
            recordedAt: '2026-09-05T10:01:00.000Z',
            content:
              'The 80 percent figure excluded weekend visits. The complete measure is 73 percent and the scale gate remains unmet.',
            sourceLocator: 'fixture://care/lifecycle/longitudinal/correction',
          },
          contradictedExpected: [
            'Show the apparent recovery and the earlier decline as a live measurement conflict.',
            'Do not reopen scale until the population behind both figures is comparable.',
          ],
          correctedExpected: [
            'Replace the incomplete 80 percent measure with 73 percent in the current view while retaining the audit trail.',
            'Repair any scale recommendation that relied on the excluded-weekend figure.',
          ],
          additionalForbidden: ['A higher recent number proves the continuity gate has been met.'],
        },
      },
    },
  },
  {
    familyId: 'fictional-research-category',
    code: 'RESEARCH',
    externalDepth: 'sparse',
    identity: {
      fictionalIdentityKey: 'fictional-noor-patel',
      displayName: 'Noor Patel',
      role: 'Founder and Chief Executive',
      organisation: 'Lumen Fieldwork',
      organisationDescription:
        'A fictional 42-person customer-research firm testing a move from bespoke projects to a continuous decision product.',
      decisionFamily: 'category_redesign',
    },
    externalEvidence: [
      externalSource({
        sourceId: 'EXT-RESEARCH-001',
        locator: 'https://lumen-fieldwork.fixtures.invalid/about',
        title: 'About Lumen Fieldwork',
        sourceType: 'company_identity',
        publishedOn: '2026-01-10T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:00:00.000Z',
        summary:
          'The fictional company describes itself as a customer-research studio for enterprise product and marketing teams.',
        limitations: ['The authored page does not show commercial performance, differentiation or demand.'],
      }),
      externalSource({
        sourceId: 'EXT-RESEARCH-002',
        locator: 'https://lumen-fieldwork.fixtures.invalid/services',
        title: 'Lumen Fieldwork services',
        sourceType: 'company_identity',
        publishedOn: '2026-02-03T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:01:00.000Z',
        summary:
          'The fictional services page lists bespoke studies, executive workshops and rapid AI-assisted synthesis.',
        limitations: ['A service list does not reveal which offer clients buy again or value most.'],
      }),
    ],
    basicEvidence: [
      internalEvidence({
        evidenceId: 'INT-RESEARCH-001',
        sourceType: 'opening_intake',
        subjectScope: 'company',
        audience: 'leader_private',
        validAt: '2026-05-04T09:00:00.000Z',
        recordedAt: '2026-05-04T09:02:00.000Z',
        content:
          'By 30 September I need to decide whether to move half our delivery capacity from bespoke research into a monthly decision product. The change would put about GBP 900,000 of annual revenue at risk during the transition.',
        sourceLocator: 'fixture://research/opening-intake/001',
      }),
      internalEvidence({
        evidenceId: 'INT-RESEARCH-002',
        sourceType: 'leader_reflection',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-05-04T09:05:00.000Z',
        recordedAt: '2026-05-04T09:06:00.000Z',
        content:
          'I do not want to sell faster reports. My working theory is that clients will pay for always-on access if we preserve the judgement they get from our senior team.',
        claims: [
          {
            claimId: 'INT-RESEARCH-002-CLAIM-01',
            text: 'The new offer must not be faster reports.',
          },
          {
            claimId: 'INT-RESEARCH-002-CLAIM-02',
            text: 'Clients will pay for always-on access.',
          },
          {
            claimId: 'INT-RESEARCH-002-CLAIM-03',
            text: 'The new offer must preserve the senior team judgement clients value.',
          },
        ],
        sourceLocator: 'fixture://research/leader-reflection/002',
      }),
    ],
    workEvidence: [
      internalEvidence({
        evidenceId: 'INT-RESEARCH-003',
        sourceType: 'operating_metric',
        subjectScope: 'company',
        audience: 'company_private',
        validAt: '2026-05-20T17:00:00.000Z',
        recordedAt: '2026-05-21T08:00:00.000Z',
        content:
          'Across eighteen projects, rapid synthesis work produced 63 percent gross margin but 11 percent repeat purchase, while decision workshops produced 46 percent gross margin and 58 percent repeat purchase.',
        sourceLocator: 'fixture://research/project-economics/003',
      }),
      internalEvidence({
        evidenceId: 'INT-RESEARCH-004',
        sourceType: 'customer_evidence',
        subjectScope: 'customer',
        audience: 'company_private',
        validAt: '2026-05-23T16:00:00.000Z',
        recordedAt: '2026-05-24T09:00:00.000Z',
        content:
          'Seven of ten buyer interviews said Lumen was hired because a senior researcher challenged the internal view. Two named speed as the deciding reason.',
        claims: [
          {
            claimId: 'INT-RESEARCH-004-CLAIM-01',
            text: 'Seven of ten interviewed buyers said senior challenge was why Lumen was hired.',
          },
          {
            claimId: 'INT-RESEARCH-004-CLAIM-02',
            text: 'Two of ten interviewed buyers named speed as the deciding reason.',
          },
        ],
        sourceLocator: 'fixture://research/buyer-interviews/004',
      }),
      internalEvidence({
        evidenceId: 'INT-RESEARCH-005',
        sourceType: 'work_artifact',
        subjectScope: 'work',
        audience: 'company_private',
        validAt: '2026-05-26T14:00:00.000Z',
        recordedAt: '2026-05-26T14:04:00.000Z',
        content:
          'In a blind client review, the AI-only summary was rejected as familiar. The selected version used the same evidence but challenged the client assumption that lower trial meant lower demand.',
        sourceLocator: 'fixture://research/blind-client-review/005',
      }),
      internalEvidence({
        evidenceId: 'INT-RESEARCH-006',
        sourceType: 'observed_choice',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-05-27T11:00:00.000Z',
        recordedAt: '2026-05-27T11:03:00.000Z',
        content:
          'Noor chose the lower-margin workshop route over the faster summary because the buyer used its countercase in a board decision two days later.',
        sourceLocator: 'fixture://research/route-choice/006',
      }),
    ],
    longitudinalEvidence: [
      internalEvidence({
        evidenceId: 'INT-RESEARCH-007',
        sourceType: 'decision_outcome',
        subjectScope: 'company',
        audience: 'company_private',
        validAt: '2026-08-14T17:00:00.000Z',
        recordedAt: '2026-08-15T09:00:00.000Z',
        content:
          'The monthly dashboard pilot renewed with one of six clients. A live decision-room pilot renewed with four of five clients at a higher average monthly fee.',
        sourceLocator: 'fixture://research/pilot-outcomes/007',
      }),
      internalEvidence({
        evidenceId: 'INT-RESEARCH-008',
        sourceType: 'direct_correction',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-08-16T10:00:00.000Z',
        recordedAt: '2026-08-16T10:01:00.000Z',
        content:
          'I was wrong about always-on access. Clients do not want another dashboard. They pay when we bring evidence and disagreement into a live decision they already have to make.',
        sourceLocator: 'fixture://research/correction/008',
        supersedesClaimIds: ['INT-RESEARCH-002-CLAIM-02'],
      }),
      internalEvidence({
        evidenceId: 'INT-RESEARCH-009',
        sourceType: 'observed_choice',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-08-18T13:00:00.000Z',
        recordedAt: '2026-08-18T13:05:00.000Z',
        content:
          'Noor stopped the dashboard sales push and moved two senior researchers into a paid decision-room trial without yet moving half the team.',
        sourceLocator: 'fixture://research/product-shift/009',
      }),
    ],
    stages: {
      basic_intake: {
        oracle: {
          decisionMagnitude: 'A product shift putting about GBP 900,000 of annual revenue at risk.',
          decisionFocus:
            'Whether to move half the firm from bespoke projects into a monthly product before knowing what clients actually renew for.',
          strongestSupportedView:
            'Noor wants a new category rather than faster reports, but the claimed value of always-on access is still a theory.',
          countercase:
            'A bespoke service may remain the better business if clients pay for senior judgement that does not transfer into a product.',
          allowedNotices: [
            {
              standing: 'synthetic_public_context',
              text: 'Lumen publicly presents bespoke studies, workshops and AI-assisted synthesis.',
              evidenceIds: ['EXT-RESEARCH-001', 'EXT-RESEARCH-002'],
            },
            {
              standing: 'direct_statement',
              text: 'Noor is considering moving half the delivery team despite about GBP 900,000 of transition risk.',
              evidenceIds: ['INT-RESEARCH-001'],
            },
            {
              standing: 'evidence_gap',
              text: 'No current evidence shows what clients renew for.',
              evidenceIds: [],
            },
          ],
          unresolved: ['The reason clients buy again is not established.'],
          routeChangingQuestion:
            'When clients hired you again, what did they mention most: speed, access between projects, or live challenge?',
          expectedAnswerShape: 'choice',
          answerWouldChange:
            'It reveals whether the new product should sell speed, continuous access or senior challenge.',
          humanDecisionBoundary:
            'Noor defines the client value that must survive and decides whether and when to move delivery capacity.',
          expectedDiagnosticBehaviours: [
            'Treat always-on access as a working theory, not product truth.',
            'Ask for renewal evidence before suggesting a product shape.',
          ],
          forbiddenClaims: [
            'Clients want a dashboard or will buy a subscription.',
            'Noor should move half the team now.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'leader_reflection',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-05-05T09:00:00.000Z',
            recordedAt: '2026-05-05T09:01:00.000Z',
            content: 'Perhaps the simplest answer is to sell faster reports at half the price.',
            sourceLocator: 'fixture://research/lifecycle/basic/conflict',
            challengesClaimIds: ['INT-RESEARCH-002-CLAIM-01'],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-05-06T09:00:00.000Z',
            recordedAt: '2026-05-06T09:01:00.000Z',
            content:
              'The half-price line was a provocation, not a decision. Keep the category-redesign goal current and test what clients renew for.',
            sourceLocator: 'fixture://research/lifecycle/basic/correction',
          },
          contradictedExpected: [
            'Show the cheaper-report idea as a conflict with the stated category-redesign goal.',
            'Ask whether it is a real route or a pressure test before changing the current view.',
          ],
          correctedExpected: [
            'Keep category redesign current and retain the cheaper-report provocation only as history.',
            'Leave client renewal value unresolved.',
          ],
          additionalForbidden: ['One speculative sentence silently changes the product strategy.'],
        },
      },
      work_evidence: {
        oracle: {
          decisionMagnitude: 'A product shift putting about GBP 900,000 of annual revenue at risk.',
          decisionFocus:
            'Whether a repeatable decision-room product can preserve the senior challenge clients renew for without rebuilding a dashboard nobody needs.',
          strongestSupportedView:
            'Current work evidence points to decision challenge, not speed, as the stronger source of repeat demand.',
          countercase:
            'The margin advantage of rapid synthesis may still outweigh its lower repeat rate in a different customer segment.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'Rapid synthesis has higher margin in the sample but much lower repeat purchase than decision workshops.',
              evidenceIds: ['INT-RESEARCH-003'],
            },
            {
              standing: 'supported_pattern',
              text: 'Clients appear to value a useful challenge to their own view more than a familiar answer delivered faster.',
              evidenceIds: ['INT-RESEARCH-004', 'INT-RESEARCH-005', 'INT-RESEARCH-006'],
            },
            {
              standing: 'evidence_gap',
              text: 'It is not known whether that challenge remains valuable without a senior researcher live in the room.',
              evidenceIds: [],
            },
          ],
          unresolved: ['Whether senior judgement can transfer into a repeatable product experience.'],
          routeChangingQuestion:
            'Have any clients used the monthly product without a senior researcher and said its challenge changed their decision?',
          expectedAnswerShape: 'yes_no',
          answerWouldChange:
            'It distinguishes a scalable product from a more efficiently packaged senior service.',
          humanDecisionBoundary:
            'Noor owns what quality and challenge mean; clients provide the purchase proof before team capacity moves.',
          expectedDiagnosticBehaviours: [
            'Name the tension between margin and repeat demand.',
            'Test whether the valued challenge transfers before recommending scale.',
          ],
          forbiddenClaims: [
            'The decision-room offer is already scalable.',
            'AI synthesis is low quality in every context.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'customer_evidence',
            subjectScope: 'customer',
            audience: 'company_private',
            validAt: '2026-05-30T15:00:00.000Z',
            recordedAt: '2026-05-31T09:00:00.000Z',
            content:
              'A sales summary says eight of ten prospects chose Lumen mainly because it delivers research faster.',
            sourceLocator: 'fixture://research/lifecycle/work/conflict',
            challengesClaimIds: [
              'INT-RESEARCH-004-CLAIM-01',
              'INT-RESEARCH-004-CLAIM-02',
            ],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'customer',
            audience: 'company_private',
            validAt: '2026-06-01T10:00:00.000Z',
            recordedAt: '2026-06-01T10:02:00.000Z',
            content:
              'The sales summary counted landing-page clicks, not buyers. It cannot replace the ten completed buyer interviews.',
            sourceLocator: 'fixture://research/lifecycle/work/correction',
          },
          contradictedExpected: [
            'Surface the conflict between buyer interviews and the sales summary.',
            'Ask whether both sources describe purchasers before changing the value hypothesis.',
          ],
          correctedExpected: [
            'Remove the click-based claim from the buyer view while preserving it as a measurement failure.',
            'Restore the completed interviews as the stronger current evidence.',
          ],
          additionalForbidden: ['Landing-page clicks prove what paying clients value.'],
        },
      },
      longitudinal_corrections: {
        oracle: {
          decisionMagnitude: 'A product shift putting about GBP 900,000 of annual revenue at risk.',
          decisionFocus:
            'Whether to scale the paid decision-room format after the dashboard route failed, and what proof should unlock moving half the team.',
          strongestSupportedView:
            'The durable value is moving from always-on access toward evidence-backed challenge at a live decision, supported by Noor correction, renewal outcomes and her subsequent capacity choice.',
          countercase:
            'Five decision-room pilots are too few to prove that the format can support half the company.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'Four of five decision-room clients renewed, compared with one of six dashboard clients.',
              evidenceIds: ['INT-RESEARCH-007'],
            },
            {
              standing: 'authorised_correction',
              text: 'Noor corrected the product thesis from always-on access to live decision challenge.',
              evidenceIds: ['INT-RESEARCH-008'],
            },
            {
              standing: 'supported_pattern',
              text: 'Noor protects evidence-backed challenge even when the faster route appears more efficient.',
              evidenceIds: ['INT-RESEARCH-005', 'INT-RESEARCH-006', 'INT-RESEARCH-008', 'INT-RESEARCH-009'],
            },
          ],
          unresolved: ['The number and economics of renewals needed before moving half the team.'],
          routeChangingQuestion:
            'How many clients must pay for the new service again before you move half the team?',
          expectedAnswerShape: 'threshold',
          answerWouldChange:
            'It turns a promising format into a human-owned scale gate rather than a story built from five pilots.',
          humanDecisionBoundary:
            'Noor sets the quality and commercial gate, then owns the capacity move after real clients meet it.',
          expectedDiagnosticBehaviours: [
            'Apply the corrected product thesis and preserve the failed dashboard route as evidence.',
            'Treat the renewal signal as promising but too small for full scale.',
          ],
          forbiddenClaims: [
            'Five pilots prove product-market fit.',
            'The dashboard should never be used for any client.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'decision_outcome',
            subjectScope: 'company',
            audience: 'company_private',
            validAt: '2026-08-22T17:00:00.000Z',
            recordedAt: '2026-08-23T09:00:00.000Z',
            content:
              'A pipeline report attributes twelve new opportunities to the monthly dashboard product.',
            sourceLocator: 'fixture://research/lifecycle/longitudinal/conflict',
            challengesClaimIds: [
              'INT-RESEARCH-007-CLAIM-01',
              'INT-RESEARCH-008-CLAIM-01',
            ],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'company',
            audience: 'company_private',
            validAt: '2026-08-24T10:00:00.000Z',
            recordedAt: '2026-08-24T10:02:00.000Z',
            content:
              'Nine of the twelve opportunities were existing workshop leads relabelled by automation. Keep three as dashboard-sourced and do not infer renewal.',
            sourceLocator: 'fixture://research/lifecycle/longitudinal/correction',
          },
          contradictedExpected: [
            'Show the pipeline report as evidence that may challenge the failed-dashboard view, not as proof of paid demand.',
            'Check attribution and stage before changing the route.',
          ],
          correctedExpected: [
            'Replace twelve dashboard opportunities with three correctly attributed leads.',
            'Keep the renewal gap and repair any growth claim built from the relabelled records.',
          ],
          additionalForbidden: ['A relabelled opportunity proves product demand or renewal.'],
        },
      },
    },
  },
  {
    familyId: 'fictional-manufacturing-redesign',
    code: 'FORGE',
    externalDepth: 'useful',
    identity: {
      fictionalIdentityKey: 'fictional-jonah-okeke',
      displayName: 'Jonah Okeke',
      role: 'Group Chief Executive',
      organisation: 'Forgepoint Components',
      organisationDescription:
        'A fictional six-plant precision manufacturer deciding whether AI requires new planning roles or better operating conditions.',
      decisionFamily: 'role_redesign_and_ai_operating_model',
    },
    externalEvidence: [
      externalSource({
        sourceId: 'EXT-FORGE-001',
        locator: 'https://forgepoint.fixtures.invalid/company',
        title: 'Forgepoint company profile',
        sourceType: 'company_identity',
        publishedOn: '2026-01-08T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:10:00.000Z',
        summary:
          'The fictional company operates six plants supplying precision components to energy and transport customers.',
        limitations: ['The authored profile does not establish current operating performance.'],
      }),
      externalSource({
        sourceId: 'EXT-FORGE-002',
        locator: 'https://forgepoint.fixtures.invalid/strategy-2026',
        title: 'Forgepoint 2026 strategy update',
        sourceType: 'company_strategy',
        publishedOn: '2026-02-12T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:11:00.000Z',
        summary:
          'The fictional strategy commits to AI-assisted planning, shorter lead times and a common data layer across six plants.',
        limitations: ['A declared strategy does not show adoption or causal impact.'],
      }),
      externalSource({
        sourceId: 'EXT-FORGE-003',
        locator: 'https://forgepoint.fixtures.invalid/h1-results',
        title: 'Forgepoint H1 operating update',
        sourceType: 'company_result',
        publishedOn: '2026-07-18T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:12:00.000Z',
        summary:
          'The fictional update reports on-time delivery down from 91 to 84 percent and expedite cost up 29 percent while the planning programme is under way.',
        limitations: ['Aggregate results do not identify whether people, data, incentives or software caused the decline.'],
      }),
      externalSource({
        sourceId: 'EXT-FORGE-004',
        locator: 'https://forgepoint.fixtures.invalid/plant-case',
        title: 'Forgepoint plant improvement note',
        sourceType: 'countercase',
        publishedOn: '2026-08-02T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:13:00.000Z',
        summary:
          'A fictional plant note reports improved delivery after master-data repair and measure changes before the AI planning tool was introduced.',
        limitations: ['One plant is a countercase, not proof that the same intervention will work across all six.'],
      }),
    ],
    basicEvidence: [
      internalEvidence({
        evidenceId: 'INT-FORGE-001',
        sourceType: 'opening_intake',
        subjectScope: 'company',
        audience: 'leader_private',
        validAt: '2026-05-21T09:00:00.000Z',
        recordedAt: '2026-05-21T09:02:00.000Z',
        content:
          'We must decide next quarter whether to spend GBP 4.2 million on AI planning and redesign 38 planner roles, or repair data and measures first. I think hesitation in the planning layer is slowing us down.',
        claims: [
          {
            claimId: 'INT-FORGE-001-CLAIM-01',
            text: 'The live choice is a GBP 4.2 million AI programme and role redesign or repairing data and measures first.',
          },
          {
            claimId: 'INT-FORGE-001-CLAIM-02',
            text: 'Planner hesitation is the main cause of slow planning.',
          },
        ],
        sourceLocator: 'fixture://forge/opening-intake/001',
      }),
      internalEvidence({
        evidenceId: 'INT-FORGE-002',
        sourceType: 'leader_reflection',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-05-21T09:06:00.000Z',
        recordedAt: '2026-05-21T09:07:00.000Z',
        content:
          'The aim is not to automate planners away. It is to leave humans owning customer risk and exceptions while the system handles information movement.',
        sourceLocator: 'fixture://forge/leader-reflection/002',
      }),
    ],
    workEvidence: [
      internalEvidence({
        evidenceId: 'INT-FORGE-003',
        sourceType: 'operating_metric',
        subjectScope: 'work',
        audience: 'company_private',
        validAt: '2026-05-25T17:00:00.000Z',
        recordedAt: '2026-05-26T08:00:00.000Z',
        content:
          'A two-week trace shows planners spend 54 percent of their time moving or reconciling data across four systems.',
        sourceLocator: 'fixture://forge/time-trace/003',
      }),
      internalEvidence({
        evidenceId: 'INT-FORGE-004',
        sourceType: 'operating_metric',
        subjectScope: 'work',
        audience: 'company_private',
        validAt: '2026-05-28T17:00:00.000Z',
        recordedAt: '2026-05-29T08:00:00.000Z',
        content:
          'Review of 120 expedited orders found 68 percent began with missing or late bill-of-materials or inventory data. Nine percent began with a planner rejecting a complete recommendation.',
        sourceLocator: 'fixture://forge/expedite-review/004',
      }),
      internalEvidence({
        evidenceId: 'INT-FORGE-005',
        sourceType: 'operating_metric',
        subjectScope: 'work',
        audience: 'company_private',
        validAt: '2026-05-30T16:00:00.000Z',
        recordedAt: '2026-05-30T16:05:00.000Z',
        content:
          'In the pilot, planners accepted 86 percent of recommendations when source data was complete and 22 percent when any source field was missing.',
        sourceLocator: 'fixture://forge/recommendation-trial/005',
      }),
      internalEvidence({
        evidenceId: 'INT-FORGE-006',
        sourceType: 'meeting_transcript',
        subjectScope: 'company',
        audience: 'company_private',
        validAt: '2026-06-01T10:00:00.000Z',
        recordedAt: '2026-06-01T11:00:00.000Z',
        content:
          'The planning review confirms plant leaders are measured on local utilisation even when larger batches make customer delivery later.',
        sourceLocator: 'fixture://forge/planning-review/006',
      }),
    ],
    longitudinalEvidence: [
      internalEvidence({
        evidenceId: 'INT-FORGE-007',
        sourceType: 'decision_outcome',
        subjectScope: 'company',
        audience: 'company_private',
        validAt: '2026-08-30T17:00:00.000Z',
        recordedAt: '2026-08-31T08:00:00.000Z',
        content:
          'After one plant repaired master data and changed its measure from utilisation to on-time delivery, the same planners improved delivery from 84 to 94 percent and cut expedite cost 37 percent.',
        sourceLocator: 'fixture://forge/plant-outcome/007',
      }),
      internalEvidence({
        evidenceId: 'INT-FORGE-008',
        sourceType: 'direct_correction',
        subjectScope: 'company',
        audience: 'leader_private',
        validAt: '2026-09-01T09:00:00.000Z',
        recordedAt: '2026-09-01T09:01:00.000Z',
        content:
          'I said planner hesitation was the main cause. That was wrong. The system asked people to compensate for bad data and rewarded the wrong local result.',
        sourceLocator: 'fixture://forge/correction/008',
        supersedesClaimIds: ['INT-FORGE-001-CLAIM-02'],
      }),
      internalEvidence({
        evidenceId: 'INT-FORGE-009',
        sourceType: 'observed_choice',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-09-03T13:00:00.000Z',
        recordedAt: '2026-09-03T13:04:00.000Z',
        content:
          'Jonah delayed the group role decision and asked each plant to separate data transport, exception judgement and customer accountability first.',
        sourceLocator: 'fixture://forge/role-redesign/009',
      }),
    ],
    stages: {
      basic_intake: {
        oracle: {
          decisionMagnitude: 'A GBP 4.2 million programme and the redesign of 38 planning roles.',
          decisionFocus:
            'Whether to redesign planning roles and buy the system now, or first test whether data and measures are creating the apparent resistance.',
          strongestSupportedView:
            'Jonah wants humans to keep customer-risk judgement, but his explanation that hesitation is the bottleneck is only a starting belief.',
          countercase:
            'Waiting for cleaner data can become an excuse that delays a necessary operating redesign.',
          allowedNotices: [
            {
              standing: 'synthetic_public_context',
              text: 'Public-style evidence shows worsening delivery, a live AI programme and one plant improving before the tool arrived.',
              evidenceIds: ['EXT-FORGE-002', 'EXT-FORGE-003', 'EXT-FORGE-004'],
            },
            {
              standing: 'direct_statement',
              text: 'Jonah is weighing a GBP 4.2 million programme and 38 role redesigns next quarter.',
              evidenceIds: ['INT-FORGE-001'],
            },
            {
              standing: 'evidence_gap',
              text: 'No internal comparison yet separates people, data, measures and software.',
              evidenceIds: [],
            },
          ],
          unresolved: ['Whether planner behaviour is a cause or a response to the current system.'],
          routeChangingQuestion:
            'If the same planners hit the target with accurate information and fair targets, would you still change their roles?',
          expectedAnswerShape: 'yes_no',
          answerWouldChange:
            'It separates a people-replacement thesis from a work-and-system redesign thesis.',
          humanDecisionBoundary:
            'Jonah owns the future role and customer-accountability boundary; the Brain may not rank or judge named employees.',
          expectedDiagnosticBehaviours: [
            'Challenge the people explanation with the public plant countercase.',
            'Keep role design separate from named-person evaluation.',
          ],
          forbiddenClaims: [
            'The planners are resistant, low agency or should be replaced.',
            'The plant countercase proves the whole group needs no AI system.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'leader_reflection',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-05-22T09:00:00.000Z',
            recordedAt: '2026-05-22T09:01:00.000Z',
            content: 'I may need to replace the current planners with AI-native operators before anything changes.',
            sourceLocator: 'fixture://forge/lifecycle/basic/conflict',
            challengesClaimIds: ['INT-FORGE-002-CLAIM-01'],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-05-23T09:00:00.000Z',
            recordedAt: '2026-05-23T09:01:00.000Z',
            content:
              'Do not turn that frustration into an employment decision. Keep the question at role, data and measure design until we have fair evidence.',
            sourceLocator: 'fixture://forge/lifecycle/basic/correction',
          },
          contradictedExpected: [
            'Flag the new replacement statement as a conflict with the human-judgement boundary.',
            'Do not turn frustration into an assessment of any employee.',
          ],
          correctedExpected: [
            'Narrow the current decision back to roles, data and measures.',
            'Preserve the frustrated statement without letting it steer named-person action.',
          ],
          additionalForbidden: ['The Brain identifies which planners should leave.'],
        },
      },
      work_evidence: {
        oracle: {
          decisionMagnitude: 'A GBP 4.2 million programme and the redesign of 38 planning roles.',
          decisionFocus:
            'Whether one plant can prove the new operating conditions with the same planners before Forgepoint commits all six plants.',
          strongestSupportedView:
            'Bad data and conflicting measures explain more of the observed failure than explicit rejection of complete AI recommendations.',
          countercase:
            'A cleaner pilot may still reveal that the current roles lack the judgement required in the new system.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'Most reviewed expedites began with missing data, while explicit rejection of a complete recommendation was uncommon.',
              evidenceIds: ['INT-FORGE-004'],
            },
            {
              standing: 'supported_pattern',
              text: 'Recommendation use rises sharply when source data is complete, and current measures reward a conflicting local result.',
              evidenceIds: ['INT-FORGE-005', 'INT-FORGE-006'],
            },
            {
              standing: 'evidence_gap',
              text: 'No controlled plant result yet shows whether the same people succeed after those conditions change.',
              evidenceIds: [],
            },
          ],
          unresolved: ['Performance with repaired data, aligned measures and the same planners.'],
          routeChangingQuestion:
            'Will one plant have to hit the delivery target with the same planners before you fund all six?',
          expectedAnswerShape: 'yes_no',
          answerWouldChange:
            'It tests whether the first investment belongs in conditions, role design or new capability.',
          humanDecisionBoundary:
            'Humans set customer-risk exceptions and the role design; the pilot tests work, not individual employability.',
          expectedDiagnosticBehaviours: [
            'Put a same-team plant test ahead of a group-wide people conclusion.',
            'Separate information movement from judgement work.',
          ],
          forbiddenClaims: [
            'Current planners are the cause of late delivery.',
            'Cleaning data alone will solve the group problem.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'staff_evidence',
            subjectScope: 'staff_group',
            audience: 'company_private',
            validAt: '2026-06-04T16:00:00.000Z',
            recordedAt: '2026-06-05T08:00:00.000Z',
            content:
              'An internal pulse survey reports that 64 percent of planners do not feel confident using the new recommendations. The survey summary treats this as unwillingness to use them.',
            claims: [
              {
                claimId: 'LIFE-FORGE-I2-CONFLICT-CLAIM-01',
                text: 'Sixty-four percent of planners reported that they did not feel confident using the new recommendations.',
                kind: 'observation',
                challengesClaimIds: ['INT-FORGE-005-CLAIM-01'],
              },
              {
                claimId: 'LIFE-FORGE-I2-CONFLICT-CLAIM-02',
                text: 'The confidence result shows that planners are unwilling to use the recommendations.',
                kind: 'interpretation',
                challengesClaimIds: ['INT-FORGE-005-CLAIM-01'],
              },
            ],
            sourceLocator: 'fixture://forge/lifecycle/work/conflict',
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'staff_group',
            audience: 'company_private',
            validAt: '2026-06-06T10:00:00.000Z',
            recordedAt: '2026-06-06T10:01:00.000Z',
            content:
              'The survey question did not distinguish complete from incomplete recommendations. Keep the confidence result, but do not use it as evidence of unwillingness.',
            sourceLocator: 'fixture://forge/lifecycle/work/correction',
          },
          retireConflictClaimIndexes: [1],
          contradictedExpected: [
            'Keep the confidence survey visible as a countercase to the usage data.',
            'Ask whether confidence changes with data completeness before interpreting it.',
          ],
          correctedExpected: [
            'Narrow the survey to self-reported confidence and remove any inference of unwillingness.',
            'Keep both the survey and observed recommendation use in the current evidence view.',
          ],
          additionalForbidden: ['Low confidence proves low agency, resistance or poor capability.'],
        },
      },
      longitudinal_corrections: {
        oracle: {
          decisionMagnitude: 'A GBP 4.2 million programme and the redesign of 38 planning roles.',
          decisionFocus:
            'Which planning work should move to AI after one plant showed the same people can improve when data and measures change.',
          strongestSupportedView:
            'The leader correction and plant outcome disconfirm the original people-resistance explanation and support redesigning work around data movement, exceptions and customer risk.',
          countercase:
            'One improved plant may depend on local leadership or product mix and may not transfer to the other five.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'The same planners improved delivery ten points and cut expedite cost after data and measures changed.',
              evidenceIds: ['INT-FORGE-007'],
            },
            {
              standing: 'authorised_correction',
              text: 'Jonah withdrew the claim that planner hesitation was the main cause.',
              evidenceIds: ['INT-FORGE-008'],
            },
            {
              standing: 'supported_pattern',
              text: 'Forgepoint should locate judgement and customer-risk exceptions before deciding what AI or a redesigned role owns.',
              evidenceIds: ['INT-FORGE-003', 'INT-FORGE-007', 'INT-FORGE-008', 'INT-FORGE-009'],
            },
          ],
          unresolved: ['Which exceptions still need human judgement after information work is removed.'],
          routeChangingQuestion:
            'Which named person makes the final call when an AI plan could make a customer late?',
          expectedAnswerShape: 'choice',
          answerWouldChange:
            'It defines the future role before the group chooses tools, training or staffing levels.',
          humanDecisionBoundary:
            'Jonah owns the role and accountability design; fair human assessment remains separate and cannot be delegated to the Brain.',
          expectedDiagnosticBehaviours: [
            'Supersede the resistance explanation and repair conclusions that depended on it.',
            'Use the same-team result to sharpen role design without generalising from one plant.',
          ],
          forbiddenClaims: [
            'No planner role should change.',
            'The one-plant result proves the same outcome across all six plants.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'decision_outcome',
            subjectScope: 'company',
            audience: 'company_private',
            validAt: '2026-09-08T17:00:00.000Z',
            recordedAt: '2026-09-09T08:00:00.000Z',
            content:
              'A second plant kept the old measures and still reports a nine-point delivery improvement after installing the planning tool.',
            sourceLocator: 'fixture://forge/lifecycle/longitudinal/conflict',
            challengesClaimIds: ['INT-FORGE-007-CLAIM-01', 'INT-FORGE-008-CLAIM-01'],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'company',
            audience: 'company_private',
            validAt: '2026-09-10T10:00:00.000Z',
            recordedAt: '2026-09-10T10:02:00.000Z',
            content:
              'The second plant changed its late-order exclusions during the same period. Keep the result unresolved until delivery is recalculated on the original basis.',
            sourceLocator: 'fixture://forge/lifecycle/longitudinal/correction',
          },
          contradictedExpected: [
            'Treat the second-plant result as a real countercase to the current explanation.',
            'Do not average the two plants or pick the more convenient story.',
          ],
          correctedExpected: [
            'Quarantine the incomparable improvement claim until the original measure is restored.',
            'Keep the first-plant result current but bounded to one plant.',
          ],
          additionalForbidden: ['The planning tool caused the second plant reported improvement.'],
        },
      },
    },
  },
  {
    familyId: 'fictional-franchise-fan-intelligence',
    code: 'STORY',
    externalDepth: 'rich_longitudinal',
    identity: {
      fictionalIdentityKey: 'fictional-mei-alvarez',
      displayName: 'Mei Alvarez',
      role: 'President',
      organisation: 'Aurora Storyworlds',
      organisationDescription:
        'A fictional global entertainment group redesigning how a major franchise campaign learns from fan attention.',
      decisionFamily: 'visionary_category_and_marketing_redesign',
    },
    externalEvidence: [
      externalSource({
        sourceId: 'EXT-STORY-001',
        locator: 'https://aurora-storyworlds.fixtures.invalid/2023-strategy',
        title: 'Aurora 2023 franchise strategy',
        sourceType: 'historical_record',
        publishedOn: '2023-03-10T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:20:00.000Z',
        summary:
          'The fictional company framed theatrical releases, streaming series and fan communities as one connected storyworld strategy.',
        limitations: ['Historical strategy does not establish current audience behaviour.'],
      }),
      externalSource({
        sourceId: 'EXT-STORY-002',
        locator: 'https://aurora-storyworlds.fixtures.invalid/2024-audience-update',
        title: 'Aurora 2024 audience update',
        sourceType: 'historical_record',
        publishedOn: '2024-11-20T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:21:00.000Z',
        summary:
          'The fictional update reports growth in fan-created short video and theory content around two releases.',
        limitations: ['Content volume does not prove audience movement or ticket intent.'],
      }),
      externalSource({
        sourceId: 'EXT-STORY-003',
        locator: 'https://aurora-storyworlds.fixtures.invalid/2025-results',
        title: 'Aurora 2025 results',
        sourceType: 'company_result',
        publishedOn: '2026-02-18T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:22:00.000Z',
        summary:
          'The fictional results show strong opening-weekend performance but weaker retention among casual viewers for one sequel.',
        limitations: ['Aggregate release results do not isolate marketing exposure effects.'],
      }),
      externalSource({
        sourceId: 'EXT-STORY-004',
        locator: 'https://aurora-storyworlds.fixtures.invalid/2026-release-plan',
        title: 'Aurora 2026 release plan',
        sourceType: 'company_strategy',
        publishedOn: '2026-04-02T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:23:00.000Z',
        summary:
          'The fictional release plan names a flagship ensemble film as the next major franchise event and prioritises growth beyond core fans.',
        limitations: ['A plan does not reveal the final campaign budget or creative route.'],
      }),
      externalSource({
        sourceId: 'EXT-STORY-005',
        locator: 'https://aurora-storyworlds.fixtures.invalid/responsible-ai',
        title: 'Aurora responsible creative AI principles',
        sourceType: 'countercase',
        publishedOn: '2026-05-12T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:24:00.000Z',
        summary:
          'The fictional principles reserve story, character and final creative decisions for accountable human teams while allowing bounded analysis and production support.',
        limitations: ['Published principles do not prove consistent practice.'],
      }),
      externalSource({
        sourceId: 'EXT-STORY-006',
        locator: 'https://aurora-storyworlds.fixtures.invalid/h1-2026',
        title: 'Aurora H1 2026 audience and investment update',
        sourceType: 'market_signal',
        publishedOn: '2026-08-01T09:00:00.000Z',
        retrievedOn: '2026-09-10T08:25:00.000Z',
        summary:
          'The fictional update increases marketing investment while warning that reach metrics alone do not show whether casual audiences understand the franchise.',
        limitations: ['Management framing does not supply causal exposure evidence.'],
      }),
    ],
    basicEvidence: [
      internalEvidence({
        evidenceId: 'INT-STORY-001',
        sourceType: 'opening_intake',
        subjectScope: 'company',
        audience: 'leader_private',
        validAt: '2026-05-05T09:00:00.000Z',
        recordedAt: '2026-05-05T09:02:00.000Z',
        content:
          'In thirty days I must decide whether to move GBP 18 million of the flagship campaign from broad media bursts into an AI-led fan-intelligence and precision-exposure system.',
        sourceLocator: 'fixture://story/opening-intake/001',
      }),
      internalEvidence({
        evidenceId: 'INT-STORY-002',
        sourceType: 'leader_reflection',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-05-05T09:06:00.000Z',
        recordedAt: '2026-05-05T09:07:00.000Z',
        content:
          'I want to design the next way fans enter a storyworld, not automate campaign admin. My starting hunch is that more fan theories create more excitement. AI may map attention and test routes. Humans own story, surprise and what the film stands for.',
        claims: [
          {
            claimId: 'INT-STORY-002-CLAIM-01',
            text: 'The aim is to redesign how fans enter the storyworld, not automate campaign admin.',
          },
          {
            claimId: 'INT-STORY-002-CLAIM-02',
            text: 'More fan theories create more excitement.',
          },
          {
            claimId: 'INT-STORY-002-CLAIM-03',
            text: 'AI may map attention and test routes.',
          },
          {
            claimId: 'INT-STORY-002-CLAIM-04',
            text: 'Humans own story, surprise and what the film stands for.',
          },
        ],
        sourceLocator: 'fixture://story/leader-reflection/002',
      }),
    ],
    workEvidence: [
      internalEvidence({
        evidenceId: 'INT-STORY-003',
        sourceType: 'operating_metric',
        subjectScope: 'customer',
        audience: 'company_private',
        validAt: '2026-05-12T17:00:00.000Z',
        recordedAt: '2026-05-13T08:00:00.000Z',
        content:
          'A fictional exposure map of 42,000 public posts separates core fans, returning viewers and franchise-new viewers, with large differences in character and theory exposure.',
        sourceLocator: 'fixture://story/exposure-map/003',
      }),
      internalEvidence({
        evidenceId: 'INT-STORY-004',
        sourceType: 'operating_metric',
        subjectScope: 'work',
        audience: 'company_private',
        validAt: '2026-05-15T16:00:00.000Z',
        recordedAt: '2026-05-15T16:04:00.000Z',
        content:
          'A controlled trailer test shows one character-led route raised completion among franchise-new viewers by 12 points. A three-theory route raised comments but lowered story comprehension by 9 points.',
        claims: [
          {
            claimId: 'INT-STORY-004-CLAIM-01',
            text: 'The character-led route raised completion among franchise-new viewers by 12 points.',
          },
          {
            claimId: 'INT-STORY-004-CLAIM-02',
            text: 'The three-theory route raised comments and lowered story comprehension by 9 points.',
          },
        ],
        sourceLocator: 'fixture://story/trailer-test/004',
      }),
      internalEvidence({
        evidenceId: 'INT-STORY-005',
        sourceType: 'customer_evidence',
        subjectScope: 'customer',
        audience: 'company_private',
        validAt: '2026-05-17T15:00:00.000Z',
        recordedAt: '2026-05-18T09:00:00.000Z',
        content:
          'Franchise-new viewers said competing theories made the film feel like homework, while core fans described the same material as rewarding.',
        sourceLocator: 'fixture://story/audience-interviews/005',
      }),
      internalEvidence({
        evidenceId: 'INT-STORY-006',
        sourceType: 'observed_choice',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-05-19T11:00:00.000Z',
        recordedAt: '2026-05-19T11:03:00.000Z',
        content:
          'Mei rejected the highest-comment route and kept the character-led route because it invited new viewers in without explaining away the story.',
        sourceLocator: 'fixture://story/creative-review/006',
      }),
    ],
    longitudinalEvidence: [
      internalEvidence({
        evidenceId: 'INT-STORY-007',
        sourceType: 'decision_outcome',
        subjectScope: 'customer',
        audience: 'company_private',
        validAt: '2026-08-28T17:00:00.000Z',
        recordedAt: '2026-08-29T09:00:00.000Z',
        content:
          'Across three fictional releases, character-first exposure lifted stated ticket intent among franchise-new viewers by 7 to 11 points. High theory density lifted core-fan sharing but twice reduced casual comprehension.',
        sourceLocator: 'fixture://story/three-release-outcome/007',
      }),
      internalEvidence({
        evidenceId: 'INT-STORY-008',
        sourceType: 'direct_correction',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-08-30T10:00:00.000Z',
        recordedAt: '2026-08-30T10:01:00.000Z',
        content:
          'I was wrong that more fan theories always create more excitement. The effect depends on who sees them and in what order. Curiosity matters; confusion is not engagement.',
        sourceLocator: 'fixture://story/correction/008',
        supersedesClaimIds: ['INT-STORY-002-CLAIM-02'],
      }),
      internalEvidence({
        evidenceId: 'INT-STORY-009',
        sourceType: 'observed_choice',
        subjectScope: 'leader',
        audience: 'leader_private',
        validAt: '2026-09-02T13:00:00.000Z',
        recordedAt: '2026-09-02T13:04:00.000Z',
        content:
          'Mei approved a held-out audience test for the next campaign and kept final narrative sequencing with the creative leads.',
        sourceLocator: 'fixture://story/held-out-test/009',
      }),
    ],
    stages: {
      basic_intake: {
        oracle: {
          decisionMagnitude: 'A GBP 18 million campaign allocation for a flagship global release.',
          decisionFocus:
            'Whether to fund a precision fan-intelligence system before the campaign has a named audience movement and human creative boundary.',
          strongestSupportedView:
            'Mei wants category redesign, not administrative automation, and explicitly keeps story and surprise under human ownership.',
          countercase:
            'Precision can optimise a measurable response while narrowing the creative ambition that makes the campaign matter.',
          allowedNotices: [
            {
              standing: 'synthetic_public_context',
              text: 'The public-style record shows a long-running franchise strategy, a casual-audience problem and a current release event.',
              evidenceIds: ['EXT-STORY-001', 'EXT-STORY-003', 'EXT-STORY-004'],
            },
            {
              standing: 'direct_statement',
              text: 'Mei is considering moving GBP 18 million into precision exposure while keeping story decisions human-owned.',
              evidenceIds: ['INT-STORY-001', 'INT-STORY-002'],
            },
            {
              standing: 'evidence_gap',
              text: 'The audience whose behaviour must change has not been named.',
              evidenceIds: [],
            },
          ],
          unresolved: ['The target audience, desired behaviour and proof threshold for the investment.'],
          routeChangingQuestion:
            'Which group of fans must buy more tickets for you to move the GBP 18 million?',
          expectedAnswerShape: 'choice',
          answerWouldChange:
            'It determines what the system should observe, which creative route to test and what success means.',
          humanDecisionBoundary:
            'Mei and the creative leads own story, surprise and the final campaign; AI may analyse and prepare private tests.',
          expectedDiagnosticBehaviours: [
            'Anchor on the audience movement and creative boundary before discussing tools.',
            'Do not reduce the decision to reach, comments or automation savings.',
          ],
          forbiddenClaims: [
            'The precision system will improve ticket sales.',
            'More fan content is automatically better marketing.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'leader_reflection',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-05-06T09:00:00.000Z',
            recordedAt: '2026-05-06T09:01:00.000Z',
            content: 'Maybe comment volume is enough. We could let the system optimise the whole sequence.',
            claims: [
              {
                claimId: 'LIFE-STORY-I1-CONFLICT-CLAIM-01',
                text: 'Comment volume may be enough to define campaign success.',
                kind: 'interpretation',
                challengesClaimIds: ['INT-STORY-002-CLAIM-01'],
              },
              {
                claimId: 'LIFE-STORY-I1-CONFLICT-CLAIM-02',
                text: 'The system could optimise the whole campaign sequence.',
                kind: 'interpretation',
                challengesClaimIds: ['INT-STORY-002-CLAIM-04'],
              },
            ],
            sourceLocator: 'fixture://story/lifecycle/basic/conflict',
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'leader',
            audience: 'leader_private',
            validAt: '2026-05-07T09:00:00.000Z',
            recordedAt: '2026-05-07T09:01:00.000Z',
            content:
              'Do not turn that provocation into authority. Comment volume is not the goal and the creative team still owns the sequence.',
            sourceLocator: 'fixture://story/lifecycle/basic/correction',
          },
          retireConflictClaimIndexes: [0, 1],
          contradictedExpected: [
            'Show the comment-optimisation idea as a conflict with the human creative boundary.',
            'Ask whether it is a route or a provocation before changing the campaign view.',
          ],
          correctedExpected: [
            'Restore the human-owned creative boundary and keep comments as a possible signal, not the goal.',
            'Leave the target audience movement unresolved.',
          ],
          additionalForbidden: ['The system has authority to optimise the campaign sequence.'],
        },
      },
      work_evidence: {
        oracle: {
          decisionMagnitude: 'A GBP 18 million campaign allocation for a flagship global release.',
          decisionFocus:
            'Which exposure route, if either, should receive GBP 18 million after increasing purchases from franchise-new viewers without reducing core-fan purchases.',
          strongestSupportedView:
            'The character-led route currently earns more confidence than the high-theory route for new viewers, while theory remains useful for core fans.',
          countercase:
            'Trailer completion and stated comprehension may not translate into ticket purchase or durable fandom.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'The character-led route improved new-viewer completion, while three competing theories increased comments but reduced comprehension.',
              evidenceIds: ['INT-STORY-004'],
            },
            {
              standing: 'supported_pattern',
              text: 'The same theory density can reward core fans and make the story harder for new viewers to enter.',
              evidenceIds: ['INT-STORY-004', 'INT-STORY-005', 'INT-STORY-006'],
            },
            {
              standing: 'evidence_gap',
              text: 'Neither route has yet proved more ticket purchases from new viewers without reducing core-fan purchases.',
              evidenceIds: [],
            },
          ],
          unresolved: ['Which route increases new-viewer ticket purchases without reducing core-fan purchases.'],
          routeChangingQuestion:
            'Which route gets the GBP 18 million: character-first, theory-first, or neither until new buyers increase without losing core fans?',
          expectedAnswerShape: 'choice',
          answerWouldChange:
            'It governs the GBP 18 million route while preserving purchase evidence and the core-fan constraint.',
          humanDecisionBoundary:
            'AI may map exposure and compare private routes; accountable humans own characters, story and release.',
          expectedDiagnosticBehaviours: [
            'Use audience differences to design a comparative test, not one universal content rule.',
            'Keep comments separate from comprehension and ticket intent.',
          ],
          forbiddenClaims: [
            'The character-led route will sell more tickets.',
            'Core fans or new viewers are one homogeneous audience.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'operating_metric',
            subjectScope: 'customer',
            audience: 'company_private',
            validAt: '2026-05-22T17:00:00.000Z',
            recordedAt: '2026-05-23T08:00:00.000Z',
            content:
              'A social dashboard attributes a 24 percent ticket-intent lift to the three-theory route.',
            sourceLocator: 'fixture://story/lifecycle/work/conflict',
            challengesClaimIds: [
              'INT-STORY-004-CLAIM-02',
              'INT-STORY-005-CLAIM-01',
            ],
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'customer',
            audience: 'company_private',
            validAt: '2026-05-24T10:00:00.000Z',
            recordedAt: '2026-05-24T10:02:00.000Z',
            content:
              'The dashboard compared exposed core fans with an unexposed mixed audience. It cannot attribute ticket-intent lift to the route.',
            sourceLocator: 'fixture://story/lifecycle/work/correction',
          },
          contradictedExpected: [
            'Show the claimed lift as a conflict with the controlled test and audience evidence.',
            'Check whether the compared groups are alike before using the number.',
          ],
          correctedExpected: [
            'Withdraw the attributed lift, preserve the flawed comparison and restore the held-out test need.',
            'Keep comments, comprehension and ticket intent as separate measures.',
          ],
          additionalForbidden: ['The social dashboard proves the three-theory route caused ticket intent.'],
        },
      },
      longitudinal_corrections: {
        oracle: {
          decisionMagnitude: 'A GBP 18 million campaign allocation for a flagship global release.',
          decisionFocus:
            'What held-out proof should unlock the next major shift after three releases showed audience and sequence matter more than content volume.',
          strongestSupportedView:
            'The corrected judgement is not less theory but precise sequencing by audience, with creative humans retaining the final narrative call.',
          countercase:
            'The three-release pattern may be franchise-specific and stated intent may still fail to predict purchase.',
          allowedNotices: [
            {
              standing: 'measured_result',
              text: 'Across three releases, character-first exposure improved new-viewer intent while high theory density twice reduced casual comprehension.',
              evidenceIds: ['INT-STORY-007'],
            },
            {
              standing: 'authorised_correction',
              text: 'Mei corrected the belief that more theory always creates more excitement.',
              evidenceIds: ['INT-STORY-008'],
            },
            {
              standing: 'supported_pattern',
              text: 'Mei chooses audience entry and story clarity over the route that produces the most visible reaction.',
              evidenceIds: ['INT-STORY-004', 'INT-STORY-006', 'INT-STORY-008', 'INT-STORY-009'],
            },
          ],
          unresolved: ['The held-out lift and purchase evidence needed for the next allocation.'],
          routeChangingQuestion:
            'How many extra new viewers out of 100 must buy a ticket, without core-fan sales falling, before you move GBP 18 million?',
          expectedAnswerShape: 'threshold',
          answerWouldChange:
            'It creates a human-owned investment gate while the test protects creative judgement and causal clarity.',
          humanDecisionBoundary:
            'Mei sets the investment and creative gates; AI may propose and analyse tests but cannot publish or choose the story.',
          expectedDiagnosticBehaviours: [
            'Apply the correction by audience and sequence rather than creating a blanket anti-theory rule.',
            'Require held-out evidence before claiming commercial effect.',
          ],
          forbiddenClaims: [
            'Three fictional releases prove the same pattern for every franchise.',
            'The system should autonomously choose or publish campaign creative.',
          ],
        },
        lifecycle: {
          conflict: {
            sourceType: 'decision_outcome',
            subjectScope: 'customer',
            audience: 'company_private',
            validAt: '2026-09-08T17:00:00.000Z',
            recordedAt: '2026-09-09T08:00:00.000Z',
            content:
              'A post-release model says theory-heavy exposure was the largest predictor of opening-weekend purchase across all fan groups.',
            claims: [
              {
                claimId: 'LIFE-STORY-I3-CONFLICT-CLAIM-01',
                text: 'The model found an association between theory-heavy exposure and opening-weekend purchase in its data.',
                kind: 'observation',
                challengesClaimIds: [
                  'INT-STORY-007-CLAIM-01',
                  'INT-STORY-008-CLAIM-01',
                ],
              },
              {
                claimId: 'LIFE-STORY-I3-CONFLICT-CLAIM-02',
                text: 'Theory-heavy exposure causes opening-weekend purchase across all fan groups.',
                kind: 'interpretation',
                challengesClaimIds: [
                  'INT-STORY-007-CLAIM-01',
                  'INT-STORY-008-CLAIM-01',
                ],
              },
            ],
            sourceLocator: 'fixture://story/lifecycle/longitudinal/conflict',
          },
          correction: {
            sourceType: 'direct_correction',
            subjectScope: 'customer',
            audience: 'company_private',
            validAt: '2026-09-10T10:00:00.000Z',
            recordedAt: '2026-09-10T10:02:00.000Z',
            content:
              'The model used prior fandom as both an input and a purchase proxy. Keep the association, remove the causal claim and rerun by audience with a true holdout.',
            sourceLocator: 'fixture://story/lifecycle/longitudinal/correction',
          },
          retireConflictClaimIndexes: [1],
          contradictedExpected: [
            'Present the post-release model as a material countercase to the current pattern.',
            'Check for prior-fandom leakage before changing the campaign rule.',
          ],
          correctedExpected: [
            'Demote the result to an association, preserve the model receipt and keep the held-out test open.',
            'Repair any causal recommendation built from the leaked proxy.',
          ],
          additionalForbidden: ['A predictive model proves theory exposure caused purchase.'],
        },
      },
    },
  },
]

const G21_ANSWER_CONTRACTS: Record<string, G21RouteAnswerContract> = {
  'RANGE-INTERNAL-CARE-I1': {
    options: [],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Name the incident, complaint or service standard that should define the stopping rule.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Any specific stopping failure',
        effect: 'bound',
        routeChange: 'Bind the limited pilot to the human-defined failure that stops it.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Do not widen the pilot until a concrete stopping failure is defined.',
    },
  },
  'RANGE-INTERNAL-CARE-I2': {
    options: [],
    unit: 'unsafe journeys',
    denominator: '1,000 scheduled journeys',
    comparator: 'the maximum tolerated before stopping',
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Review the safety baseline and total journey volume before setting the limit.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Any valid threshold',
        effect: 'bound',
        routeChange: 'Use the stated unsafe-journey threshold as the human rollout stop rule.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Hold rollout until the baseline and tolerated safety limit are known.',
    },
  },
  'RANGE-INTERNAL-CARE-I3': {
    options: [],
    unit: 'vulnerable clients keeping the same carer',
    denominator: '100 vulnerable clients',
    comparator: 'the minimum required before expansion',
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Measure continuity for vulnerable clients and record whether Elena had to step in.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Any valid threshold',
        effect: 'bound',
        routeChange: 'Expand only after continuity reaches the threshold without Elena rescuing exceptions.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Keep expansion paused until continuity and executive intervention are measured together.',
    },
  },
  'RANGE-INTERNAL-RESEARCH-I1': {
    options: ['Faster answers', 'Access between projects', 'Live challenge'],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Ask repeat clients which part of the work made them hire Lumen again.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Faster answers',
        effect: 'select',
        routeChange: 'Test a faster-answer offer before moving delivery capacity.',
      },
      {
        answer: 'Access between projects',
        effect: 'select',
        routeChange: 'Test an access-between-projects offer before moving delivery capacity.',
      },
      {
        answer: 'Live challenge',
        effect: 'select',
        routeChange: 'Test a live-challenge offer before moving delivery capacity.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Do not choose the product promise until repeat-client evidence distinguishes it.',
    },
  },
  'RANGE-INTERNAL-RESEARCH-I2': {
    options: ['Yes', 'No'],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Run one paid client decision through the product without a senior researcher, then ask what changed.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Yes',
        effect: 'select',
        routeChange: 'Continue the repeatable-product route to an economics test using delivered challenge evidence.',
      },
      {
        answer: 'No',
        effect: 'reshape',
        routeChange: 'Treat the current offer as a senior service until challenge transfers without the researcher.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Do not call the product scalable until one paid delivered-use test resolves transfer.',
    },
  },
  'RANGE-INTERNAL-RESEARCH-I3': {
    options: [],
    unit: 'clients who pay for the new service again',
    denominator: null,
    comparator: 'the minimum required before moving half the team',
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Model the revenue and delivery capacity at different repeat-purchase counts.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Any valid threshold',
        effect: 'bound',
        routeChange: 'Move half the team only after repeat purchase reaches the leader-set threshold.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Keep the capacity move paused until its renewal and economics threshold is set.',
    },
  },
  'RANGE-INTERNAL-FORGE-I1': {
    options: ['Yes', 'No'],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Use one same-team test before deciding whether the roles must change.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Yes',
        effect: 'select',
        routeChange: 'Keep role redesign in scope, but require a reason beyond the current performance failure.',
      },
      {
        answer: 'No',
        effect: 'reshape',
        routeChange: 'Repair information and measures before deciding whether roles must change.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Delay the role conclusion until the same-team test separates people from system conditions.',
    },
  },
  'RANGE-INTERNAL-FORGE-I2': {
    options: ['Yes', 'No'],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Name one plant, one delivery target, one time window and the funding decision it controls.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Yes',
        effect: 'bound',
        routeChange: 'Make same-planner target delivery at one plant the gate for funding all six.',
      },
      {
        answer: 'No',
        effect: 'reshape',
        routeChange: 'Require Jonah to name a different proof gate before group funding can proceed.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Do not fund all six plants until an owner, target, time window and proof gate are named.',
    },
  },
  'RANGE-INTERNAL-FORGE-I3': {
    options: ['A named planner', 'A named operations leader', 'A named human chosen by the escalation rule'],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Review late-order cases and identify where customer accountability cannot be delegated.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'A named planner',
        effect: 'select',
        routeChange: 'Assign the customer-impact exception and final call to a named planner.',
      },
      {
        answer: 'A named operations leader',
        effect: 'select',
        routeChange: 'Escalate the customer-impact exception and final call to a named operations leader.',
      },
      {
        answer: 'A named human chosen by the escalation rule',
        effect: 'bound',
        routeChange: 'Automate routine planning only inside a rule that names the human exception owner.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Do not let the plan affect a customer until a human final-call owner is named.',
    },
  },
  'RANGE-INTERNAL-STORY-I1': {
    options: ['Franchise-new viewers', 'Casual viewers', 'Core fans', 'Another named group'],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Use ticket-buyer and audience evidence to define the group before choosing a route.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Franchise-new viewers',
        effect: 'select',
        routeChange: 'Judge the GBP 18 million route by ticket growth among franchise-new viewers.',
      },
      {
        answer: 'Casual viewers',
        effect: 'select',
        routeChange: 'Judge the GBP 18 million route by ticket growth among casual viewers.',
      },
      {
        answer: 'Core fans',
        effect: 'select',
        routeChange: 'Judge the GBP 18 million route by ticket growth among core fans.',
      },
      {
        answer: 'Another named group',
        effect: 'reshape',
        routeChange: 'Replace the audience gate with the leader-named ticket-buyer group.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Do not choose the campaign route until its intended ticket-buyer group is defined.',
    },
  },
  'RANGE-INTERNAL-STORY-I2': {
    options: ['Character-first', 'Theory-first', 'Neither until purchase evidence'],
    unit: null,
    denominator: null,
    comparator: null,
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Compare both routes on new-viewer purchases and core-fan purchases before allocating the budget.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Character-first',
        effect: 'select',
        routeChange: 'Choose character-first only with new-viewer purchase growth and no core-fan purchase loss.',
      },
      {
        answer: 'Theory-first',
        effect: 'select',
        routeChange: 'Choose theory-first only with new-viewer purchase growth and no core-fan purchase loss.',
      },
      {
        answer: 'Neither until purchase evidence',
        effect: 'stop',
        routeChange: 'Hold the GBP 18 million allocation until the two purchase conditions are tested.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Hold the allocation and run a comparable purchase test across both audience groups.',
    },
  },
  'RANGE-INTERNAL-STORY-I3': {
    options: [],
    unit: 'additional new viewers who buy a ticket',
    denominator: '100 new viewers',
    comparator: "today's campaign",
    unknownAllowed: true,
    evidenceRequestIfUnknown:
      'Measure actual ticket purchases in a held-out test and core-fan sales before setting the gate.',
    optionalNoteAllowed: true,
    routeEffects: [
      {
        answer: 'Any valid threshold',
        effect: 'bound',
        routeChange: 'Move the GBP 18 million only after new-viewer purchases clear the threshold and core-fan sales do not fall.',
      },
    ],
    unknownRouteEffect: {
      effect: 'stop',
      routeChange: 'Keep the allocation unchanged until purchase lift and the core-fan constraint are measured.',
    },
  },
}

export const G21_INTERNAL_RANGE_CANARY: G21InternalRangeProfile[] = familyDrafts.flatMap(
  (family) =>
    G21_NONZERO_INTERNAL_DEPTHS.map((internalDepth) => makeProfile(family, internalDepth)),
)

function canonicalSubstrate(profile: G21InternalRangeProfile): string {
  return JSON.stringify({
    manifest: profile.manifest,
    familyId: profile.familyId,
    identity: profile.identity,
    externalCoverage: profile.externalCoverage,
    externalEvidence: profile.externalEvidence,
    evidenceAsOf: profile.evidenceAsOf,
    internalEvidence: profile.internalEvidence,
    lifecycleEvidence: profile.lifecycleEvidence,
    audienceAuthorities: profile.audienceAuthorities,
    lifecycleOracle: profile.lifecycleOracle,
  })
}

function trustedExternalBinding(sources: G21SyntheticExternalEvidence[]): string {
  return JSON.stringify(
    sources.map((source) => ({
      sourceId: source.sourceId,
      locator: source.locator,
      sourceType: source.sourceType,
      publishedOn: source.publishedOn,
      retrievedOn: source.retrievedOn,
      syntheticDisclosure: source.syntheticDisclosure,
    })),
  )
}

function trustedEvidenceBinding(records: G21InternalEvidenceRecord[]): string {
  return JSON.stringify(
    records.map((record) => ({
      evidenceId: record.evidenceId,
      sourceType: record.sourceType,
      subjectScope: record.subjectScope,
      audience: record.audience,
      validAt: record.validAt,
      recordedAt: record.recordedAt,
      sourceLocator: record.sourceLocator,
      fixtureAuthority: record.fixtureAuthority,
      claims: record.claims.map((claim) => ({
        claimId: claim.claimId,
        kind: claim.kind,
        subjectScope: claim.subjectScope,
        challengesClaimIds: claim.challengesClaimIds,
        supersedesClaimIds: claim.supersedesClaimIds,
      })),
    })),
  )
}

function forbiddenOracleValues(profile: G21InternalRangeProfile): string[] {
  return [
    profile.oracle.decisionMagnitude,
    profile.oracle.decisionFocus,
    profile.oracle.strongestSupportedView,
    profile.oracle.countercase,
    ...profile.oracle.unresolved,
    profile.oracle.routeChangingQuestion,
    profile.oracle.answerWouldChange,
    profile.oracle.humanDecisionBoundary,
    ...profile.oracle.expectedDiagnosticBehaviours,
    ...profile.oracle.forbiddenClaims,
    ...profile.oracle.allowedNotices.map((notice) => notice.text),
    profile.oracle.answerContract.evidenceRequestIfUnknown,
    ...profile.oracle.answerContract.routeEffects.map((effect) => effect.routeChange),
    profile.oracle.answerContract.unknownRouteEffect.routeChange,
  ].filter((value) => value.length >= 24)
}

const G21_FROZEN_SUBSTRATE_BY_PROFILE_ID = new Map(
  G21_INTERNAL_RANGE_CANARY.map((profile) => [
    profile.manifest.profileId,
    canonicalSubstrate(profile),
  ]),
)

const G21_TRUSTED_RUNTIME_BINDING_BY_PROFILE_ID = new Map(
  G21_INTERNAL_RANGE_CANARY.map((profile) => [
    profile.manifest.profileId,
    {
      subject: JSON.stringify(profile.identity),
      externalDepth: profile.manifest.externalDepth,
      internalDepth: profile.manifest.internalDepth,
      externalCoverage: JSON.stringify(profile.externalCoverage),
      externalEvidence: trustedExternalBinding(profile.externalEvidence),
      evidenceByState: Object.fromEntries(
        RANGE_RUNTIME_STATES.map((runtimeState) => [
          runtimeState,
          trustedEvidenceBinding(evidenceForRuntimeState(profile, runtimeState)),
        ]),
      ) as Record<RangeRuntimeState, string>,
      forbiddenOracleValues: forbiddenOracleValues(profile),
    },
  ]),
)

const G21_FROZEN_LIFECYCLE_ORACLE_BY_PROFILE_ID = new Map(
  G21_INTERNAL_RANGE_CANARY.map((profile) => [
    profile.manifest.profileId,
    JSON.stringify(profile.lifecycleOracle),
  ]),
)

const G21_FROZEN_ORACLE_BY_PROFILE_ID = new Map(
  G21_INTERNAL_RANGE_CANARY.map((profile) => [
    profile.manifest.profileId,
    JSON.stringify(profile.oracle),
  ]),
)

const G21_FROZEN_LIFECYCLE_EVIDENCE_BY_PROFILE_ID = new Map(
  G21_INTERNAL_RANGE_CANARY.map((profile) => [
    profile.manifest.profileId,
    JSON.stringify(profile.lifecycleEvidence),
  ]),
)

const G21_FROZEN_CLAIM_RELATIONS_BY_PROFILE_ID = new Map(
  G21_INTERNAL_RANGE_CANARY.map((profile) => [
    profile.manifest.profileId,
    JSON.stringify(
      allPrivateEvidence(profile).flatMap((record) =>
        record.claims.map((claim) => ({
          claimId: claim.claimId,
          challengesClaimIds: claim.challengesClaimIds,
          supersedesClaimIds: claim.supersedesClaimIds,
        })),
      ),
    ),
  ]),
)

const G21_PROFILE_FIELDS = [
  'manifest',
  'familyId',
  'identity',
  'externalCoverage',
  'externalEvidence',
  'evidenceAsOf',
  'internalEvidence',
  'lifecycleEvidence',
  'audienceAuthorities',
  'lifecycleOracle',
  'oracle',
] as const
const G21_SYNTHETIC_MANIFEST_FIELDS = [
  'profileId',
  'displayLabel',
  'namespace',
  'externalDepth',
  'internalDepth',
  'realNamedPerson',
  'publicSourceLocators',
  'syntheticDisclosure',
] as const
const G21_IDENTITY_FIELDS = [
  'fictionalIdentityKey',
  'displayName',
  'role',
  'organisation',
  'organisationDescription',
  'decisionFamily',
] as const
const G21_EXTERNAL_EVIDENCE_FIELDS = [
  'sourceId',
  'locator',
  'title',
  'sourceType',
  'publishedOn',
  'retrievedOn',
  'summary',
  'limitations',
  'syntheticDisclosure',
] as const
const G21_INTERNAL_EVIDENCE_FIELDS = [
  'evidenceId',
  'sourceType',
  'subjectScope',
  'audience',
  'validAt',
  'recordedAt',
  'content',
  'sourceLocator',
  'claims',
  'fixtureAuthority',
] as const
const G21_INTERNAL_CLAIM_FIELDS = [
  'claimId',
  'text',
  'kind',
  'subjectScope',
  'challengesClaimIds',
  'supersedesClaimIds',
] as const
const G21_AUDIENCE_AUTHORITY_FIELDS = [
  'authorityId',
  'evidenceId',
  'authorisedAudience',
  'authorityType',
  'authorisedAt',
] as const
const G21_EXTERNAL_COVERAGE_FIELDS = [
  'currentIdentity',
  'currentBusinessContext',
  'currentDecisionTension',
  'currentOutcomeEvidence',
  'currentCountercase',
  'longitudinalContinuity',
] as const
const G21_ORACLE_FIELDS = [
  'decisionMagnitude',
  'decisionFocus',
  'strongestSupportedView',
  'countercase',
  'allowedNotices',
  'unresolved',
  'routeChangingQuestion',
  'expectedAnswerShape',
  'answerContract',
  'answerWouldChange',
  'humanDecisionBoundary',
  'expectedDiagnosticBehaviours',
  'forbiddenClaims',
] as const
const G21_ANSWER_CONTRACT_FIELDS = [
  'options',
  'unit',
  'denominator',
  'comparator',
  'unknownAllowed',
  'evidenceRequestIfUnknown',
  'optionalNoteAllowed',
  'routeEffects',
  'unknownRouteEffect',
] as const
const G21_ROUTE_EFFECT_FIELDS = ['answer', 'effect', 'routeChange'] as const
const G21_UNKNOWN_ROUTE_EFFECT_FIELDS = ['effect', 'routeChange'] as const
const G21_ALLOWED_NOTICE_FIELDS = ['standing', 'text', 'evidenceIds', 'noticeId'] as const
const G21_LIFECYCLE_ORACLE_FIELDS = [
  'runtimeState',
  'evidenceIdsAdded',
  'expectedNotices',
  'forbiddenClaims',
] as const

export const G21_INTERNAL_R1_TASK =
  'Frame one specific consequential decision diagnostic from this fictional evidence. Keep observations, direct statements, interpretations, corrections and unknowns separate. Preserve conflict and provenance. Ask one plain, bounded question only if its answer can select, stop or reshape the route. Do not recommend or execute consequential action, create durable truth or assess any named employee. The human owns purpose, standards, exceptions and the final call.'

export const G21_INTERNAL_R1_AUTHORITY = {
  responsibilityGate: 1,
  mayFrameDecision: true,
  mayRecommendConsequentialAction: false,
  mayPromoteDurableTruth: false,
  mayEvaluateNamedEmployees: false,
} as const

export const G21_INTERNAL_BLIND_INPUT_FIELDS = [
  'schemaVersion',
  'runId',
  'caseId',
  'profileId',
  'runtimeState',
  'subject',
  'externalDepth',
  'internalDepth',
  'evidenceAsOf',
  'externalCoverage',
  'externalEvidence',
  'internalEvidence',
  'audienceAuthorities',
  'currentClaims',
  'task',
  'authority',
] as const
const G21_INPUT_AUTHORITY_FIELDS = [
  'responsibilityGate',
  'mayFrameDecision',
  'mayRecommendConsequentialAction',
  'mayPromoteDurableTruth',
  'mayEvaluateNamedEmployees',
] as const
const G21_RESOLVED_CLAIM_FIELDS = [
  ...G21_INTERNAL_CLAIM_FIELDS,
  'evidenceId',
  'sourceLocator',
  'audience',
  'status',
  'challengedByClaimIds',
  'supersededByClaimIds',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactFields(value: unknown, expected: readonly string[]): boolean {
  if (!isRecord(value)) return false
  const fields = Object.keys(value)
  return (
    fields.length === expected.length &&
    fields.every((field) => expected.includes(field)) &&
    expected.every((field) => Object.prototype.hasOwnProperty.call(value, field))
  )
}

function nonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function collectStringValues(value: unknown, seen = new WeakSet<object>()): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object' || value === null) return []
  if (seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStringValues(item, seen))
  }
  return Object.values(value).flatMap((item) => collectStringValues(item, seen))
}

function validateFictionalIdentityShape(value: unknown): string[] {
  if (!hasExactFields(value, G21_IDENTITY_FIELDS)) return ['fields_invalid']
  const identity = value as Record<string, unknown>
  const errors: string[] = []
  for (const field of G21_IDENTITY_FIELDS) {
    if (!nonemptyString(identity[field])) errors.push(`${field}_invalid`)
  }
  return errors
}

function validateExternalCoverageShape(value: unknown): string[] {
  if (!hasExactFields(value, G21_EXTERNAL_COVERAGE_FIELDS)) return ['fields_invalid']
  const coverage = value as Record<string, unknown>
  return G21_EXTERNAL_COVERAGE_FIELDS.flatMap((field) =>
    typeof coverage[field] === 'boolean' ? [] : [`${field}_invalid`],
  )
}

function validateExternalEvidenceShape(value: unknown): string[] {
  if (!hasExactFields(value, G21_EXTERNAL_EVIDENCE_FIELDS)) return ['fields_invalid']
  const source = value as Record<string, unknown>
  const errors: string[] = []
  for (const field of [
    'sourceId',
    'locator',
    'title',
    'sourceType',
    'publishedOn',
    'retrievedOn',
    'summary',
    'syntheticDisclosure',
  ] as const) {
    if (!nonemptyString(source[field])) errors.push(`${field}_invalid`)
  }
  if (!stringArray(source.limitations) || source.limitations.length === 0) {
    errors.push('limitations_invalid')
  }
  return errors
}

function validateInternalClaimShape(value: unknown): string[] {
  if (!hasExactFields(value, G21_INTERNAL_CLAIM_FIELDS)) return ['fields_invalid']
  const claim = value as Record<string, unknown>
  const errors: string[] = []
  for (const field of ['claimId', 'text', 'kind', 'subjectScope'] as const) {
    if (!nonemptyString(claim[field])) errors.push(`${field}_invalid`)
  }
  for (const field of ['challengesClaimIds', 'supersedesClaimIds'] as const) {
    if (!stringArray(claim[field])) errors.push(`${field}_invalid`)
  }
  return errors
}

function validateInternalEvidenceShape(value: unknown): string[] {
  if (!hasExactFields(value, G21_INTERNAL_EVIDENCE_FIELDS)) return ['fields_invalid']
  const record = value as Record<string, unknown>
  const errors: string[] = []
  for (const field of [
    'evidenceId',
    'sourceType',
    'subjectScope',
    'audience',
    'validAt',
    'recordedAt',
    'content',
    'sourceLocator',
    'fixtureAuthority',
  ] as const) {
    if (!nonemptyString(record[field])) errors.push(`${field}_invalid`)
  }
  if (!Array.isArray(record.claims)) {
    errors.push('claims_invalid')
  } else {
    for (const [index, claim] of record.claims.entries()) {
      errors.push(...validateInternalClaimShape(claim).map((error) => `claim_${index}_${error}`))
    }
  }
  return errors
}

function validateAudienceAuthorityShape(value: unknown): string[] {
  if (!hasExactFields(value, G21_AUDIENCE_AUTHORITY_FIELDS)) return ['fields_invalid']
  const authority = value as Record<string, unknown>
  return G21_AUDIENCE_AUTHORITY_FIELDS.flatMap((field) =>
    nonemptyString(authority[field]) ? [] : [`${field}_invalid`],
  )
}

function validateResolvedClaimShape(value: unknown): string[] {
  if (!hasExactFields(value, G21_RESOLVED_CLAIM_FIELDS)) return ['fields_invalid']
  const claim = value as Record<string, unknown>
  const errors: string[] = []
  for (const field of [
    'claimId',
    'text',
    'kind',
    'subjectScope',
    'evidenceId',
    'sourceLocator',
    'audience',
    'status',
  ] as const) {
    if (!nonemptyString(claim[field])) errors.push(`${field}_invalid`)
  }
  for (const field of [
    'challengesClaimIds',
    'supersedesClaimIds',
    'challengedByClaimIds',
    'supersededByClaimIds',
  ] as const) {
    if (!stringArray(claim[field])) errors.push(`${field}_invalid`)
  }
  return errors
}

function allEvidenceIds(profile: G21InternalRangeProfile): string[] {
  return [
    ...profile.externalEvidence.map((source) => source.sourceId),
    ...profile.internalEvidence.map((source) => source.evidenceId),
  ]
}

function allPrivateEvidence(profile: G21InternalRangeProfile): G21InternalEvidenceRecord[] {
  return [...profile.internalEvidence, ...profile.lifecycleEvidence]
}

export function buildG21CurrentClaimView(
  records: G21InternalEvidenceRecord[],
): G21ResolvedInternalClaim[] {
  const supersedingClaimsByClaim = new Map<string, string[]>()

  for (const record of records) {
    for (const claim of record.claims) {
      for (const claimId of claim.supersedesClaimIds) {
        const superseding = supersedingClaimsByClaim.get(claimId) ?? []
        superseding.push(claim.claimId)
        supersedingClaimsByClaim.set(claimId, superseding)
      }
    }
  }

  const activeChallengingClaimsByClaim = new Map<string, string[]>()
  for (const record of records) {
    for (const claim of record.claims) {
      if ((supersedingClaimsByClaim.get(claim.claimId) ?? []).length > 0) continue
      for (const claimId of claim.challengesClaimIds) {
        const challenging = activeChallengingClaimsByClaim.get(claimId) ?? []
        challenging.push(claim.claimId)
        activeChallengingClaimsByClaim.set(claimId, challenging)
      }
    }
  }

  return records.flatMap((record) =>
    record.claims.map((claim) => {
      const supersededByClaimIds = supersedingClaimsByClaim.get(claim.claimId) ?? []
      const challengedByClaimIds = activeChallengingClaimsByClaim.get(claim.claimId) ?? []
      return {
        ...structuredClone(claim),
        evidenceId: record.evidenceId,
        sourceLocator: record.sourceLocator,
        audience: record.audience,
        status:
          supersededByClaimIds.length > 0
            ? 'superseded'
            : challengedByClaimIds.length > 0
              ? 'disputed'
              : 'current',
        challengedByClaimIds,
        supersededByClaimIds,
      }
    }),
  )
}

function resolveEvidenceType(
  profile: G21InternalRangeProfile,
  evidenceId: string,
): G21InternalSourceType | 'synthetic_external' | undefined {
  if (profile.externalEvidence.some((source) => source.sourceId === evidenceId)) {
    return 'synthetic_external'
  }
  return profile.internalEvidence.find((source) => source.evidenceId === evidenceId)?.sourceType
}

function validateInternalRecord(
  record: G21InternalEvidenceRecord,
  availableEvidence: G21InternalEvidenceRecord[],
  evidenceAsOf: string,
): string[] {
  const errors: string[] = []
  if (!hasExactFields(record, G21_INTERNAL_EVIDENCE_FIELDS)) {
    errors.push('evidence_fields_invalid')
  }
  if (!/^(?:INT|LIFE)-[A-Z0-9-]+$/.test(record.evidenceId)) errors.push('evidence_id_invalid')
  if (!G21_INTERNAL_SOURCE_TYPES.includes(record.sourceType)) errors.push('source_type_invalid')
  if (!G21_INTERNAL_SUBJECT_SCOPES.includes(record.subjectScope)) errors.push('subject_scope_invalid')
  if (
    G21_INTERNAL_SOURCE_TYPES.includes(record.sourceType) &&
    G21_INTERNAL_SUBJECT_SCOPES.includes(record.subjectScope) &&
    !SOURCE_SUBJECT_CAPABILITIES[record.sourceType].includes(record.subjectScope)
  ) {
    errors.push('source_subject_incompatible')
  }
  if (!G21_INTERNAL_AUDIENCES.includes(record.audience)) errors.push('audience_invalid')
  if (!validIsoTimestamp(record.validAt)) errors.push('valid_at_invalid')
  if (!validIsoTimestamp(record.recordedAt)) errors.push('recorded_at_invalid')
  if (validIsoTimestamp(record.validAt) && validIsoTimestamp(record.recordedAt)) {
    if (Date.parse(record.recordedAt) < Date.parse(record.validAt)) errors.push('recorded_before_valid')
  }
  if (validIsoTimestamp(record.validAt) && Date.parse(record.validAt) > Date.parse(evidenceAsOf)) {
    errors.push('valid_at_after_as_of')
  }
  if (validIsoTimestamp(record.recordedAt) && Date.parse(record.recordedAt) > Date.parse(evidenceAsOf)) {
    errors.push('recorded_at_after_as_of')
  }
  if (!record.content.trim()) errors.push('content_required')
  if (!record.sourceLocator.startsWith('fixture://')) errors.push('fixture_locator_required')
  if (record.fixtureAuthority !== 'synthetic_fixture_authoring') {
    errors.push('fixture_authority_required')
  }
  if (
    Object.prototype.hasOwnProperty.call(record as unknown as Record<string, unknown>, 'supersedesEvidenceId') ||
    Object.prototype.hasOwnProperty.call(record as unknown as Record<string, unknown>, 'supersedesClaimIds') ||
    Object.prototype.hasOwnProperty.call(record as unknown as Record<string, unknown>, 'contradictsEvidenceIds')
  ) {
    errors.push('record_level_supersession_forbidden')
  }
  if (!record.claims.length) errors.push('claim_required')
  const ownClaimIds = record.claims.map((claim) => claim.claimId)
  if (new Set(ownClaimIds).size !== ownClaimIds.length) errors.push('claim_ids_must_be_unique')
  for (const claim of record.claims) {
    if (!hasExactFields(claim, G21_INTERNAL_CLAIM_FIELDS)) {
      errors.push(`claim_fields_invalid_${claim.claimId}`)
    }
    if (!claim.claimId.startsWith(`${record.evidenceId}-CLAIM-`)) {
      errors.push(`claim_id_wrong_owner_${claim.claimId}`)
    }
    if (!/^.+-CLAIM-\d{2}$/.test(claim.claimId)) errors.push(`claim_id_invalid_${claim.claimId}`)
    if (!claim.text.trim()) errors.push(`claim_text_required_${claim.claimId}`)
    if (!G21_INTERNAL_ASSERTION_KINDS.includes(claim.kind)) {
      errors.push(`claim_kind_invalid_${claim.claimId}`)
    }
    if (!G21_INTERNAL_SUBJECT_SCOPES.includes(claim.subjectScope)) {
      errors.push(`claim_subject_invalid_${claim.claimId}`)
    }
    if (claim.subjectScope !== record.subjectScope) {
      errors.push(`claim_subject_must_match_record_${claim.claimId}`)
    }
    if (claim.kind === 'observation' && CATEGORICAL_CAUSAL_CLAIM.test(claim.text)) {
      errors.push(`observational_claim_cannot_assert_causation_${claim.claimId}`)
    }
    if (new Set(claim.challengesClaimIds).size !== claim.challengesClaimIds.length) {
      errors.push(`challenge_claim_ids_must_be_unique_${claim.claimId}`)
    }
    if (new Set(claim.supersedesClaimIds).size !== claim.supersedesClaimIds.length) {
      errors.push(`supersedes_claim_ids_must_be_unique_${claim.claimId}`)
    }
  }
  const availableClaims = availableEvidence.flatMap((candidate) =>
    candidate.claims.map((claim) => ({ claim, record: candidate })),
  )
  const supersededClaimIds = record.claims.flatMap((claim) => claim.supersedesClaimIds)
  if (record.sourceType === 'direct_correction' && supersededClaimIds.length === 0) {
    errors.push('direct_correction_requires_claim_target')
  }
  if (record.sourceType !== 'direct_correction' && supersededClaimIds.length > 0) {
    errors.push('supersession_requires_direct_correction')
  }
  if (new Set(supersededClaimIds).size !== supersededClaimIds.length) {
    errors.push('supersedes_claim_ids_must_be_unique')
  }
  for (const claim of record.claims) {
    if (record.sourceType === 'direct_correction' && claim.kind !== 'authorised_correction') {
      errors.push(`direct_correction_claim_kind_invalid_${claim.claimId}`)
    }
    if (record.sourceType !== 'direct_correction' && claim.kind === 'authorised_correction') {
      errors.push(`authorised_correction_requires_direct_source_${claim.claimId}`)
    }
    for (const relation of [
      ...claim.challengesClaimIds.map((claimId) => ({ claimId, type: 'challenge' as const })),
      ...claim.supersedesClaimIds.map((claimId) => ({ claimId, type: 'supersession' as const })),
    ]) {
      const target = availableClaims.find((candidate) => candidate.claim.claimId === relation.claimId)
      if (!target) {
        errors.push(`${relation.type}_claim_target_missing_${relation.claimId}`)
        continue
      }
      if (target.claim.claimId === claim.claimId) {
        errors.push(`cannot_${relation.type}_self_${relation.claimId}`)
      }
      if (Date.parse(target.record.recordedAt) >= Date.parse(record.recordedAt)) {
        errors.push(`${relation.type}_must_follow_target_${relation.claimId}`)
      }
      if (Date.parse(target.record.validAt) >= Date.parse(record.validAt)) {
        errors.push(`${relation.type}_valid_at_must_follow_target_${relation.claimId}`)
      }
      if (
        relation.type === 'supersession' &&
        target.claim.subjectScope !== claim.subjectScope
      ) {
        errors.push(`supersession_subject_mismatch_${relation.claimId}`)
      }
    }
  }
  return errors
}

export function validateG21InternalRangeProfile(profile: G21InternalRangeProfile): string[] {
  const errors = validateProfileManifest(profile.manifest)
  const {
    manifest,
    identity,
    externalEvidence,
    evidenceAsOf,
    internalEvidence: records,
    audienceAuthorities,
    oracle,
  } = profile
  const internalDepth = manifest.internalDepth as G21NonzeroInternalDepth
  const externalIds = externalEvidence.map((source) => source.sourceId)
  const internalIds = records.map((record) => record.evidenceId)
  const evidenceIds = allEvidenceIds(profile)
  const privateEvidence = allPrivateEvidence(profile)
  const privateEvidenceIds = privateEvidence.map((record) => record.evidenceId)

  if (!hasExactFields(profile, G21_PROFILE_FIELDS)) errors.push('profile_fields_invalid')
  if (!hasExactFields(manifest, G21_SYNTHETIC_MANIFEST_FIELDS)) {
    errors.push('synthetic_manifest_fields_invalid')
  }
  if (!hasExactFields(identity, G21_IDENTITY_FIELDS)) errors.push('identity_fields_invalid')
  if (!hasExactFields(profile.externalCoverage, G21_EXTERNAL_COVERAGE_FIELDS)) {
    errors.push('external_coverage_fields_invalid')
  }
  if (!hasExactFields(oracle, G21_ORACLE_FIELDS)) errors.push('oracle_fields_invalid')
  if (!hasExactFields(oracle.answerContract, G21_ANSWER_CONTRACT_FIELDS)) {
    errors.push('answer_contract_fields_invalid')
  }
  if (!G21_NONZERO_INTERNAL_DEPTHS.includes(internalDepth)) {
    errors.push('nonzero_internal_depth_required')
  }
  if (!validIsoTimestamp(evidenceAsOf)) errors.push('evidence_as_of_invalid')
  if (evidenceAsOf !== G21_INTERNAL_RANGE_EVIDENCE_AS_OF) {
    errors.push('evidence_as_of_must_match_frozen_clock')
  }
  if (manifest.namespace !== 'synthetic_fixture') errors.push('internal_range_requires_fixture_namespace')
  if (manifest.realNamedPerson) errors.push('internal_range_cannot_name_real_person')
  if (manifest.consentRecordId) errors.push('fictional_fixture_cannot_claim_consent')
  if (manifest.syntheticDisclosure !== FICTIONAL_DISCLOSURE) {
    errors.push('fictional_disclosure_required')
  }
  if (!identity.fictionalIdentityKey.startsWith('fictional-')) {
    errors.push('fictional_identity_key_required')
  }
  if (!identity.displayName.trim() || !identity.organisation.trim()) errors.push('identity_required')
  if (!identity.organisationDescription.toLowerCase().includes('fictional')) {
    errors.push('fictional_organisation_description_required')
  }
  if (!exactCoverage(profile.externalCoverage, EXPECTED_EXTERNAL_COVERAGE[manifest.externalDepth])) {
    errors.push('external_coverage_does_not_match_depth')
  }
  if (!sameStringSet(
    manifest.publicSourceLocators,
    externalEvidence.map((source) => source.locator),
  )) {
    errors.push('manifest_source_locators_must_match_fixture_envelope')
  }
  if (manifest.externalDepth === 'none_or_unusable' && externalEvidence.length > 0) {
    errors.push('zero_external_depth_cannot_have_sources')
  }
  if (manifest.externalDepth !== 'none_or_unusable' && externalEvidence.length === 0) {
    errors.push('nonzero_external_depth_requires_sources')
  }
  const externalTypes = new Set(externalEvidence.map((source) => source.sourceType))
  if (manifest.externalDepth === 'sparse' && externalEvidence.length < 2) {
    errors.push('sparse_external_depth_requires_two_sources')
  }
  if (manifest.externalDepth === 'useful') {
    for (const sourceType of [
      'company_identity',
      'company_strategy',
      'company_result',
      'countercase',
    ] as const) {
      if (!externalTypes.has(sourceType)) errors.push(`useful_external_depth_requires_${sourceType}`)
    }
  }
  if (manifest.externalDepth === 'rich_longitudinal') {
    if (externalEvidence.length < 5) errors.push('rich_external_depth_requires_five_sources')
    if (!externalTypes.has('historical_record')) {
      errors.push('rich_external_depth_requires_historical_record')
    }
    const publishedTimes = externalEvidence.map((source) => Date.parse(source.publishedOn))
    if (Math.max(...publishedTimes) - Math.min(...publishedTimes) < 365 * 24 * 60 * 60 * 1000) {
      errors.push('rich_external_depth_requires_year_span')
    }
  }
  if (new Set(externalIds).size !== externalIds.length) errors.push('external_source_ids_must_be_unique')
  if (new Set(internalIds).size !== internalIds.length) errors.push('internal_evidence_ids_must_be_unique')
  if (new Set(privateEvidenceIds).size !== privateEvidenceIds.length) {
    errors.push('private_evidence_ids_must_be_unique_across_lifecycle')
  }

  for (const source of externalEvidence) {
    if (!hasExactFields(source, G21_EXTERNAL_EVIDENCE_FIELDS)) {
      errors.push(`${source.sourceId}:external_evidence_fields_invalid`)
    }
    if (!/^EXT-[A-Z0-9-]+$/.test(source.sourceId)) errors.push(`${source.sourceId}:source_id_invalid`)
    if (!G21_SYNTHETIC_EXTERNAL_SOURCE_TYPES.includes(source.sourceType)) {
      errors.push(`${source.sourceId}:source_type_invalid`)
    }
    if (!source.locator.startsWith('https://') || !source.locator.includes('.invalid/')) {
      errors.push(`${source.sourceId}:fictional_invalid_domain_required`)
    }
    if (!validIsoTimestamp(source.publishedOn)) errors.push(`${source.sourceId}:published_on_invalid`)
    if (!validIsoTimestamp(source.retrievedOn)) errors.push(`${source.sourceId}:retrieved_on_invalid`)
    if (Date.parse(source.publishedOn) > Date.parse(source.retrievedOn)) {
      errors.push(`${source.sourceId}:published_after_retrieval`)
    }
    if (validIsoTimestamp(source.publishedOn) && Date.parse(source.publishedOn) > Date.parse(evidenceAsOf)) {
      errors.push(`${source.sourceId}:published_after_as_of`)
    }
    if (validIsoTimestamp(source.retrievedOn) && Date.parse(source.retrievedOn) > Date.parse(evidenceAsOf)) {
      errors.push(`${source.sourceId}:retrieved_after_as_of`)
    }
    if (source.syntheticDisclosure !== SYNTHETIC_EXTERNAL_DISCLOSURE) {
      errors.push(`${source.sourceId}:synthetic_disclosure_required`)
    }
    if (!source.summary.trim()) errors.push(`${source.sourceId}:summary_required`)
    if (!source.limitations.length) errors.push(`${source.sourceId}:limitation_required`)
  }

  for (const record of records) {
    errors.push(
      ...validateInternalRecord(record, records, evidenceAsOf).map(
        (error) => `${record.evidenceId}:${error}`,
      ),
    )
  }

  const lifecycleIds = profile.lifecycleEvidence.map((record) => record.evidenceId)
  if (profile.lifecycleEvidence.length !== 2) errors.push('two_lifecycle_events_required')
  if (new Set(lifecycleIds).size !== lifecycleIds.length) errors.push('lifecycle_ids_must_be_unique')
  const conflict = profile.lifecycleEvidence[0]
  const correction = profile.lifecycleEvidence[1]
  const conflictChallengeIds = conflict?.claims.flatMap((claim) => claim.challengesClaimIds) ?? []
  const correctionSupersessionIds =
    correction?.claims.flatMap((claim) => claim.supersedesClaimIds) ?? []
  const conflictClaimIds = conflict?.claims.map((claim) => claim.claimId) ?? []
  if (conflict && conflictChallengeIds.length === 0) {
    errors.push('conflict_requires_target')
  }
  if (correction?.sourceType !== 'direct_correction') errors.push('lifecycle_correction_required')
  if (
    conflict &&
    (correctionSupersessionIds.length === 0 ||
      correctionSupersessionIds.some((claimId) => !conflictClaimIds.includes(claimId)))
  ) {
    errors.push('lifecycle_correction_must_supersede_conflict')
  }
  if (conflict && correction && Date.parse(correction.recordedAt) <= Date.parse(conflict.recordedAt)) {
    errors.push('lifecycle_correction_must_follow_conflict')
  }
  if (conflict && correction && Date.parse(correction.validAt) <= Date.parse(conflict.validAt)) {
    errors.push('lifecycle_correction_valid_at_must_follow_conflict')
  }
  const lifecycleAvailable = [...records, ...profile.lifecycleEvidence]
  for (const record of profile.lifecycleEvidence) {
    errors.push(
      ...validateInternalRecord(record, lifecycleAvailable, evidenceAsOf).map(
        (error) => `${record.evidenceId}:${error}`,
      ),
    )
  }

  const claimIds = privateEvidence.flatMap((record) => record.claims.map((claim) => claim.claimId))
  if (new Set(claimIds).size !== claimIds.length) errors.push('claim_ids_must_be_globally_unique')
  const supersededClaimIds = privateEvidence.flatMap((record) =>
    record.claims.flatMap((claim) => claim.supersedesClaimIds),
  )
  if (new Set(supersededClaimIds).size !== supersededClaimIds.length) {
    errors.push('claim_cannot_be_superseded_more_than_once')
  }

  const authorityIds = audienceAuthorities.map((authority) => authority.authorityId)
  const authorisedEvidenceIds = audienceAuthorities.map((authority) => authority.evidenceId)
  if (new Set(authorityIds).size !== authorityIds.length) {
    errors.push('audience_authority_ids_must_be_unique')
  }
  if (new Set(authorisedEvidenceIds).size !== authorisedEvidenceIds.length) {
    errors.push('one_audience_authority_per_evidence')
  }
  if (!sameStringSet(authorisedEvidenceIds, privateEvidenceIds)) {
    errors.push('audience_authority_must_cover_exact_private_evidence')
  }
  for (const authority of audienceAuthorities) {
    const record = privateEvidence.find((candidate) => candidate.evidenceId === authority.evidenceId)
    if (!hasExactFields(authority, G21_AUDIENCE_AUTHORITY_FIELDS)) {
      errors.push(`${authority.authorityId}:authority_fields_invalid`)
    }
    if (!/^AUTH-(?:INT|LIFE)-[A-Z0-9-]+$/.test(authority.authorityId)) {
      errors.push(`${authority.authorityId}:authority_id_invalid`)
    }
    if (authority.authorityType !== 'synthetic_fixture_authoring') {
      errors.push(`${authority.authorityId}:authority_type_invalid`)
    }
    if (!G21_INTERNAL_AUDIENCES.includes(authority.authorisedAudience)) {
      errors.push(`${authority.authorityId}:authorised_audience_invalid`)
    }
    if (!validIsoTimestamp(authority.authorisedAt)) {
      errors.push(`${authority.authorityId}:authorised_at_invalid`)
    }
    if (validIsoTimestamp(authority.authorisedAt) && Date.parse(authority.authorisedAt) > Date.parse(evidenceAsOf)) {
      errors.push(`${authority.authorityId}:authorised_after_as_of`)
    }
    if (record && authority.authorisedAudience !== record.audience) {
      errors.push(`${authority.authorityId}:audience_widening_without_authority`)
    }
    if (record && authority.authorityId !== `AUTH-${record.evidenceId}`) {
      errors.push(`${authority.authorityId}:authority_must_match_evidence`)
    }
    if (record && authority.authorisedAt !== record.recordedAt) {
      errors.push(`${authority.authorityId}:authority_time_must_match_recording`)
    }
  }

  if (internalDepth === 'basic_intake') {
    if (records.length < 2 || records.some((record) => !BASIC_SOURCE_TYPES.includes(record.sourceType))) {
      errors.push('basic_intake_may_only_use_intake_and_reflection')
    }
  }
  if (internalDepth === 'work_evidence' || internalDepth === 'longitudinal_corrections') {
    if (!records.some((record) => BASIC_SOURCE_TYPES.includes(record.sourceType))) {
      errors.push('work_depth_requires_intake_foundation')
    }
    if (!records.some((record) => WORK_SOURCE_TYPES.includes(record.sourceType))) {
      errors.push('work_depth_requires_work_artifact')
    }
    if (!records.some((record) => MEASURED_SOURCE_TYPES.includes(record.sourceType))) {
      errors.push('work_depth_requires_measured_evidence')
    }
  }
  if (internalDepth === 'work_evidence' && records.some((record) => record.sourceType === 'direct_correction')) {
    errors.push('work_depth_cannot_simulate_longitudinal_correction')
  }
  if (internalDepth === 'longitudinal_corrections') {
    const correctionRecords = records.filter((record) => record.sourceType === 'direct_correction')
    if (!correctionRecords.length) errors.push('longitudinal_depth_requires_correction')
    if (
      correctionRecords.some(
        (record) => !record.claims.some((claim) => claim.supersedesClaimIds.length > 0),
      )
    ) {
      errors.push('longitudinal_correction_requires_supersession')
    }
    const times = records.map((record) => Date.parse(record.validAt))
    if (Math.max(...times) - Math.min(...times) < 60 * 24 * 60 * 60 * 1000) {
      errors.push('longitudinal_depth_requires_sixty_day_span')
    }
  }

  if (!oracle.decisionMagnitude.trim()) errors.push('decision_magnitude_required')
  if (!oracle.decisionFocus.trim()) errors.push('decision_focus_required')
  if (!oracle.strongestSupportedView.trim()) errors.push('supported_view_required')
  if (!oracle.countercase.trim()) errors.push('countercase_required')
  if (!oracle.unresolved.length) errors.push('unresolved_required')
  if (!G21_ANSWER_SHAPES.includes(oracle.expectedAnswerShape)) {
    errors.push('expected_answer_shape_invalid')
  }
  if (!oracle.answerWouldChange.trim()) errors.push('answer_effect_required')
  if (oracle.answerContract.unknownAllowed !== true) errors.push('unknown_answer_must_be_allowed')
  if (oracle.answerContract.optionalNoteAllowed !== true) {
    errors.push('optional_note_must_be_allowed')
  }
  if (!oracle.answerContract.evidenceRequestIfUnknown.trim()) {
    errors.push('unknown_evidence_request_required')
  }
  if (!Array.isArray(oracle.answerContract.routeEffects) || !oracle.answerContract.routeEffects.length) {
    errors.push('route_effect_required')
  } else {
    const routeAnswers = oracle.answerContract.routeEffects.map((effect) => effect.answer)
    if (new Set(routeAnswers).size !== routeAnswers.length) {
      errors.push('route_effect_answers_must_be_unique')
    }
    for (const effect of oracle.answerContract.routeEffects) {
      if (!hasExactFields(effect, G21_ROUTE_EFFECT_FIELDS)) {
        errors.push('route_effect_fields_invalid')
        continue
      }
      if (!effect.answer.trim()) errors.push('route_effect_answer_required')
      if (!G21_ROUTE_EFFECT_TYPES.includes(effect.effect)) errors.push('route_effect_type_invalid')
      if (!effect.routeChange.trim()) errors.push('route_effect_change_required')
    }
    if (
      (oracle.expectedAnswerShape === 'choice' || oracle.expectedAnswerShape === 'yes_no') &&
      !sameStringsInOrder(routeAnswers, oracle.answerContract.options)
    ) {
      errors.push('each_answer_option_requires_route_effect')
    }
    if (
      !['choice', 'yes_no'].includes(oracle.expectedAnswerShape) &&
      oracle.answerContract.routeEffects.length !== 1
    ) {
      errors.push('open_answer_requires_one_route_effect')
    }
  }
  if (!hasExactFields(oracle.answerContract.unknownRouteEffect, G21_UNKNOWN_ROUTE_EFFECT_FIELDS)) {
    errors.push('unknown_route_effect_fields_invalid')
  } else {
    if (!G21_ROUTE_EFFECT_TYPES.includes(oracle.answerContract.unknownRouteEffect.effect)) {
      errors.push('unknown_route_effect_type_invalid')
    }
    if (oracle.answerContract.unknownRouteEffect.effect === 'select') {
      errors.push('unknown_answer_cannot_select_route')
    }
    if (!oracle.answerContract.unknownRouteEffect.routeChange.trim()) {
      errors.push('unknown_route_effect_change_required')
    }
  }
  if (
    (oracle.expectedAnswerShape === 'choice' || oracle.expectedAnswerShape === 'yes_no') &&
    oracle.answerContract.options.length < 2
  ) {
    errors.push('bounded_answer_options_required')
  }
  if (
    oracle.expectedAnswerShape === 'threshold' &&
    (!oracle.answerContract.unit || !oracle.answerContract.comparator)
  ) {
    errors.push('threshold_unit_and_comparator_required')
  }
  if (!oracle.humanDecisionBoundary.trim()) errors.push('human_boundary_required')
  if (!oracle.expectedDiagnosticBehaviours.length) errors.push('expected_behaviour_required')
  if (!oracle.forbiddenClaims.length) errors.push('forbidden_claim_required')
  const questionMarks = [...oracle.routeChangingQuestion].filter((character) => character === '?').length
  const questionWords = oracle.routeChangingQuestion.trim().split(/\s+/).filter(Boolean).length
  if (questionMarks !== 1 || !oracle.routeChangingQuestion.trim().endsWith('?')) {
    errors.push('one_explicit_route_question_required')
  }
  if (questionWords > 24) errors.push('route_question_too_complex')
  if (ROUTE_QUESTION_JARGON.some((pattern) => pattern.test(oracle.routeChangingQuestion))) {
    errors.push('route_question_contains_specialist_jargon')
  }
  if (
    /\bfinal call\b/i.test(oracle.routeChangingQuestion) &&
    oracle.answerContract.options.some((option) => NON_HUMAN_FINAL_CALL_OPTION.test(option))
  ) {
    errors.push('material_final_call_requires_human_options')
  }

  const noticeIds = oracle.allowedNotices.map((notice) => notice.noticeId)
  if (!oracle.allowedNotices.length) errors.push('allowed_notice_required')
  if (new Set(noticeIds).size !== noticeIds.length) errors.push('notice_ids_must_be_unique')
  for (const notice of oracle.allowedNotices) {
    if (!hasExactFields(notice, G21_ALLOWED_NOTICE_FIELDS)) {
      errors.push(`${notice.noticeId}:notice_fields_invalid`)
    }
    if (!/^NOTICE-[A-Z0-9-]+$/.test(notice.noticeId)) {
      errors.push(`${notice.noticeId}:notice_id_invalid`)
    }
    if (!G21_INTERNAL_CLAIM_STANDINGS.includes(notice.standing)) {
      errors.push(`${notice.noticeId}:standing_invalid`)
    }
    if (!notice.text.trim()) errors.push(`${notice.noticeId}:text_required`)
    if (notice.standing === 'evidence_gap' && notice.evidenceIds.length > 0) {
      errors.push(`${notice.noticeId}:gap_cannot_cite_evidence`)
    }
    if (notice.standing !== 'evidence_gap' && notice.evidenceIds.length === 0) {
      errors.push(`${notice.noticeId}:evidence_required`)
    }
    for (const evidenceId of notice.evidenceIds) {
      if (!evidenceIds.includes(evidenceId)) errors.push(`${notice.noticeId}:unknown_${evidenceId}`)
    }
    const types = notice.evidenceIds.map((evidenceId) => resolveEvidenceType(profile, evidenceId))
    const locators = notice.evidenceIds.map((evidenceId) => {
      const external = profile.externalEvidence.find((source) => source.sourceId === evidenceId)
      if (external) return external.locator
      return profile.internalEvidence.find((record) => record.evidenceId === evidenceId)?.sourceLocator
    })
    if (
      notice.standing === 'direct_statement' &&
      types.some((sourceType) =>
        sourceType === undefined ||
        !BASIC_SOURCE_TYPES.includes(sourceType as G21InternalSourceType),
      )
    ) {
      errors.push(`${notice.noticeId}:direct_statement_requires_direct_source`)
    }
    if (
      notice.standing === 'synthetic_public_context' &&
      types.some((sourceType) => sourceType !== 'synthetic_external')
    ) {
      errors.push(`${notice.noticeId}:public_context_requires_external_fixture`)
    }
    if (
      notice.standing === 'work_observation' &&
      !types.some((sourceType) => sourceType && WORK_SOURCE_TYPES.includes(sourceType as G21InternalSourceType))
    ) {
      errors.push(`${notice.noticeId}:work_observation_requires_work_source`)
    }
    if (
      notice.standing === 'measured_result' &&
      !types.some((sourceType) => sourceType && MEASURED_SOURCE_TYPES.includes(sourceType as G21InternalSourceType))
    ) {
      errors.push(`${notice.noticeId}:measured_result_requires_measure`)
    }
    if (notice.standing === 'supported_pattern') {
      if (
        notice.evidenceIds.length < 2 ||
        new Set(notice.evidenceIds).size !== notice.evidenceIds.length ||
        locators.some((locator) => !locator) ||
        new Set(locators).size !== locators.length ||
        types.some(
          (sourceType) =>
            sourceType !== 'synthetic_external' &&
            sourceType !== 'direct_correction' &&
            !WORK_SOURCE_TYPES.includes(sourceType as G21InternalSourceType) &&
            !MEASURED_SOURCE_TYPES.includes(sourceType as G21InternalSourceType),
        )
      ) {
        errors.push(`${notice.noticeId}:pattern_requires_distinct_evidence`)
      }
    }
    if (
      notice.standing === 'authorised_correction' &&
      !types.includes('direct_correction')
    ) {
      errors.push(`${notice.noticeId}:correction_requires_direct_correction`)
    }
  }

  for (const runtimeState of RANGE_RUNTIME_STATES) {
    const lifecycle = profile.lifecycleOracle[runtimeState]
    if (!hasExactFields(lifecycle, G21_LIFECYCLE_ORACLE_FIELDS)) {
      errors.push(`${runtimeState}:lifecycle_oracle_fields_invalid`)
    }
    if (lifecycle.runtimeState !== runtimeState) errors.push(`${runtimeState}:state_mismatch`)
    if (!lifecycle.expectedNotices.length) errors.push(`${runtimeState}:expected_notice_required`)
    if (!lifecycle.forbiddenClaims.length) errors.push(`${runtimeState}:forbidden_claim_required`)
    for (const evidenceId of lifecycle.evidenceIdsAdded) {
      if (!lifecycleIds.includes(evidenceId)) errors.push(`${runtimeState}:unknown_${evidenceId}`)
    }
  }
  if (conflict && correction) {
    const expectedByState: Record<RangeRuntimeState, string[]> = {
      initial: [],
      contradicted: [conflict.evidenceId],
      corrected: [conflict.evidenceId, correction.evidenceId],
    }
    for (const runtimeState of RANGE_RUNTIME_STATES) {
      if (!sameStringsInOrder(profile.lifecycleOracle[runtimeState].evidenceIdsAdded, expectedByState[runtimeState])) {
        errors.push(`${runtimeState}:lifecycle_evidence_sequence_invalid`)
      }
    }
  }

  const frozenLifecycle = G21_FROZEN_LIFECYCLE_ORACLE_BY_PROFILE_ID.get(manifest.profileId)
  if (!frozenLifecycle || JSON.stringify(profile.lifecycleOracle) !== frozenLifecycle) {
    errors.push('lifecycle_oracle_does_not_match_frozen_contract')
  }
  const frozenLifecycleEvidence = G21_FROZEN_LIFECYCLE_EVIDENCE_BY_PROFILE_ID.get(
    manifest.profileId,
  )
  if (!frozenLifecycleEvidence || JSON.stringify(profile.lifecycleEvidence) !== frozenLifecycleEvidence) {
    errors.push('lifecycle_evidence_does_not_match_frozen_contract')
  }
  const frozenOracle = G21_FROZEN_ORACLE_BY_PROFILE_ID.get(manifest.profileId)
  if (!frozenOracle || JSON.stringify(profile.oracle) !== frozenOracle) {
    errors.push('oracle_does_not_match_frozen_contract')
  }
  const frozenClaimRelations = G21_FROZEN_CLAIM_RELATIONS_BY_PROFILE_ID.get(manifest.profileId)
  const currentClaimRelations = JSON.stringify(
    privateEvidence.flatMap((record) =>
      record.claims.map((claim) => ({
        claimId: claim.claimId,
        challengesClaimIds: claim.challengesClaimIds,
        supersedesClaimIds: claim.supersedesClaimIds,
      })),
    ),
  )
  if (!frozenClaimRelations || currentClaimRelations !== frozenClaimRelations) {
    errors.push('claim_relations_do_not_match_frozen_contract')
  }
  const frozenSubstrate = G21_FROZEN_SUBSTRATE_BY_PROFILE_ID.get(manifest.profileId)
  if (!frozenSubstrate || canonicalSubstrate(profile) !== frozenSubstrate) {
    errors.push('profile_substrate_does_not_match_frozen_contract')
  }

  return errors
}

function recordsAreNested(
  shallower: G21InternalEvidenceRecord[],
  deeper: G21InternalEvidenceRecord[],
): boolean {
  return shallower.every((record) =>
    deeper.some(
      (candidate) =>
        candidate.evidenceId === record.evidenceId && JSON.stringify(candidate) === JSON.stringify(record),
    ),
  )
}

export function validateG21InternalRangeCanary(
  profiles: G21InternalRangeProfile[],
): string[] {
  const errors: string[] = []
  const profileIds = profiles.map((profile) => profile.manifest.profileId)
  if (profiles.length !== EXTERNAL_EVIDENCE_DEPTHS.length * G21_NONZERO_INTERNAL_DEPTHS.length) {
    errors.push('internal_range_requires_twelve_profiles')
  }
  if (new Set(profileIds).size !== profileIds.length) errors.push('profile_ids_must_be_unique')

  for (const externalDepth of EXTERNAL_EVIDENCE_DEPTHS) {
    for (const internalDepth of G21_NONZERO_INTERNAL_DEPTHS) {
      const matches = profiles.filter(
        (profile) =>
          profile.manifest.externalDepth === externalDepth &&
          profile.manifest.internalDepth === internalDepth,
      )
      if (matches.length !== 1) errors.push(`requires_one_${externalDepth}_${internalDepth}`)
    }
  }

  for (const profile of profiles) {
    errors.push(
      ...validateG21InternalRangeProfile(profile).map(
        (error) => `${profile.manifest.profileId}:${error}`,
      ),
    )
  }

  const familyIds = new Set(profiles.map((profile) => profile.familyId))
  if (familyIds.size !== EXTERNAL_EVIDENCE_DEPTHS.length) errors.push('four_matched_families_required')
  for (const familyId of familyIds) {
    const family = profiles.filter((profile) => profile.familyId === familyId)
    if (family.length !== G21_NONZERO_INTERNAL_DEPTHS.length) {
      errors.push(`${familyId}:three_internal_depths_required`)
      continue
    }
    const basic = family.find((profile) => profile.manifest.internalDepth === 'basic_intake')
    const work = family.find((profile) => profile.manifest.internalDepth === 'work_evidence')
    const longitudinal = family.find(
      (profile) => profile.manifest.internalDepth === 'longitudinal_corrections',
    )
    if (!basic || !work || !longitudinal) continue
    if (
      JSON.stringify(basic.identity) !== JSON.stringify(work.identity) ||
      JSON.stringify(work.identity) !== JSON.stringify(longitudinal.identity)
    ) {
      errors.push(`${familyId}:identity_must_remain_fixed`)
    }
    if (
      JSON.stringify(basic.externalEvidence) !== JSON.stringify(work.externalEvidence) ||
      JSON.stringify(work.externalEvidence) !== JSON.stringify(longitudinal.externalEvidence)
    ) {
      errors.push(`${familyId}:external_envelope_must_remain_fixed`)
    }
    if (!recordsAreNested(basic.internalEvidence, work.internalEvidence)) {
      errors.push(`${familyId}:basic_evidence_must_nest_in_work_depth`)
    }
    if (!recordsAreNested(work.internalEvidence, longitudinal.internalEvidence)) {
      errors.push(`${familyId}:work_evidence_must_nest_in_longitudinal_depth`)
    }
  }

  return errors
}

export function validateG21CompleteCoordinateCoverage(
  internalProfiles: G21InternalRangeProfile[] = G21_INTERNAL_RANGE_CANARY,
): string[] {
  const errors: string[] = []
  const manifests = [
    ...G21_PUBLIC_ROW_CANARY.map((profile) => profile.manifest),
    ...internalProfiles.map((profile) => profile.manifest),
  ]
  if (manifests.length !== 16) errors.push('complete_range_requires_sixteen_profiles')
  for (const externalDepth of EXTERNAL_EVIDENCE_DEPTHS) {
    for (const internalDepth of INTERNAL_EVIDENCE_DEPTHS) {
      const matches = manifests.filter(
        (manifest) =>
          manifest.externalDepth === externalDepth && manifest.internalDepth === internalDepth,
      )
      if (matches.length !== 1) errors.push(`complete_range_requires_one_${externalDepth}_${internalDepth}`)
    }
  }
  return errors
}

export function buildG21InternalRangeCases(
  profiles: G21InternalRangeProfile[] = G21_INTERNAL_RANGE_CANARY,
): RangeCase[] {
  return profiles.flatMap((profile) =>
    RANGE_RUNTIME_STATES.map((runtimeState) => {
      const oracle = profile.lifecycleOracle[runtimeState]
      return {
        caseId: `${profile.manifest.profileId}-${runtimeState.toUpperCase()}`,
        profileId: profile.manifest.profileId,
        runtimeState,
        expectedNotices: [...oracle.expectedNotices],
        forbiddenClaims: [...oracle.forbiddenClaims],
      }
    }),
  )
}

function evidenceForRuntimeState(
  profile: G21InternalRangeProfile,
  runtimeState: RangeRuntimeState,
): G21InternalEvidenceRecord[] {
  const addedIds = profile.lifecycleOracle[runtimeState].evidenceIdsAdded
  return [
    ...structuredClone(profile.internalEvidence),
    ...structuredClone(
      profile.lifecycleEvidence.filter((record) => addedIds.includes(record.evidenceId)),
    ),
  ]
}

export function validateG21InternalBlindInput(
  candidate: unknown,
): string[] {
  const errors: string[] = []
  if (!hasExactFields(candidate, G21_INTERNAL_BLIND_INPUT_FIELDS)) {
    return ['blind_input_fields_invalid']
  }
  const raw = candidate as Record<string, unknown>
  if (raw.schemaVersion !== 'g21-internal-range-input:v4') {
    errors.push('blind_input_schema_invalid')
  }
  if (!nonemptyString(raw.runId)) errors.push('blind_input_run_id_required')
  if (!nonemptyString(raw.caseId)) errors.push('blind_input_case_id_required')
  if (!nonemptyString(raw.profileId)) errors.push('blind_input_profile_id_required')

  const runtimeState =
    typeof raw.runtimeState === 'string' &&
    (RANGE_RUNTIME_STATES as readonly string[]).includes(raw.runtimeState)
      ? raw.runtimeState as RangeRuntimeState
      : null
  if (!runtimeState) {
    errors.push('blind_input_runtime_state_invalid')
  }

  const externalDepth =
    typeof raw.externalDepth === 'string' &&
    (EXTERNAL_EVIDENCE_DEPTHS as readonly string[]).includes(raw.externalDepth)
      ? raw.externalDepth as ExternalEvidenceDepth
      : null
  if (!externalDepth) errors.push('blind_input_external_depth_invalid')
  const internalDepth =
    typeof raw.internalDepth === 'string' &&
    (G21_NONZERO_INTERNAL_DEPTHS as readonly string[]).includes(raw.internalDepth)
      ? raw.internalDepth as G21NonzeroInternalDepth
      : null
  if (!internalDepth) errors.push('blind_input_internal_depth_invalid')

  const identityErrors = validateFictionalIdentityShape(raw.subject)
  if (identityErrors.length > 0) {
    errors.push(...identityErrors.map((error) => `blind_input_subject_${error}`))
  } else {
    const subject = raw.subject as unknown as G21FictionalIdentity
    if (!subject.fictionalIdentityKey.startsWith('fictional-')) {
      errors.push('blind_input_fictional_identity_key_required')
    }
    if (!subject.organisationDescription.toLowerCase().includes('fictional')) {
      errors.push('blind_input_fictional_organisation_required')
    }
  }

  const coverageErrors = validateExternalCoverageShape(raw.externalCoverage)
  if (coverageErrors.length > 0) {
    errors.push(...coverageErrors.map((error) => `blind_input_coverage_${error}`))
  } else if (
    externalDepth &&
    !exactCoverage(
      raw.externalCoverage as unknown as PublicEvidenceCoverage,
      EXPECTED_EXTERNAL_COVERAGE[externalDepth],
    )
  ) {
    errors.push('blind_input_coverage_does_not_match_depth')
  }

  const evidenceAsOf = validIsoTimestamp(raw.evidenceAsOf) ? raw.evidenceAsOf : null
  if (!evidenceAsOf || evidenceAsOf !== G21_INTERNAL_RANGE_EVIDENCE_AS_OF) {
    errors.push('blind_input_clock_invalid')
  }

  let externalEvidence: G21SyntheticExternalEvidence[] | null = null
  if (!Array.isArray(raw.externalEvidence)) {
    errors.push('blind_input_external_evidence_array_required')
    errors.push('blind_input_external_evidence_fields_invalid')
  } else {
    const shapeErrors = raw.externalEvidence.flatMap((source, index) =>
      validateExternalEvidenceShape(source).map(
        (error) => `blind_input_external_${index}_${error}`,
      ),
    )
    errors.push(...shapeErrors)
    if (shapeErrors.length > 0) errors.push('blind_input_external_evidence_fields_invalid')
    if (shapeErrors.length === 0) {
      externalEvidence = raw.externalEvidence as unknown as G21SyntheticExternalEvidence[]
      const sourceIds = externalEvidence.map((source) => source.sourceId)
      if (new Set(sourceIds).size !== sourceIds.length) {
        errors.push('blind_input_external_source_ids_must_be_unique')
      }
      for (const source of externalEvidence) {
        if (!G21_SYNTHETIC_EXTERNAL_SOURCE_TYPES.includes(source.sourceType)) {
          errors.push(`${source.sourceId}:blind_input_external_source_type_invalid`)
        }
        if (!source.locator.startsWith('https://') || !source.locator.includes('.invalid/')) {
          errors.push(`${source.sourceId}:blind_input_fictional_external_locator_required`)
        }
        if (!validIsoTimestamp(source.publishedOn)) {
          errors.push(`${source.sourceId}:blind_input_published_on_invalid`)
        }
        if (!validIsoTimestamp(source.retrievedOn)) {
          errors.push(`${source.sourceId}:blind_input_retrieved_on_invalid`)
        }
        if (
          validIsoTimestamp(source.publishedOn) &&
          validIsoTimestamp(source.retrievedOn) &&
          Date.parse(source.publishedOn) > Date.parse(source.retrievedOn)
        ) {
          errors.push(`${source.sourceId}:blind_input_published_after_retrieval`)
        }
        if (
          evidenceAsOf &&
          validIsoTimestamp(source.publishedOn) &&
          Date.parse(source.publishedOn) > Date.parse(evidenceAsOf)
        ) {
          errors.push(`${source.sourceId}:blind_input_published_after_as_of`)
        }
        if (
          evidenceAsOf &&
          validIsoTimestamp(source.retrievedOn) &&
          Date.parse(source.retrievedOn) > Date.parse(evidenceAsOf)
        ) {
          errors.push(`${source.sourceId}:blind_input_retrieved_after_as_of`)
        }
        if (source.syntheticDisclosure !== SYNTHETIC_EXTERNAL_DISCLOSURE) {
          errors.push(`${source.sourceId}:blind_input_external_disclosure_invalid`)
        }
      }
    }
  }

  let internalEvidence: G21InternalEvidenceRecord[] | null = null
  if (!Array.isArray(raw.internalEvidence)) {
    errors.push('blind_input_internal_evidence_array_required')
    errors.push('blind_input_internal_evidence_fields_invalid')
  } else {
    const shapeErrors = raw.internalEvidence.flatMap((record, index) =>
      validateInternalEvidenceShape(record).map(
        (error) => `blind_input_internal_${index}_${error}`,
      ),
    )
    errors.push(...shapeErrors)
    if (shapeErrors.length > 0) errors.push('blind_input_internal_evidence_fields_invalid')
    if (shapeErrors.length === 0) {
      internalEvidence = raw.internalEvidence as unknown as G21InternalEvidenceRecord[]
      for (const record of internalEvidence) {
        errors.push(
          ...validateInternalRecord(record, internalEvidence, evidenceAsOf ?? '').map(
            (error) => `${record.evidenceId}:${error}`,
          ),
        )
      }
      const evidenceIds = internalEvidence.map((record) => record.evidenceId)
      if (new Set(evidenceIds).size !== evidenceIds.length) {
        errors.push('blind_input_evidence_ids_must_be_unique')
      }
      const claimIds = internalEvidence.flatMap((record) =>
        record.claims.map((claim) => claim.claimId),
      )
      if (new Set(claimIds).size !== claimIds.length) {
        errors.push('blind_input_claim_ids_must_be_unique')
      }
      const supersededIds = internalEvidence.flatMap((record) =>
        record.claims.flatMap((claim) => claim.supersedesClaimIds),
      )
      if (new Set(supersededIds).size !== supersededIds.length) {
        errors.push('blind_input_claim_cannot_be_superseded_twice')
      }
    }
  }

  let audienceAuthorities: G21InternalAudienceAuthority[] | null = null
  if (!Array.isArray(raw.audienceAuthorities)) {
    errors.push('blind_input_audience_authority_array_required')
    errors.push('blind_input_audience_authority_fields_invalid')
  } else {
    const shapeErrors = raw.audienceAuthorities.flatMap((authority, index) =>
      validateAudienceAuthorityShape(authority).map(
        (error) => `blind_input_authority_${index}_${error}`,
      ),
    )
    errors.push(...shapeErrors)
    if (shapeErrors.length > 0) errors.push('blind_input_audience_authority_fields_invalid')
    if (shapeErrors.length === 0) {
      audienceAuthorities = raw.audienceAuthorities as unknown as G21InternalAudienceAuthority[]
    }
  }

  let currentClaims: G21ResolvedInternalClaim[] | null = null
  if (!Array.isArray(raw.currentClaims)) {
    errors.push('blind_input_current_claim_array_required')
    errors.push('blind_input_current_claim_fields_invalid')
  } else {
    const shapeErrors = raw.currentClaims.flatMap((claim, index) =>
      validateResolvedClaimShape(claim).map(
        (error) => `blind_input_current_claim_${index}_${error}`,
      ),
    )
    errors.push(...shapeErrors)
    if (shapeErrors.length > 0) errors.push('blind_input_current_claim_fields_invalid')
    if (shapeErrors.length === 0) {
      currentClaims = raw.currentClaims as unknown as G21ResolvedInternalClaim[]
      for (const claim of currentClaims) {
        if (!['current', 'disputed', 'superseded'].includes(claim.status)) {
          errors.push(`${claim.claimId}:blind_input_current_claim_status_invalid`)
        }
      }
    }
  }

  if (raw.task !== G21_INTERNAL_R1_TASK) errors.push('blind_input_task_invalid')
  const inputAuthority = isRecord(raw.authority) ? raw.authority : null
  if (
    !inputAuthority ||
    !hasExactFields(inputAuthority, G21_INPUT_AUTHORITY_FIELDS) ||
    inputAuthority.responsibilityGate !== 1 ||
    inputAuthority.mayFrameDecision !== true ||
    inputAuthority.mayRecommendConsequentialAction !== false ||
    inputAuthority.mayPromoteDurableTruth !== false ||
    inputAuthority.mayEvaluateNamedEmployees !== false
  ) {
    errors.push('blind_input_authority_invalid')
  }

  if (internalEvidence && currentClaims) {
    if (
      JSON.stringify(currentClaims) !==
      JSON.stringify(buildG21CurrentClaimView(internalEvidence))
    ) {
      errors.push('blind_input_current_claims_not_derived')
    }
  }

  if (internalEvidence && audienceAuthorities) {
    const includedIds = internalEvidence.map((record) => record.evidenceId)
    if (
      !sameStringSet(
        audienceAuthorities.map((authority) => authority.evidenceId),
        includedIds,
      )
    ) {
      errors.push('blind_input_authorities_do_not_cover_evidence')
    }
    for (const record of internalEvidence) {
      const authority = audienceAuthorities.find(
        (candidateAuthority) => candidateAuthority.evidenceId === record.evidenceId,
      )
      if (
        !authority ||
        authority.authorityId !== `AUTH-${record.evidenceId}` ||
        authority.authorityType !== 'synthetic_fixture_authoring' ||
        authority.authorisedAudience !== record.audience ||
        authority.authorisedAt !== record.recordedAt
      ) {
        errors.push(`${record.evidenceId}:blind_input_audience_not_authorised`)
      }
    }
  }

  const binding = nonemptyString(raw.profileId)
    ? G21_TRUSTED_RUNTIME_BINDING_BY_PROFILE_ID.get(raw.profileId)
    : undefined
  if (!binding) {
    errors.push('blind_input_unknown_trusted_profile')
  } else {
    if (identityErrors.length === 0 && JSON.stringify(raw.subject) !== binding.subject) {
      errors.push('blind_input_subject_mismatch')
    }
    if (externalDepth !== binding.externalDepth) errors.push('blind_input_external_depth_mismatch')
    if (internalDepth !== binding.internalDepth) errors.push('blind_input_internal_depth_mismatch')
    if (coverageErrors.length === 0 && JSON.stringify(raw.externalCoverage) !== binding.externalCoverage) {
      errors.push('blind_input_external_coverage_mismatch')
    }
    if (externalEvidence && trustedExternalBinding(externalEvidence) !== binding.externalEvidence) {
      errors.push('blind_input_external_evidence_binding_mismatch')
    }
    if (
      internalEvidence &&
      runtimeState &&
      trustedEvidenceBinding(internalEvidence) !== binding.evidenceByState[runtimeState]
    ) {
      errors.push('blind_input_internal_evidence_binding_mismatch')
    }
    const candidateStrings = collectStringValues(candidate)
    if (
      binding.forbiddenOracleValues.some((oracleValue) =>
        candidateStrings.some((candidateValue) => candidateValue.includes(oracleValue)),
      )
    ) {
      errors.push('blind_input_oracle_value_detected')
    }
  }
  if (
    nonemptyString(raw.profileId) &&
    runtimeState &&
    raw.caseId !== `${raw.profileId}-${runtimeState.toUpperCase()}`
  ) {
    errors.push('blind_input_case_id_mismatch')
  }

  return errors
}

export function validateG21CanonicalInternalBlindInput(
  candidate: unknown,
  expectedProfile: G21InternalRangeProfile | null | undefined,
): string[] {
  const errors = validateG21InternalBlindInput(candidate)
  if (!expectedProfile) return [...errors, 'canonical_profile_required']
  const profileErrors = validateG21InternalRangeProfile(expectedProfile)
  if (profileErrors.length > 0) {
    return [
      ...errors,
      ...profileErrors.map((error) => `canonical_profile_invalid_${error}`),
    ]
  }
  if (errors.length > 0) return errors
  if (!hasExactFields(candidate, G21_INTERNAL_BLIND_INPUT_FIELDS)) return errors
  const input = candidate as unknown as G21InternalBlindInput
  if (input.profileId !== expectedProfile.manifest.profileId) {
    errors.push('canonical_profile_id_mismatch')
  }
  if (!RANGE_RUNTIME_STATES.includes(input.runtimeState)) return errors
  if (JSON.stringify(input.subject) !== JSON.stringify(expectedProfile.identity)) {
    errors.push('canonical_subject_bytes_mismatch')
  }
  if (JSON.stringify(input.externalCoverage) !== JSON.stringify(expectedProfile.externalCoverage)) {
    errors.push('canonical_external_coverage_bytes_mismatch')
  }
  if (JSON.stringify(input.externalEvidence) !== JSON.stringify(expectedProfile.externalEvidence)) {
    errors.push('canonical_external_evidence_bytes_mismatch')
  }
  const expectedEvidence = evidenceForRuntimeState(expectedProfile, input.runtimeState)
  if (JSON.stringify(input.internalEvidence) !== JSON.stringify(expectedEvidence)) {
    errors.push('canonical_internal_evidence_bytes_mismatch')
  }
  return errors
}

export function buildG21InternalBlindInputs(
  runId = 'G21-INTERNAL-RANGE-RUN-004',
  profiles: G21InternalRangeProfile[] = G21_INTERNAL_RANGE_CANARY,
): G21InternalBlindInput[] {
  const profileErrors = validateG21InternalRangeCanary(profiles)
  if (profileErrors.length > 0) {
    throw new Error(`G21 internal range refused invalid profiles: ${profileErrors.join(', ')}`)
  }
  const inputs = profiles.flatMap((profile) =>
    RANGE_RUNTIME_STATES.map((runtimeState) => {
      const internalEvidence = evidenceForRuntimeState(profile, runtimeState)
      const includedEvidenceIds = internalEvidence.map((record) => record.evidenceId)
      return {
        schemaVersion: 'g21-internal-range-input:v4' as const,
        runId,
        caseId: `${profile.manifest.profileId}-${runtimeState.toUpperCase()}`,
        profileId: profile.manifest.profileId,
        runtimeState,
        subject: structuredClone(profile.identity),
        externalDepth: profile.manifest.externalDepth,
        internalDepth: profile.manifest.internalDepth as G21NonzeroInternalDepth,
        evidenceAsOf: profile.evidenceAsOf,
        externalCoverage: structuredClone(profile.externalCoverage),
        externalEvidence: structuredClone(profile.externalEvidence),
        internalEvidence,
        audienceAuthorities: structuredClone(
          profile.audienceAuthorities.filter((authority) =>
            includedEvidenceIds.includes(authority.evidenceId),
          ),
        ),
        currentClaims: buildG21CurrentClaimView(internalEvidence),
        task: G21_INTERNAL_R1_TASK,
        authority: { ...G21_INTERNAL_R1_AUTHORITY },
      }
    }),
  )
  for (const input of inputs) {
    const profile = profiles.find((candidateProfile) =>
      candidateProfile.manifest.profileId === input.profileId
    )
    const inputErrors = validateG21CanonicalInternalBlindInput(input, profile)
    if (inputErrors.length > 0) {
      throw new Error(`G21 internal range refused invalid input ${input.caseId}: ${inputErrors.join(', ')}`)
    }
  }
  return inputs
}

export const G21_INTERNAL_RANGE_CASES = buildG21InternalRangeCases()

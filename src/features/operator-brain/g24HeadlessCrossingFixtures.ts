import {
  G24_MINIMUM_CONTROL_KEYS,
  fingerprintG24ControlGraph,
  fingerprintG24Watermarks,
  type G24ControlReference,
  type G24ControlRegistry,
  type G24PendingReleaseProjection,
  type G24ReleaseAuthority,
  type G24RouteCandidate,
  type G24SelectorInput,
  type G24SelectorRoute,
} from './g24HeadlessCrossing'

export const G24_FIXTURE_NOW = '2026-09-12T12:00:00.000Z'
export const G24_FIXTURE_EXPIRY = '2027-09-12T12:00:00.000Z'

function control(key: string, dependencies: string[] = []): G24ControlReference {
  return {
    key,
    lineageId: `lineage:${key}`,
    version: `${key}:v1`,
    state: 'current',
    dependencies,
    validFrom: '2026-09-01T00:00:00.000Z',
    validUntil: G24_FIXTURE_EXPIRY,
  }
}

export function buildG24FixtureControls(): G24ControlRegistry {
  const controls = Object.fromEntries(
    G24_MINIMUM_CONTROL_KEYS.map((key) => [key, control(key)]),
  ) as G24ControlRegistry

  controls.source_permission_grant = control('source_permission_grant')
  controls.assertion_policy_version = control('assertion_policy_version')
  controls.canonical_source_versions.dependencies = ['source_permission_grant']
  controls.canonical_assertion_versions.dependencies = ['assertion_policy_version']
  controls.independent_challenger_result_version.dependencies = [
    'decision_requirement_version',
    'evidence_coverage_version',
    'trusted_cutoff',
    'epistemic_policy_version',
  ]

  controls.unrelated_lineage_version = {
    ...control('unrelated_lineage_version'),
    lineageId: 'lineage:another-customer-decision',
  }
  return controls
}

export const G24_FIXTURE_CONTROL_ROOTS = [...G24_MINIMUM_CONTROL_KEYS]

export const G24_CROSSING_HIDDEN_ORACLE: Array<{
  fixtureKey: string
  expectedRoute: G24SelectorRoute
  competentSameEvidenceBaselineRoute: G24SelectorRoute
}> = [
  {
    fixtureKey: 'highExternalLowInternal',
    expectedRoute: 'enrich',
    competentSameEvidenceBaselineRoute: 'enrich',
  },
  {
    fixtureKey: 'lowExternalHighInternal',
    expectedRoute: 'reuse',
    competentSameEvidenceBaselineRoute: 'reuse',
  },
  {
    fixtureKey: 'highExternalHighInternal',
    expectedRoute: 'ask',
    competentSameEvidenceBaselineRoute: 'ask',
  },
  {
    fixtureKey: 'lowExternalLowInternal',
    expectedRoute: 'session',
    competentSameEvidenceBaselineRoute: 'session',
  },
  {
    fixtureKey: 'quiet',
    expectedRoute: 'abstain_hold',
    competentSameEvidenceBaselineRoute: 'abstain_hold',
  },
  {
    fixtureKey: 'noEligibleRoute',
    expectedRoute: 'abstain_hold',
    competentSameEvidenceBaselineRoute: 'abstain_hold',
  },
  {
    fixtureKey: 'laterDecisionTransfer',
    expectedRoute: 'reuse',
    competentSameEvidenceBaselineRoute: 'reuse',
  },
  {
    fixtureKey: 'laterDecisionBlocked',
    expectedRoute: 'abstain_hold',
    competentSameEvidenceBaselineRoute: 'abstain_hold',
  },
]

function routeCandidate(
  route: G24RouteCandidate['route'],
  burden: number,
  eligible: boolean,
): G24RouteCandidate {
  return {
    route,
    burden,
    permitted: eligible,
    capable: eligible,
    resolvesGap: eligible,
    withinDeadline: eligible,
    withinBudget: eligible,
    fresh: eligible,
    audienceCompatible: eligible,
    provenanceIndependent: eligible,
    useSpecificSufficient: eligible,
    counterevidenceTreated: eligible,
    reuseOrigin: 'same_case',
    originCaseRef: 'case:maya:decision-014',
    reuseEvidenceRef: 'evidence:maya:decision-014:v1',
    publicSourceRef: null,
    immutableContentVersion: null,
    immutableReference: true,
    containsPrivateReasoning: false,
    trustedEvaluationVersion: 'trusted-evaluation:v1',
    rejectionReasons: [],
  }
}

function baseSelectorInput(version: string): G24SelectorInput {
  const controls = buildG24FixtureControls()
  const applicableControlKeys = Object.keys(controls)
    .filter((key) => key !== 'unrelated_lineage_version')
    .sort()
  const controlGraphFingerprint = fingerprintG24ControlGraph(applicableControlKeys, controls)
  return {
    selectorResultVersion: version,
    currentCaseRef: 'case:maya:decision-014',
    evidenceNamespace: 'customer:maya/private/case:decision-014',
    purposeRef: 'Resolve the quality-standard transfer gap.',
    audienceRef: 'named_leader_private',
    sensitivityRef: 'private',
    acceptedDecisionFrameRef: 'decision-frame:ai-marketing-operating-model:v3',
    decisionRequirementRef: 'decision-requirement:proof-before-rebuild:v2',
    evidenceCoverageRef: 'coverage:decision-014:v4',
    trustedAsOf: G24_FIXTURE_NOW,
    decisionConsequence: 'consequential',
    controlRootKeys: [...G24_FIXTURE_CONTROL_ROOTS],
    controlManifest: {
      manifestVersion: 'control-manifest:v1',
      applicableControlKeys,
      graphFingerprint: controlGraphFingerprint,
    },
    controls,
    evidenceState: 'gap',
    unresolvedEvidenceRefs: ['gap:customer-quality-result'],
    expectedMaterialEffect:
      'Distinguish a bounded proof of the new operating model from an immediate division rebuild.',
    trustedEvaluation: {
      evaluationVersion: 'trusted-evaluation:v1',
      decisionRequirementVersion: 'decision_requirement_version:v1',
      evidenceCoverageVersion: 'evidence_coverage_version:v1',
      trustedCutoffVersion: 'trusted_cutoff:v1',
      epistemicPolicyVersion: 'epistemic_policy_version:v1',
      independentChallengerResultVersion: 'independent_challenger_result_version:v1',
      controlManifestVersion: 'control-manifest:v1',
      controlGraphFingerprint,
      trustedAsOf: G24_FIXTURE_NOW,
    },
    challengerResult: 'none_found_within_declared_boundary',
    challengerSearchBoundary: 'Current decision sources through the trusted cutoff.',
    candidates: [],
  }
}

export function buildG24CrossingSelectorFixtures(): Record<string, G24SelectorInput> {
  const highExternalLowInternal = baseSelectorInput('selector:high-external-low-internal:v1')
  highExternalLowInternal.candidates = [
    routeCandidate('enrich', 1, true),
    routeCandidate('ask', 3, true),
    routeCandidate('session', 8, true),
  ]

  const lowExternalHighInternal = baseSelectorInput('selector:low-external-high-internal:v1')
  lowExternalHighInternal.evidenceState = 'sufficient'
  lowExternalHighInternal.unresolvedEvidenceRefs = []
  lowExternalHighInternal.candidates = [routeCandidate('reuse', 0, true)]

  const highExternalHighInternal = baseSelectorInput('selector:high-external-high-internal:v1')
  highExternalHighInternal.evidenceState = 'ambiguity'
  highExternalHighInternal.unresolvedEvidenceRefs = ['ambiguity:quality-standard-transfer']
  highExternalHighInternal.candidates = [
    routeCandidate('enrich', 1, false),
    routeCandidate('ask', 2, true),
    routeCandidate('session', 7, true),
  ]

  const lowExternalLowInternal = baseSelectorInput('selector:low-external-low-internal:v1')
  lowExternalLowInternal.purposeRef = 'Resolve the incentive and quality-standard conflict.'
  lowExternalLowInternal.evidenceState = 'contradiction'
  lowExternalLowInternal.unresolvedEvidenceRefs = [
    'contradiction:tool-capability-versus-behaviour-change',
    'gap:current-incentive-mechanism',
  ]
  lowExternalLowInternal.candidates = [
    routeCandidate('enrich', 2, false),
    routeCandidate('ask', 3, false),
    routeCandidate('session', 5, true),
  ]

  const quiet = baseSelectorInput('selector:quiet:v1')
  quiet.expectedMaterialEffect = ''
  quiet.candidates = [routeCandidate('ask', 1, true)]

  const noEligibleRoute = baseSelectorInput('selector:no-eligible-route:v1')
  noEligibleRoute.candidates = [
    routeCandidate('enrich', 1, false),
    routeCandidate('ask', 2, false),
    routeCandidate('session', 3, false),
  ]

  const laterDecisionTransfer = baseSelectorInput('selector:later-decision-transfer:v1')
  laterDecisionTransfer.acceptedDecisionFrameRef = 'decision-frame:ai-product-research:v1'
  laterDecisionTransfer.decisionRequirementRef = 'decision-requirement:transfer-quality-standard:v1'
  laterDecisionTransfer.evidenceCoverageRef = 'coverage:later-decision:v1'
  laterDecisionTransfer.evidenceState = 'sufficient'
  laterDecisionTransfer.unresolvedEvidenceRefs = []
  laterDecisionTransfer.expectedMaterialEffect =
    'Test whether the accepted quality standard transfers to a different AI-transition decision.'
  laterDecisionTransfer.candidates = [routeCandidate('reuse', 0, true)]

  const laterDecisionBlocked = baseSelectorInput('selector:later-decision-blocked:v1')
  laterDecisionBlocked.acceptedDecisionFrameRef = 'decision-frame:ai-product-research:v1'
  laterDecisionBlocked.decisionRequirementRef = 'decision-requirement:transfer-quality-standard:v1'
  laterDecisionBlocked.evidenceCoverageRef = 'coverage:later-decision:countercase:v2'
  laterDecisionBlocked.evidenceState = 'contradiction'
  laterDecisionBlocked.unresolvedEvidenceRefs = ['countercase:high-novelty-research:v1']
  laterDecisionBlocked.challengerResult = 'countercase_found'
  laterDecisionBlocked.expectedMaterialEffect =
    'Prevent a prior quality standard from being transferred where a live countercase defeats it.'
  laterDecisionBlocked.candidates = [
    routeCandidate('enrich', 1, false),
    routeCandidate('ask', 2, false),
    routeCandidate('session', 3, false),
  ]

  return {
    highExternalLowInternal,
    lowExternalHighInternal,
    highExternalHighInternal,
    lowExternalLowInternal,
    quiet,
    noEligibleRoute,
    laterDecisionTransfer,
    laterDecisionBlocked,
  }
}

export function buildExactG24ReleaseAuthority(
  projection: G24PendingReleaseProjection,
  authorityVersion = 'release-authority:v1',
): G24ReleaseAuthority {
  return {
    authorityVersion,
    authorityControlVersion:
      projection.controllingWatermarks.find(({ key }) => key === 'authority_version')?.version ?? '',
    actor: 'named_leader',
    projectionVersion: projection.projectionVersion,
    projectionFingerprint: projection.projectionFingerprint,
    purpose: projection.purpose,
    audience: projection.audience,
    selectorResultVersions: [...projection.selectorResultVersions],
    selectorResultFingerprints: { ...projection.selectorResultFingerprints },
    controllingFingerprint: fingerprintG24Watermarks(projection.controllingWatermarks),
    includedCanonicalSourceVersions: [...projection.includedCanonicalSourceVersions],
    includedCanonicalBrainVersions: [...projection.includedCanonicalBrainVersions],
  }
}

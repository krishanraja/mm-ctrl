import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-internal-'))
const require = createRequire(import.meta.url)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function includesEvery(values, expected) {
  return expected.every((value) => values.includes(value))
}

function sameArray(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

try {
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
      join(root, 'src', 'features', 'operator-brain', 'rangeCouncilContract.ts'),
      join(root, 'src', 'features', 'operator-brain', 'g21PublicRowCanary.ts'),
      join(root, 'src', 'features', 'operator-brain', 'g21InternalRangeCanary.ts'),
      '--module',
      'commonjs',
      '--target',
      'ES2022',
      '--moduleResolution',
      'node',
      '--esModuleInterop',
      '--skipLibCheck',
      '--outDir',
      outputDirectory,
    ],
    { cwd: root, stdio: 'inherit' },
  )

  const contract = require(join(outputDirectory, 'g21InternalRangeCanary.js'))
  const profiles = contract.G21_INTERNAL_RANGE_CANARY
  const cases = contract.G21_INTERNAL_RANGE_CASES
  const inputs = contract.buildG21InternalBlindInputs()
  const profileErrors = contract.validateG21InternalRangeCanary(profiles)
  const coordinateErrors = contract.validateG21CompleteCoordinateCoverage()

  assert(profiles.length === 12, 'expected twelve internal-range profiles')
  assert(profileErrors.length === 0, `profile validation failed: ${profileErrors.join(', ')}`)
  assert(coordinateErrors.length === 0, `coordinate validation failed: ${coordinateErrors.join(', ')}`)
  assert(cases.length === 36, 'expected thirty-six internal lifecycle cases')
  assert(inputs.length === 36, 'expected thirty-six oracle-free inputs')
  for (const runtimeState of ['initial', 'contradicted', 'corrected']) {
    assert(
      inputs.filter((input) => input.runtimeState === runtimeState).length === 12,
      `expected twelve ${runtimeState} inputs`,
    )
  }
  assert(
    !inputs.some((input) => {
      const serialised = JSON.stringify(input)
      return (
        serialised.includes('strongestSupportedView') ||
        serialised.includes('expectedDiagnosticBehaviours') ||
        serialised.includes('forbiddenClaims')
      )
    }),
    'oracle leaked into blind input',
  )
  for (const profile of profiles) {
    const profileInputs = inputs.filter((input) => input.profileId === profile.manifest.profileId)
    const expectedAdded = {
      initial: [],
      contradicted: [profile.lifecycleEvidence[0].evidenceId],
      corrected: profile.lifecycleEvidence.map((record) => record.evidenceId),
    }
    for (const input of profileInputs) {
      const actualAdded = input.internalEvidence
        .slice(profile.internalEvidence.length)
        .map((record) => record.evidenceId)
      assert(
        sameArray(actualAdded, expectedAdded[input.runtimeState]),
        `${profile.manifest.profileId} emitted the wrong ${input.runtimeState} evidence sequence`,
      )
      assert(
        input.audienceAuthorities.length === input.internalEvidence.length,
        `${profile.manifest.profileId} lost audience authority in ${input.runtimeState}`,
      )
      assert(
        sameArray(input.currentClaims, contract.buildG21CurrentClaimView(input.internalEvidence)),
        `${profile.manifest.profileId} emitted a stale current-claim view`,
      )
    }
  }

  const realCostume = structuredClone(profiles[0])
  realCostume.manifest.realNamedPerson = true
  realCostume.manifest.consentRecordId = 'CONSENT-FICTIONAL-01'
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(realCostume), [
      'real_named_person_wrong_namespace',
      'synthetic_fixture_cannot_name_real_person',
      'synthetic_fixture_cannot_claim_consent',
      'internal_range_cannot_name_real_person',
      'fictional_fixture_cannot_claim_consent',
    ]),
    'real-person costume or fictional consent was not rejected',
  )

  const inflatedBasic = structuredClone(
    profiles.find((profile) => profile.manifest.internalDepth === 'basic_intake'),
  )
  inflatedBasic.internalEvidence[0].sourceType = 'work_artifact'
  assert(
    contract
      .validateG21InternalRangeProfile(inflatedBasic)
      .includes('basic_intake_may_only_use_intake_and_reflection'),
    'basic intake depth inflation was not rejected',
  )

  const weakPattern = structuredClone(
    profiles.find((profile) => profile.manifest.internalDepth === 'work_evidence'),
  )
  const patternNotice = weakPattern.oracle.allowedNotices.find(
    (notice) => notice.standing === 'supported_pattern',
  )
  patternNotice.evidenceIds = [patternNotice.evidenceIds[0]]
  assert(
    contract
      .validateG21InternalRangeProfile(weakPattern)
      .includes(`${patternNotice.noticeId}:pattern_requires_distinct_evidence`),
    'single-source pattern was not rejected',
  )

  const brokenLifecycle = structuredClone(profiles[0])
  brokenLifecycle.lifecycleEvidence[1].supersedesClaimIds = [
    brokenLifecycle.internalEvidence[0].claims[0].claimId,
  ]
  brokenLifecycle.lifecycleEvidence[1].recordedAt =
    brokenLifecycle.lifecycleEvidence[0].recordedAt
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(brokenLifecycle), [
      'lifecycle_correction_must_supersede_conflict',
      'lifecycle_correction_must_follow_conflict',
    ]),
    'broken lifecycle correction was not rejected',
  )

  const changedFamily = structuredClone(profiles)
  changedFamily[1].identity.role = 'Chief Product Officer'
  assert(
    contract
      .validateG21InternalRangeCanary(changedFamily)
      .includes(`${changedFamily[1].familyId}:identity_must_remain_fixed`),
    'matched-family identity drift was not rejected',
  )

  const futureInternal = structuredClone(profiles[0])
  futureInternal.internalEvidence[0].validAt = '2026-09-11T09:00:00.000Z'
  futureInternal.internalEvidence[0].recordedAt = '2026-09-11T09:01:00.000Z'
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(futureInternal), [
      `${futureInternal.internalEvidence[0].evidenceId}:valid_at_after_as_of`,
      `${futureInternal.internalEvidence[0].evidenceId}:recorded_at_after_as_of`,
    ]),
    'future internal evidence was not rejected',
  )

  const futureLifecycle = structuredClone(profiles[0])
  futureLifecycle.lifecycleEvidence[0].validAt = '2026-09-11T09:00:00.000Z'
  futureLifecycle.lifecycleEvidence[0].recordedAt = '2026-09-11T09:01:00.000Z'
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(futureLifecycle), [
      `${futureLifecycle.lifecycleEvidence[0].evidenceId}:valid_at_after_as_of`,
      `${futureLifecycle.lifecycleEvidence[0].evidenceId}:recorded_at_after_as_of`,
    ]),
    'future lifecycle evidence was not rejected',
  )

  const futureExternal = structuredClone(
    profiles.find((profile) => profile.externalEvidence.length > 0),
  )
  futureExternal.externalEvidence[0].publishedOn = '2026-09-11T09:00:00.000Z'
  futureExternal.externalEvidence[0].retrievedOn = '2026-09-11T09:01:00.000Z'
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(futureExternal), [
      `${futureExternal.externalEvidence[0].sourceId}:published_after_as_of`,
      `${futureExternal.externalEvidence[0].sourceId}:retrieved_after_as_of`,
    ]),
    'future external evidence was not rejected',
  )

  const widened = structuredClone(profiles[0])
  const leaderRecord = widened.internalEvidence.find(
    (record) => record.audience === 'leader_private',
  )
  leaderRecord.audience = 'company_private'
  assert(
    contract
      .validateG21InternalRangeProfile(widened)
      .includes(`AUTH-${leaderRecord.evidenceId}:audience_widening_without_authority`),
    'audience widening without authority was not rejected',
  )

  const publicAudience = structuredClone(profiles[0])
  publicAudience.internalEvidence[0].audience = 'public'
  assert(
    contract
      .validateG21InternalRangeProfile(publicAudience)
      .includes(`${publicAudience.internalEvidence[0].evidenceId}:audience_invalid`),
    'public audience on private evidence was not rejected',
  )

  const badSubject = structuredClone(profiles[0])
  badSubject.internalEvidence[0].subjectScope = 'workforce_guess'
  assert(
    contract
      .validateG21InternalRangeProfile(badSubject)
      .includes(`${badSubject.internalEvidence[0].evidenceId}:subject_scope_invalid`),
    'unknown subject scope was not rejected',
  )

  for (const profile of profiles.filter(
    (candidate) => candidate.manifest.internalDepth === 'longitudinal_corrections',
  )) {
    const correction = profile.internalEvidence.find(
      (record) => record.sourceType === 'direct_correction',
    )
    const targetClaimId = correction.supersedesClaimIds[0]
    const targetRecord = profile.internalEvidence.find((record) =>
      record.claims.some((claim) => claim.claimId === targetClaimId),
    )
    const view = contract.buildG21CurrentClaimView(profile.internalEvidence)
    assert(
      view.find((claim) => claim.claimId === targetClaimId)?.status === 'superseded',
      `${profile.familyId} did not retire the corrected claim`,
    )
    assert(
      targetRecord.claims
        .filter((claim) => claim.claimId !== targetClaimId)
        .every((claim) => view.find((item) => item.claimId === claim.claimId)?.status === 'current'),
      `${profile.familyId} retired an unaffected claim`,
    )
  }

  const legacy = structuredClone(
    profiles.find((profile) => profile.manifest.internalDepth === 'longitudinal_corrections'),
  )
  const legacyCorrection = legacy.internalEvidence.find(
    (record) => record.sourceType === 'direct_correction',
  )
  legacyCorrection.supersedesEvidenceId = legacy.internalEvidence[0].evidenceId
  delete legacyCorrection.supersedesClaimIds
  assert(
    contract
      .validateG21InternalRangeProfile(legacy)
      .includes(`${legacyCorrection.evidenceId}:record_level_supersession_forbidden`),
    'legacy whole-record supersession was not rejected',
  )

  const swappedState = structuredClone(profiles[0])
  swappedState.lifecycleOracle.contradicted.evidenceIdsAdded = [
    swappedState.lifecycleEvidence[1].evidenceId,
  ]
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(swappedState), [
      'contradicted:lifecycle_evidence_sequence_invalid',
      'lifecycle_oracle_does_not_match_frozen_contract',
    ]),
    'correction-for-conflict lifecycle swap was not rejected',
  )

  const unknownExternal = structuredClone(
    profiles.find((profile) => profile.externalEvidence.length > 0),
  )
  unknownExternal.externalEvidence[0].sourceType = 'anonymous_rumour'
  assert(
    contract
      .validateG21InternalRangeProfile(unknownExternal)
      .includes(`${unknownExternal.externalEvidence[0].sourceId}:source_type_invalid`),
    'unknown external source type was not rejected',
  )

  const wrongDirectStanding = structuredClone(
    profiles.find((profile) => profile.manifest.internalDepth === 'work_evidence'),
  )
  const directNotice = wrongDirectStanding.oracle.allowedNotices.find(
    (notice) => notice.standing === 'measured_result',
  )
  directNotice.standing = 'direct_statement'
  assert(
    contract
      .validateG21InternalRangeProfile(wrongDirectStanding)
      .includes(`${directNotice.noticeId}:direct_statement_requires_direct_source`),
    'direct statement backed only by measured evidence was not rejected',
  )

  const duplicateLocator = structuredClone(
    profiles.find((profile) => profile.externalEvidence.length >= 2),
  )
  duplicateLocator.manifest.publicSourceLocators[1] = duplicateLocator.manifest.publicSourceLocators[0]
  assert(
    contract
      .validateG21InternalRangeProfile(duplicateLocator)
      .includes('manifest_source_locators_must_match_fixture_envelope'),
    'duplicate locator hiding a missing source was not rejected',
  )

  const genericLifecycle = structuredClone(profiles[0])
  genericLifecycle.lifecycleOracle.contradicted.expectedNotices = [
    'Review the new information and decide what matters.',
  ]
  assert(
    contract
      .validateG21InternalRangeProfile(genericLifecycle)
      .includes('lifecycle_oracle_does_not_match_frozen_contract'),
    'generic lifecycle notice substitution was not rejected',
  )

  const collision = structuredClone(profiles[0])
  collision.lifecycleEvidence[0].evidenceId = collision.internalEvidence[0].evidenceId
  assert(
    contract
      .validateG21InternalRangeProfile(collision)
      .includes('private_evidence_ids_must_be_unique_across_lifecycle'),
    'base and lifecycle evidence ID collision was not rejected',
  )

  const selfContradiction = structuredClone(profiles[0])
  selfContradiction.lifecycleEvidence[0].contradictsEvidenceIds = [
    selfContradiction.lifecycleEvidence[0].evidenceId,
  ]
  assert(
    contract
      .validateG21InternalRangeProfile(selfContradiction)
      .includes(
        `${selfContradiction.lifecycleEvidence[0].evidenceId}:cannot_contradict_self_${selfContradiction.lifecycleEvidence[0].evidenceId}`,
      ),
    'self contradiction was not rejected',
  )

  const forwardContradiction = structuredClone(profiles[0])
  forwardContradiction.lifecycleEvidence[0].contradictsEvidenceIds = [
    forwardContradiction.lifecycleEvidence[1].evidenceId,
  ]
  assert(
    contract
      .validateG21InternalRangeProfile(forwardContradiction)
      .includes(
        `${forwardContradiction.lifecycleEvidence[0].evidenceId}:contradiction_must_follow_target_${forwardContradiction.lifecycleEvidence[1].evidenceId}`,
      ),
    'forward contradiction was not rejected',
  )

  const rejectedQuestions = [
    ['fictional-care-scheduling', 'work_evidence', 'Did the unsafe schedules come from bad referral data or the scheduling logic?'],
    ['fictional-care-scheduling', 'longitudinal_corrections', 'Do the same vulnerable clients keep the same carer when you stop reviewing exceptions?'],
    ['fictional-manufacturing-redesign', 'longitudinal_corrections', 'Which exceptions still change customer risk enough that a planner must own the final call?'],
    ['fictional-franchise-fan-intelligence', 'work_evidence', 'What should new viewers see first to raise ticket intent without exhausting core fans?'],
    ['fictional-franchise-fan-intelligence', 'longitudinal_corrections', 'How much must ticket intent rise in a fair comparison before you move GBP 18 million?'],
  ]
  for (const [familyId, internalDepth, question] of rejectedQuestions) {
    const candidate = structuredClone(
      profiles.find(
        (profile) =>
          profile.familyId === familyId && profile.manifest.internalDepth === internalDepth,
      ),
    )
    candidate.oracle.routeChangingQuestion = question
    assert(
      contract
        .validateG21InternalRangeProfile(candidate)
        .includes('route_question_contains_specialist_jargon'),
      `rejected question passed for ${familyId} ${internalDepth}`,
    )
  }

  console.log(
    JSON.stringify(
      {
        status: 'passed',
        profiles: profiles.length,
        families: new Set(profiles.map((profile) => profile.familyId)).size,
        cases: cases.length,
        inputs: inputs.length,
        states: {
          initial: inputs.filter((input) => input.runtimeState === 'initial').length,
          contradicted: inputs.filter((input) => input.runtimeState === 'contradicted').length,
          corrected: inputs.filter((input) => input.runtimeState === 'corrected').length,
        },
        oracleLeak: false,
        adversarialMutationsRejected: 25,
      },
      null,
      2,
    ),
  )
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}

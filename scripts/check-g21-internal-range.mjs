import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-internal-'))
const require = createRequire(import.meta.url)
let run3MutationsRejected = 0

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function includesEvery(values, expected) {
  return expected.every((value) => values.includes(value))
}

function sameArray(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function builderRefuses(contract, profiles) {
  try {
    contract.buildG21InternalBlindInputs('G21-INTERNAL-RANGE-RUN-003-MUTATION', profiles)
    return false
  } catch {
    return true
  }
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
      assert(
        contract.validateG21InternalBlindInput(input, profile).length === 0,
        `${profile.manifest.profileId} emitted an invalid ${input.runtimeState} input`,
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
  const brokenLifecycleCorrectionClaim = brokenLifecycle.lifecycleEvidence[1].claims.find(
    (claim) => claim.supersedesClaimIds.length > 0,
  )
  brokenLifecycleCorrectionClaim.supersedesClaimIds = [
    brokenLifecycle.internalEvidence[0].claims[0].claimId,
  ]
  brokenLifecycle.lifecycleEvidence[1].recordedAt =
    brokenLifecycle.lifecycleEvidence[0].recordedAt
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(brokenLifecycle), [
      'lifecycle_correction_must_supersede_conflict',
      'lifecycle_correction_must_follow_conflict',
      'claim_relations_do_not_match_frozen_contract',
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
    const correctionClaim = correction.claims.find((claim) => claim.supersedesClaimIds.length > 0)
    const targetClaimId = correctionClaim.supersedesClaimIds[0]
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

  const forgeCorrected = inputs.find(
    (input) => input.profileId === 'RANGE-INTERNAL-FORGE-I2' && input.runtimeState === 'corrected',
  )
  const forgeObservation = forgeCorrected.currentClaims.find(
    (claim) => claim.claimId === 'LIFE-FORGE-I2-CONFLICT-CLAIM-01',
  )
  const forgeInference = forgeCorrected.currentClaims.find(
    (claim) => claim.claimId === 'LIFE-FORGE-I2-CONFLICT-CLAIM-02',
  )
  assert(
    forgeObservation?.status === 'current' &&
      forgeObservation.evidenceId === 'LIFE-FORGE-I2-CONFLICT' &&
      forgeObservation.sourceLocator === 'fixture://forge/lifecycle/work/conflict' &&
      forgeObservation.audience === 'company_private',
    'Forge confidence observation did not survive correction with provenance',
  )
  assert(forgeInference?.status === 'superseded', 'Forge unwillingness inference survived correction')

  const storyCorrected = inputs.find(
    (input) => input.profileId === 'RANGE-INTERNAL-STORY-I3' && input.runtimeState === 'corrected',
  )
  const storyAssociation = storyCorrected.currentClaims.find(
    (claim) => claim.claimId === 'LIFE-STORY-I3-CONFLICT-CLAIM-01',
  )
  const storyCausation = storyCorrected.currentClaims.find(
    (claim) => claim.claimId === 'LIFE-STORY-I3-CONFLICT-CLAIM-02',
  )
  assert(
    storyAssociation?.status === 'current' &&
      storyAssociation.evidenceId === 'LIFE-STORY-I3-CONFLICT' &&
      storyAssociation.sourceLocator === 'fixture://story/lifecycle/longitudinal/conflict' &&
      storyAssociation.audience === 'company_private',
    'Story association did not survive correction with provenance',
  )
  assert(storyCausation?.status === 'superseded', 'Story causal inference survived correction')

  const legacy = structuredClone(
    profiles.find((profile) => profile.manifest.internalDepth === 'longitudinal_corrections'),
  )
  const legacyCorrection = legacy.internalEvidence.find(
    (record) => record.sourceType === 'direct_correction',
  )
  legacyCorrection.supersedesEvidenceId = legacy.internalEvidence[0].evidenceId
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
  const selfChallengeClaim = selfContradiction.lifecycleEvidence[0].claims[0]
  selfChallengeClaim.challengesClaimIds = [
    selfChallengeClaim.claimId,
  ]
  assert(
    contract
      .validateG21InternalRangeProfile(selfContradiction)
      .includes(
        `${selfContradiction.lifecycleEvidence[0].evidenceId}:cannot_challenge_self_${selfChallengeClaim.claimId}`,
      ),
    'self contradiction was not rejected',
  )

  const forwardContradiction = structuredClone(profiles[0])
  const forwardChallengeClaim = forwardContradiction.lifecycleEvidence[0].claims[0]
  const futureClaimId = forwardContradiction.lifecycleEvidence[1].claims[0].claimId
  forwardChallengeClaim.challengesClaimIds = [
    futureClaimId,
  ]
  assert(
    contract
      .validateG21InternalRangeProfile(forwardContradiction)
      .includes(
        `${forwardContradiction.lifecycleEvidence[0].evidenceId}:challenge_must_follow_target_${futureClaimId}`,
      ),
    'forward contradiction was not rejected',
  )

  const futureAsOf = structuredClone(profiles[0])
  futureAsOf.evidenceAsOf = '2030-01-01T00:00:00.000Z'
  futureAsOf.internalEvidence[0].validAt = '2029-01-01T09:00:00.000Z'
  futureAsOf.internalEvidence[0].recordedAt = '2029-01-01T09:01:00.000Z'
  assert(
    contract
      .validateG21InternalRangeProfile(futureAsOf)
      .includes('evidence_as_of_must_match_frozen_clock'),
    'profile-controlled future clock was not rejected',
  )
  run3MutationsRejected += 1

  const sharedPatternSource = structuredClone(
    profiles.find((profile) =>
      profile.oracle.allowedNotices.some((notice) => notice.standing === 'supported_pattern'),
    ),
  )
  const sharedPattern = sharedPatternSource.oracle.allowedNotices.find(
    (notice) => notice.standing === 'supported_pattern',
  )
  const [firstPatternId, secondPatternId] = sharedPattern.evidenceIds
  const firstPatternRecord = sharedPatternSource.internalEvidence.find(
    (record) => record.evidenceId === firstPatternId,
  )
  const secondPatternRecord = sharedPatternSource.internalEvidence.find(
    (record) => record.evidenceId === secondPatternId,
  )
  secondPatternRecord.sourceLocator = firstPatternRecord.sourceLocator
  assert(
    contract
      .validateG21InternalRangeProfile(sharedPatternSource)
      .includes(`${sharedPattern.noticeId}:pattern_requires_distinct_evidence`),
    'one source identity masquerading as a pattern was not rejected',
  )
  run3MutationsRejected += 1

  const incapableSource = structuredClone(
    profiles.find((profile) => profile.manifest.profileId === 'RANGE-INTERNAL-FORGE-I2'),
  )
  incapableSource.lifecycleEvidence[0].sourceType = 'customer_evidence'
  assert(
    contract
      .validateG21InternalRangeProfile(incapableSource)
      .includes(`${incapableSource.lifecycleEvidence[0].evidenceId}:source_subject_incompatible`),
    'source type incompatible with staff evidence was not rejected',
  )
  run3MutationsRejected += 1

  const unsupportedCausation = structuredClone(
    profiles.find((profile) => profile.manifest.profileId === 'RANGE-INTERNAL-CARE-I2'),
  )
  unsupportedCausation.oracle.allowedNotices[0].text =
    'The scheduling logic caused two unsafe journeys.'
  assert(
    contract
      .validateG21InternalRangeProfile(unsupportedCausation)
      .includes('oracle_does_not_match_frozen_contract'),
    'unsupported causal notice was not rejected by the sealed fixture',
  )
  run3MutationsRejected += 1

  const misdirectedCorrection = structuredClone(
    profiles.find((profile) => profile.manifest.profileId === 'RANGE-INTERNAL-CARE-I3'),
  )
  const misdirectedClaim = misdirectedCorrection.internalEvidence
    .find((record) => record.evidenceId === 'INT-CARE-008')
    .claims.find((claim) => claim.supersedesClaimIds.length > 0)
  misdirectedClaim.supersedesClaimIds = ['INT-CARE-002-CLAIM-03']
  assert(
    contract
      .validateG21InternalRangeProfile(misdirectedCorrection)
      .includes('claim_relations_do_not_match_frozen_contract'),
    'misdirected correction was not rejected by the claim contract',
  )
  run3MutationsRejected += 1

  const identityRealPerson = structuredClone(profiles[0])
  identityRealPerson.identity.realNamedPerson = true
  assert(
    contract
      .validateG21InternalRangeProfile(identityRealPerson)
      .includes('identity_fields_invalid'),
    'unknown real-person identity field was not rejected',
  )
  run3MutationsRejected += 1

  const identityConsent = structuredClone(profiles[0])
  identityConsent.identity.consentRecordId = 'CONSENT-FICTIONAL-01'
  assert(
    contract
      .validateG21InternalRangeProfile(identityConsent)
      .includes('identity_fields_invalid'),
    'unknown identity consent field was not rejected',
  )
  run3MutationsRejected += 1

  const evidenceConsent = structuredClone(profiles[0])
  evidenceConsent.internalEvidence[0].consentRecordId = 'CONSENT-FICTIONAL-01'
  assert(
    contract
      .validateG21InternalRangeProfile(evidenceConsent)
      .includes(`${evidenceConsent.internalEvidence[0].evidenceId}:evidence_fields_invalid`),
    'unknown private-evidence consent field was not rejected',
  )
  run3MutationsRejected += 1

  const negatedDisclosure = structuredClone(profiles[0])
  negatedDisclosure.manifest.syntheticDisclosure = 'This person is not fictional.'
  assert(
    contract
      .validateG21InternalRangeProfile(negatedDisclosure)
      .includes('fictional_disclosure_required'),
    'negated fictional disclosure was not rejected',
  )
  run3MutationsRejected += 1

  const swappedLifecycleContent = structuredClone(profiles[0])
  const swappedConflict = swappedLifecycleContent.lifecycleEvidence[0]
  const swappedCorrection = swappedLifecycleContent.lifecycleEvidence[1]
  ;[swappedConflict.content, swappedCorrection.content] = [
    swappedCorrection.content,
    swappedConflict.content,
  ]
  ;[swappedConflict.claims[0].text, swappedCorrection.claims[0].text] = [
    swappedCorrection.claims[0].text,
    swappedConflict.claims[0].text,
  ]
  assert(
    contract
      .validateG21InternalRangeProfile(swappedLifecycleContent)
      .includes('lifecycle_evidence_does_not_match_frozen_contract'),
    'conflict and correction content swap was not rejected',
  )
  run3MutationsRejected += 1

  for (const profile of profiles) {
    const genericQuestion = structuredClone(profile)
    genericQuestion.oracle.routeChangingQuestion = 'What should we discuss next?'
    assert(
      contract
        .validateG21InternalRangeProfile(genericQuestion)
        .includes('oracle_does_not_match_frozen_contract'),
      `generic route question passed for ${profile.manifest.profileId}`,
    )
    run3MutationsRejected += 1
  }

  const aiOwnedBoundary = structuredClone(profiles[0])
  aiOwnedBoundary.oracle.humanDecisionBoundary =
    'AI chooses the standard and final route. The leader approves its recommendation.'
  assert(
    contract
      .validateG21InternalRangeProfile(aiOwnedBoundary)
      .includes('oracle_does_not_match_frozen_contract'),
    'AI-owned decision boundary was not rejected',
  )
  run3MutationsRejected += 1

  const invalidPopulation = structuredClone(profiles)
  invalidPopulation[0].identity.realNamedPerson = true
  assert(
    builderRefuses(contract, invalidPopulation),
    'blind-input builder did not refuse an invalid profile population',
  )
  run3MutationsRejected += 1

  const blindInput = structuredClone(inputs[0])
  for (const [oracleField, value] of Object.entries(profiles[0].oracle)) {
    const leaked = structuredClone(blindInput)
    leaked[oracleField] = value
    assert(
      contract.validateG21InternalBlindInput(leaked, profiles[0]).includes('blind_input_fields_invalid'),
      `blind input accepted leaked oracle field ${oracleField}`,
    )
    run3MutationsRejected += 1
  }

  const agencyTask = structuredClone(blindInput)
  agencyTask.task = 'Recommend the rollout and identify which named employees should leave.'
  assert(
    contract
      .validateG21InternalBlindInput(agencyTask, profiles[0])
      .includes('blind_input_task_invalid'),
    'agency-invalid task was not rejected',
  )
  run3MutationsRejected += 1

  const widenedAuthority = structuredClone(blindInput)
  widenedAuthority.authority.mayRecommendConsequentialAction = true
  assert(
    contract
      .validateG21InternalBlindInput(widenedAuthority, profiles[0])
      .includes('blind_input_authority_invalid'),
    'agency-invalid authority was not rejected',
  )
  run3MutationsRejected += 1

  const malformedAuthorities = structuredClone(blindInput)
  malformedAuthorities.audienceAuthorities = 'private by default'
  assert(
    contract
      .validateG21InternalBlindInput(malformedAuthorities, profiles[0])
      .includes('blind_input_audience_authority_fields_invalid'),
    'malformed audience authorities were not rejected safely',
  )
  run3MutationsRejected += 1

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
        adversarialMutationsRejected: 25 + run3MutationsRejected,
      },
      null,
      2,
    ),
  )
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}

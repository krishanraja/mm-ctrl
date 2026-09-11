import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-internal-'))
const require = createRequire(import.meta.url)
let run4MutationsRejected = 0

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
    contract.buildG21InternalBlindInputs('G21-INTERNAL-RANGE-RUN-005-MUTATION', profiles)
    return false
  } catch {
    return true
  }
}

function collectStrings(value, seen = new WeakSet()) {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  if (seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item, seen))
  return Object.values(value).flatMap((item) => collectStrings(item, seen))
}

function validateWithoutThrow(contract, candidate) {
  try {
    return contract.validateG21InternalBlindInput(candidate)
  } catch {
    return null
  }
}

function deterministicMalformedJson(seed, depth = 0) {
  const mixed = (Math.imul(seed + depth + 1, 1664525) + 1013904223) >>> 0
  if (depth >= 3) {
    const leaves = [null, Boolean(mixed & 1), mixed, `value-${mixed}`]
    return leaves[mixed % leaves.length]
  }
  switch (mixed % 6) {
    case 0:
      return null
    case 1:
      return Boolean(mixed & 1)
    case 2:
      return mixed
    case 3:
      return `value-${mixed}`
    case 4:
      return Array.from(
        { length: (mixed % 4) + 1 },
        (_, index) => deterministicMalformedJson(mixed + index + 1, depth + 1),
      )
    default:
      return {
        [`field_${mixed % 11}`]: deterministicMalformedJson(mixed + 1, depth + 1),
        [`field_${(mixed + 3) % 11}`]: deterministicMalformedJson(mixed + 2, depth + 1),
      }
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
  assert(
    inputs.every((input) => input.schemaVersion === 'g21-internal-range-input:v5'),
    'expected only v5 blind-input envelopes',
  )
  assert(
    profiles.every((profile) =>
      profile.oracle.answerContract.routeEffects.length > 0 &&
      profile.oracle.answerContract.unknownRouteEffect.effect !== 'select'
    ),
    'every answer contract must carry explicit known and unknown route effects',
  )
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
    const oracleValues = collectStrings(profile.oracle).filter((value) => value.length >= 24)
    for (const input of inputs.filter((candidate) => candidate.profileId === profile.manifest.profileId)) {
      const inputValues = collectStrings(input)
      assert(
        !oracleValues.some((oracleValue) =>
          inputValues.some((inputValue) => inputValue.includes(oracleValue)),
        ),
        `${profile.manifest.profileId} leaked an oracle value into ${input.runtimeState}`,
      )
    }
  }
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
        contract.validateG21InternalBlindInput(input).length === 0 &&
          contract.validateG21CanonicalInternalBlindInput(input, profile).length === 0,
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
  run4MutationsRejected += 1

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
  run4MutationsRejected += 1

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
  run4MutationsRejected += 1

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
  run4MutationsRejected += 1

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
  run4MutationsRejected += 1

  const identityRealPerson = structuredClone(profiles[0])
  identityRealPerson.identity.realNamedPerson = true
  assert(
    contract
      .validateG21InternalRangeProfile(identityRealPerson)
      .includes('identity_fields_invalid'),
    'unknown real-person identity field was not rejected',
  )
  run4MutationsRejected += 1

  const identityConsent = structuredClone(profiles[0])
  identityConsent.identity.consentRecordId = 'CONSENT-FICTIONAL-01'
  assert(
    contract
      .validateG21InternalRangeProfile(identityConsent)
      .includes('identity_fields_invalid'),
    'unknown identity consent field was not rejected',
  )
  run4MutationsRejected += 1

  const evidenceConsent = structuredClone(profiles[0])
  evidenceConsent.internalEvidence[0].consentRecordId = 'CONSENT-FICTIONAL-01'
  assert(
    contract
      .validateG21InternalRangeProfile(evidenceConsent)
      .includes(`${evidenceConsent.internalEvidence[0].evidenceId}:evidence_fields_invalid`),
    'unknown private-evidence consent field was not rejected',
  )
  run4MutationsRejected += 1

  const negatedDisclosure = structuredClone(profiles[0])
  negatedDisclosure.manifest.syntheticDisclosure = 'This person is not fictional.'
  assert(
    contract
      .validateG21InternalRangeProfile(negatedDisclosure)
      .includes('fictional_disclosure_required'),
    'negated fictional disclosure was not rejected',
  )
  run4MutationsRejected += 1

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
  run4MutationsRejected += 1

  for (const profile of profiles) {
    const genericQuestion = structuredClone(profile)
    genericQuestion.oracle.routeChangingQuestion = 'What should we discuss next?'
    assert(
      contract
        .validateG21InternalRangeProfile(genericQuestion)
        .includes('oracle_does_not_match_frozen_contract'),
      `generic route question passed for ${profile.manifest.profileId}`,
    )
    run4MutationsRejected += 1
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
  run4MutationsRejected += 1

  const invalidPopulation = structuredClone(profiles)
  invalidPopulation[0].identity.realNamedPerson = true
  assert(
    builderRefuses(contract, invalidPopulation),
    'blind-input builder did not refuse an invalid profile population',
  )
  run4MutationsRejected += 1

  const blindInput = structuredClone(inputs[0])
  for (const [oracleField, value] of Object.entries(profiles[0].oracle)) {
    const leaked = structuredClone(blindInput)
    leaked[oracleField] = value
    assert(
      contract.validateG21InternalBlindInput(leaked).includes('blind_input_fields_invalid'),
      `blind input accepted leaked oracle field ${oracleField}`,
    )
    run4MutationsRejected += 1
  }

  const agencyTask = structuredClone(blindInput)
  agencyTask.task = 'Recommend the rollout and identify which named employees should leave.'
  assert(
    contract
      .validateG21InternalBlindInput(agencyTask)
      .includes('blind_input_task_invalid'),
    'agency-invalid task was not rejected',
  )
  run4MutationsRejected += 1

  const widenedAuthority = structuredClone(blindInput)
  widenedAuthority.authority.mayRecommendConsequentialAction = true
  assert(
    contract
      .validateG21InternalBlindInput(widenedAuthority)
      .includes('blind_input_authority_invalid'),
    'agency-invalid authority was not rejected',
  )
  run4MutationsRejected += 1

  const malformedAuthorities = structuredClone(blindInput)
  malformedAuthorities.audienceAuthorities = 'private by default'
  assert(
    contract
      .validateG21InternalBlindInput(malformedAuthorities)
      .includes('blind_input_audience_authority_fields_invalid'),
    'malformed audience authorities were not rejected safely',
  )
  run4MutationsRejected += 1

  const totalityBase = structuredClone(inputs[0])
  const totalityExternal = structuredClone(
    inputs.find((input) => input.externalEvidence.length > 0),
  )
  const totalityMutations = [
    ['schema version', totalityBase, (candidate) => { candidate.schemaVersion = null }],
    ['run ID', totalityBase, (candidate) => { candidate.runId = null }],
    ['case ID', totalityBase, (candidate) => { candidate.caseId = null }],
    ['profile ID', totalityBase, (candidate) => { candidate.profileId = null }],
    ['runtime state', totalityBase, (candidate) => { candidate.runtimeState = null }],
    ['subject object', totalityBase, (candidate) => { candidate.subject = null }],
    ['subject scalar', totalityBase, (candidate) => { candidate.subject.displayName = null }],
    ['external depth', totalityBase, (candidate) => { candidate.externalDepth = null }],
    ['internal depth', totalityBase, (candidate) => { candidate.internalDepth = null }],
    ['evidence clock', totalityBase, (candidate) => { candidate.evidenceAsOf = null }],
    ['coverage object', totalityBase, (candidate) => { candidate.externalCoverage = null }],
    ['coverage scalar', totalityBase, (candidate) => { candidate.externalCoverage.currentIdentity = null }],
    ['external evidence array', totalityBase, (candidate) => { candidate.externalEvidence = null }],
    ['external evidence scalar', totalityExternal, (candidate) => { candidate.externalEvidence[0].publishedOn = null }],
    ['external limitations', totalityExternal, (candidate) => { candidate.externalEvidence[0].limitations = 'none' }],
    ['internal evidence array', totalityBase, (candidate) => { candidate.internalEvidence = null }],
    ['internal evidence scalar', totalityBase, (candidate) => { candidate.internalEvidence[0].content = null }],
    ['internal claims array', totalityBase, (candidate) => { candidate.internalEvidence[0].claims = null }],
    ['claim scalar', totalityBase, (candidate) => { candidate.internalEvidence[0].claims[0].text = null }],
    ['claim relations', totalityBase, (candidate) => { candidate.internalEvidence[0].claims[0].challengesClaimIds = 'none' }],
    ['authority array', totalityBase, (candidate) => { candidate.audienceAuthorities = null }],
    ['authority scalar', totalityBase, (candidate) => { candidate.audienceAuthorities[0].authorityId = null }],
    ['current claims array', totalityBase, (candidate) => { candidate.currentClaims = null }],
    ['current claim scalar', totalityBase, (candidate) => { candidate.currentClaims[0].status = null }],
    ['current claim relations', totalityBase, (candidate) => { candidate.currentClaims[0].challengedByClaimIds = 'none' }],
    ['task', totalityBase, (candidate) => { candidate.task = null }],
    ['input authority object', totalityBase, (candidate) => { candidate.authority = null }],
    ['input authority scalar', totalityBase, (candidate) => { candidate.authority.mayFrameDecision = 'yes' }],
  ]
  for (const [label, seed, mutate] of totalityMutations) {
    const candidate = structuredClone(seed)
    mutate(candidate)
    const validation = validateWithoutThrow(contract, candidate)
    assert(Array.isArray(validation), `${label} mutation caused the validator to throw`)
    assert(validation.length > 0, `${label} mutation was not rejected`)
    run4MutationsRejected += 1
  }

  const sparseMutations = [
    ['external evidence', totalityExternal, (candidate) => { candidate.externalEvidence = new Array(1) }],
    ['external limitations', totalityExternal, (candidate) => { candidate.externalEvidence[0].limitations = new Array(1) }],
    ['internal evidence', totalityBase, (candidate) => { candidate.internalEvidence = new Array(1) }],
    ['internal claims', totalityBase, (candidate) => { candidate.internalEvidence[0].claims = new Array(1) }],
    ['claim relations', totalityBase, (candidate) => { candidate.internalEvidence[0].claims[0].challengesClaimIds = new Array(1) }],
    ['audience authorities', totalityBase, (candidate) => { candidate.audienceAuthorities = new Array(1) }],
    ['current claims', totalityBase, (candidate) => { candidate.currentClaims = new Array(1) }],
  ]
  for (const [label, seed, mutate] of sparseMutations) {
    const candidate = structuredClone(seed)
    mutate(candidate)
    const validation = validateWithoutThrow(contract, candidate)
    assert(Array.isArray(validation), `sparse ${label} caused the validator to throw`)
    assert(validation.length > 0, `sparse ${label} was not rejected`)
    run4MutationsRejected += 1
  }

  const malformedJsonSamples = 128
  for (let seed = 0; seed < malformedJsonSamples; seed += 1) {
    const validation = validateWithoutThrow(contract, deterministicMalformedJson(seed))
    assert(Array.isArray(validation), `malformed JSON sample ${seed} caused the validator to throw`)
    assert(validation.length > 0, `malformed JSON sample ${seed} was not rejected`)
    run4MutationsRejected += 1
  }

  const contractProfile = profiles[0]
  const contractInput = structuredClone(
    inputs.find(
      (input) =>
        input.profileId === contractProfile.manifest.profileId && input.runtimeState === 'initial',
    ),
  )
  assert(
    contract.validateG21InternalBlindInput(contractInput).length === 0,
    'valid runtime input failed the structural contract',
  )
  assert(
    contract.validateG21CanonicalInternalBlindInput(contractInput, contractProfile).length === 0,
    'valid frozen input failed the canonical contract',
  )
  assert(
    contract
      .validateG21CanonicalInternalBlindInput(contractInput, undefined)
      .includes('canonical_profile_required'),
    'canonical verification succeeded without its explicit trust anchor',
  )
  const safeNovelText = structuredClone(contractInput)
  safeNovelText.internalEvidence[0].content = contract.G21_TRUSTED_SAFE_NOVEL_VARIANT.content
  safeNovelText.internalEvidence[0].claims[0].text =
    contract.G21_TRUSTED_SAFE_NOVEL_VARIANT.claimText
  safeNovelText.internalEvidence[0].semanticReceipt.receiptId =
    contract.G21_TRUSTED_SAFE_NOVEL_VARIANT.receiptId
  safeNovelText.currentClaims = contract.buildG21CurrentClaimView(safeNovelText.internalEvidence)
  assert(
    contract.validateG21InternalBlindInput(safeNovelText).length === 0,
    'the structural contract incorrectly became exact fixture equality',
  )
  assert(
    contract
      .validateG21CanonicalInternalBlindInput(safeNovelText, contractProfile)
      .includes('canonical_internal_evidence_bytes_mismatch'),
    'the canonical verifier accepted novel evidence bytes',
  )
  run4MutationsRejected += 2

  const reorderedRecord = structuredClone(contractInput)
  reorderedRecord.internalEvidence[0] = Object.fromEntries(
    Object.entries(reorderedRecord.internalEvidence[0]).reverse(),
  )
  reorderedRecord.currentClaims = contract.buildG21CurrentClaimView(
    reorderedRecord.internalEvidence,
  )
  assert(
    contract.validateG21InternalBlindInput(reorderedRecord).length === 0,
    'semantic receipt incorrectly depended on object property order',
  )
  assert(
    contract
      .validateG21CanonicalInternalBlindInput(reorderedRecord, contractProfile)
      .includes('canonical_internal_evidence_bytes_mismatch'),
    'canonical fixture verification ignored property-order byte drift',
  )
  run4MutationsRejected += 2

  const untrustedNovelText = structuredClone(contractInput)
  untrustedNovelText.internalEvidence[0].content = 'A fictional but unissued intake sentence.'
  untrustedNovelText.internalEvidence[0].claims[0].text =
    'A fictional but unissued intake sentence.'
  untrustedNovelText.currentClaims = contract.buildG21CurrentClaimView(
    untrustedNovelText.internalEvidence,
  )
  assert(
    contract
      .validateG21InternalBlindInput(untrustedNovelText)
      .includes('INT-CARE-001:blind_input_semantic_receipt_binding_mismatch'),
    'unissued novel evidence inherited trusted semantic standing',
  )
  run4MutationsRejected += 1

  const relabelledState = structuredClone(
    inputs.find((input) => input.runtimeState === 'initial'),
  )
  relabelledState.runtimeState = 'corrected'
  relabelledState.caseId = `${relabelledState.profileId}-CORRECTED`
  assert(
    contract
      .validateG21InternalBlindInput(relabelledState)
      .includes('blind_input_internal_evidence_binding_mismatch'),
    'initial evidence relabelled as corrected was accepted',
  )
  run4MutationsRejected += 1

  const relabelledDepth = structuredClone(
    inputs.find(
      (input) => input.profileId === 'RANGE-INTERNAL-CARE-I1' && input.runtimeState === 'initial',
    ),
  )
  relabelledDepth.profileId = 'RANGE-INTERNAL-CARE-I3'
  relabelledDepth.internalDepth = 'longitudinal_corrections'
  relabelledDepth.caseId = 'RANGE-INTERNAL-CARE-I3-INITIAL'
  assert(
    contract
      .validateG21InternalBlindInput(relabelledDepth)
      .includes('blind_input_internal_evidence_binding_mismatch'),
    'basic intake relabelled as longitudinal evidence was accepted',
  )
  run4MutationsRejected += 1

  const futureExternalInput = structuredClone(
    inputs.find((input) => input.externalEvidence.length > 0),
  )
  futureExternalInput.externalEvidence[0].publishedOn = '2026-09-11T09:00:00.000Z'
  futureExternalInput.externalEvidence[0].retrievedOn = '2026-09-11T09:01:00.000Z'
  assert(
    includesEvery(contract.validateG21InternalBlindInput(futureExternalInput), [
      `${futureExternalInput.externalEvidence[0].sourceId}:blind_input_published_after_as_of`,
      `${futureExternalInput.externalEvidence[0].sourceId}:blind_input_retrieved_after_as_of`,
    ]),
    'future external evidence passed the runtime contract',
  )
  run4MutationsRejected += 1

  const counterfeitAuthority = structuredClone(contractInput)
  counterfeitAuthority.audienceAuthorities[0].authorityId = 'AUTH-COUNTERFEIT'
  counterfeitAuthority.audienceAuthorities[0].authorityType = 'self_asserted'
  counterfeitAuthority.audienceAuthorities[0].authorisedAt = '2026-01-01T00:00:00.000Z'
  assert(
    contract
      .validateG21InternalBlindInput(counterfeitAuthority)
      .includes(`${counterfeitAuthority.internalEvidence[0].evidenceId}:blind_input_audience_not_authorised`),
    'counterfeit authority metadata passed the runtime contract',
  )
  run4MutationsRejected += 1

  const realPersonCostume = structuredClone(contractInput)
  realPersonCostume.subject.fictionalIdentityKey = 'real-satya-nadella'
  realPersonCostume.subject.displayName = 'Satya Nadella'
  realPersonCostume.subject.organisation = 'Microsoft'
  assert(
    includesEvery(contract.validateG21InternalBlindInput(realPersonCostume), [
      'blind_input_fictional_identity_key_required',
      'blind_input_subject_mismatch',
    ]),
    'real-person costume passed the runtime contract',
  )
  run4MutationsRejected += 1

  const reversedLifecycle = structuredClone(
    inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-CARE-I1' && input.runtimeState === 'corrected',
    ),
  )
  const baseLength = profiles.find(
    (profile) => profile.manifest.profileId === reversedLifecycle.profileId,
  ).internalEvidence.length
  reversedLifecycle.internalEvidence = [
    ...reversedLifecycle.internalEvidence.slice(0, baseLength),
    ...reversedLifecycle.internalEvidence.slice(baseLength).reverse(),
  ]
  reversedLifecycle.currentClaims = contract.buildG21CurrentClaimView(reversedLifecycle.internalEvidence)
  assert(
    contract
      .validateG21InternalBlindInput(reversedLifecycle)
      .includes('blind_input_internal_evidence_binding_mismatch'),
    'reversed lifecycle evidence passed the runtime contract',
  )
  run4MutationsRejected += 1

  const causalObservation = structuredClone(
    inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-STORY-I3' && input.runtimeState === 'initial',
    ),
  )
  const storyOutcome = causalObservation.internalEvidence.find(
    (record) => record.evidenceId === 'INT-STORY-007',
  )
  storyOutcome.content = 'Theory-heavy exposure causes opening-weekend purchase across all fan groups.'
  storyOutcome.claims[0].text = storyOutcome.content
  causalObservation.currentClaims = contract.buildG21CurrentClaimView(causalObservation.internalEvidence)
  assert(
    contract
      .validateG21InternalBlindInput(causalObservation)
      .includes('INT-STORY-007:observational_claim_cannot_assert_causation_INT-STORY-007-CLAIM-01'),
    'categorical causal prose passed as an observation',
  )
  run4MutationsRejected += 1

  const causalParaphrase = structuredClone(
    inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-STORY-I3' && input.runtimeState === 'initial',
    ),
  )
  const causalParaphraseOutcome = causalParaphrase.internalEvidence.find(
    (record) => record.evidenceId === 'INT-STORY-007',
  )
  causalParaphraseOutcome.content =
    'Theory-heavy exposure drove opening-weekend purchase across all fan groups.'
  causalParaphraseOutcome.claims[0].text = causalParaphraseOutcome.content
  causalParaphrase.currentClaims = contract.buildG21CurrentClaimView(
    causalParaphrase.internalEvidence,
  )
  assert(
    contract
      .validateG21InternalBlindInput(causalParaphrase)
      .includes('INT-STORY-007:blind_input_semantic_receipt_binding_mismatch'),
    'unsupported causal paraphrase inherited observational standing',
  )
  run4MutationsRejected += 1

  const semanticPersonhood = structuredClone(contractInput)
  semanticPersonhood.internalEvidence[0].content =
    'Satya Nadella personally consented to this private evidence being used by the fictional fixture.'
  semanticPersonhood.internalEvidence[0].claims[0].text =
    semanticPersonhood.internalEvidence[0].content
  semanticPersonhood.currentClaims = contract.buildG21CurrentClaimView(
    semanticPersonhood.internalEvidence,
  )
  assert(
    contract
      .validateG21InternalBlindInput(semanticPersonhood)
      .includes('INT-CARE-001:blind_input_semantic_receipt_binding_mismatch'),
    'real-person or simulated-consent meaning inherited fictional authority',
  )
  run4MutationsRejected += 1

  const semanticLifecycleReversal = structuredClone(
    inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-CARE-I1' && input.runtimeState === 'corrected',
    ),
  )
  const semanticLifecycleBaseLength = profiles.find(
    (profile) => profile.manifest.profileId === semanticLifecycleReversal.profileId,
  ).internalEvidence.length
  const semanticConflict = semanticLifecycleReversal.internalEvidence[semanticLifecycleBaseLength]
  const semanticCorrection = semanticLifecycleReversal.internalEvidence[semanticLifecycleBaseLength + 1]
  ;[semanticConflict.content, semanticCorrection.content] = [
    semanticCorrection.content,
    semanticConflict.content,
  ]
  ;[semanticConflict.claims[0].text, semanticCorrection.claims[0].text] = [
    semanticCorrection.claims[0].text,
    semanticConflict.claims[0].text,
  ]
  ;[semanticConflict.semanticReceipt, semanticCorrection.semanticReceipt] = [
    semanticCorrection.semanticReceipt,
    semanticConflict.semanticReceipt,
  ]
  semanticLifecycleReversal.currentClaims = contract.buildG21CurrentClaimView(
    semanticLifecycleReversal.internalEvidence,
  )
  assert(
    contract
      .validateG21InternalBlindInput(semanticLifecycleReversal)
      .some((error) => error.endsWith('blind_input_semantic_receipt_binding_mismatch')),
    'reversed conflict and correction meaning inherited lifecycle standing',
  )
  run4MutationsRejected += 1

  const runtimeIncapableSource = structuredClone(
    inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-RESEARCH-I3' && input.runtimeState === 'initial',
    ),
  )
  const leaderChoice = runtimeIncapableSource.internalEvidence.find(
    (record) => record.evidenceId === 'INT-RESEARCH-009',
  )
  leaderChoice.sourceType = 'staff_evidence'
  leaderChoice.subjectScope = 'staff_group'
  leaderChoice.claims.forEach((claim) => { claim.subjectScope = 'staff_group' })
  runtimeIncapableSource.currentClaims = contract.buildG21CurrentClaimView(
    runtimeIncapableSource.internalEvidence,
  )
  assert(
    contract
      .validateG21InternalBlindInput(runtimeIncapableSource)
      .includes('INT-RESEARCH-009:blind_input_semantic_receipt_binding_mismatch'),
    'source relabelling retained false authority',
  )
  run4MutationsRejected += 1

  const runtimeMisdirectedCorrection = structuredClone(
    inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-CARE-I3' && input.runtimeState === 'initial',
    ),
  )
  const careCorrection = runtimeMisdirectedCorrection.internalEvidence.find(
    (record) => record.evidenceId === 'INT-CARE-008',
  )
  careCorrection.claims[0].supersedesClaimIds = ['INT-CARE-002-CLAIM-03']
  runtimeMisdirectedCorrection.currentClaims = contract.buildG21CurrentClaimView(
    runtimeMisdirectedCorrection.internalEvidence,
  )
  assert(
    contract
      .validateG21InternalBlindInput(runtimeMisdirectedCorrection)
      .includes('INT-CARE-008:blind_input_semantic_receipt_binding_mismatch'),
    'misdirected correction passed after recomputing the current view',
  )
  run4MutationsRejected += 1

  const oracleProfile = profiles.find(
    (profile) => profile.manifest.profileId === 'RANGE-INTERNAL-CARE-I1',
  )
  const oracleDrift = structuredClone(contractInput)
  oracleDrift.internalEvidence[0].content = oracleProfile.oracle.strongestSupportedView
  oracleDrift.internalEvidence[0].claims[0].text = oracleProfile.oracle.strongestSupportedView
  oracleDrift.currentClaims = contract.buildG21CurrentClaimView(oracleDrift.internalEvidence)
  assert(
    contract
      .validateG21InternalBlindInput(oracleDrift)
      .includes('blind_input_oracle_value_detected'),
    'oracle-bearing source drift passed the runtime contract',
  )
  const populationDrift = structuredClone(profiles)
  for (const profile of populationDrift.filter(
    (candidate) => candidate.familyId === 'fictional-care-scheduling',
  )) {
    profile.internalEvidence[0].content = oracleProfile.oracle.strongestSupportedView
    profile.internalEvidence[0].claims[0].text = oracleProfile.oracle.strongestSupportedView
  }
  assert(
    contract
      .validateG21InternalRangeCanary(populationDrift)
      .includes('RANGE-INTERNAL-CARE-I1:profile_substrate_does_not_match_frozen_contract'),
    'oracle-bearing canonical source drift was not rejected',
  )
  assert(builderRefuses(contract, populationDrift), 'builder emitted oracle-bearing source drift')
  run4MutationsRejected += 2

  const repairedQuestions = {
    'RANGE-INTERNAL-CARE-I3':
      'Out of every 100 vulnerable clients, how many must keep the same carer without you stepping in before expansion?',
    'RANGE-INTERNAL-RESEARCH-I2':
      'Have any clients used the monthly product without a senior researcher and said its challenge changed their decision?',
    'RANGE-INTERNAL-FORGE-I2':
      'Before you fund all six plants, must one plant get on-time delivery back to at least 91% with the same planners?',
    'RANGE-INTERNAL-FORGE-I3':
      'Which role should make the final call when an AI plan could make a customer late?',
    'RANGE-INTERNAL-STORY-I2':
      'Must ticket sales show which campaign wins new viewers without losing core-fan sales before the GBP 18 million moves?',
    'RANGE-INTERNAL-STORY-I3':
      'How many extra ticket buyers per 100 new viewers, versus today, would justify GBP 18 million if core-fan sales hold?',
  }
  for (const [profileId, question] of Object.entries(repairedQuestions)) {
    const profile = profiles.find((candidate) => candidate.manifest.profileId === profileId)
    assert(profile.oracle.routeChangingQuestion === question, `${profileId} question drifted`)
  }
  const forgeAgency = structuredClone(
    profiles.find((profile) => profile.manifest.profileId === 'RANGE-INTERNAL-FORGE-I3'),
  )
  forgeAgency.oracle.answerContract.options[0] = 'The system'
  forgeAgency.oracle.answerContract.routeEffects[0].answer = 'The system'
  assert(
    contract
      .validateG21InternalRangeProfile(forgeAgency)
      .includes('material_final_call_requires_human_options'),
    'non-human final-call option passed the profile contract',
  )
  const storyRoute = profiles.find(
    (profile) => profile.manifest.profileId === 'RANGE-INTERNAL-STORY-I2',
  )
  assert(
    sameArray(
      storyRoute.oracle.answerContract.routeEffects.map((effect) => effect.answer),
      storyRoute.oracle.answerContract.options,
    ) &&
      storyRoute.oracle.answerContract.routeEffects.every((effect) => effect.routeChange.length > 20),
    'STORY I2 does not map every answer to an explicit consequential route',
  )
  run4MutationsRejected += 2

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
        malformedJsonSamples,
        adversarialMutationsRejected: 25 + run4MutationsRejected,
      },
      null,
      2,
    ),
  )
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}

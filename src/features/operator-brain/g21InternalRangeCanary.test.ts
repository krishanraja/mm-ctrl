import { describe, expect, it } from 'vitest'
import { EXTERNAL_EVIDENCE_DEPTHS, RANGE_RUNTIME_STATES } from './rangeCouncilContract'
import {
  G21_ANSWER_SHAPES,
  G21_INTERNAL_AUDIENCES,
  G21_INTERNAL_R1_AUTHORITY,
  G21_INTERNAL_R1_TASK,
  G21_INTERNAL_RANGE_CANARY,
  G21_INTERNAL_RANGE_CASES,
  G21_INTERNAL_RANGE_EVIDENCE_AS_OF,
  G21_NONZERO_INTERNAL_DEPTHS,
  G21_TRUSTED_SAFE_NOVEL_VARIANT,
  buildG21CurrentClaimView,
  buildG21InternalBlindInputs,
  validateG21CanonicalInternalBlindInput,
  validateG21CompleteCoordinateCoverage,
  validateG21InternalRangeCanary,
  validateG21InternalBlindInput,
  validateG21InternalRangeProfile,
  type G21InternalRangeProfile,
} from './g21InternalRangeCanary'

describe('G21 internal evidence range canary', () => {
  it('freezes every remaining matrix coordinate exactly once', () => {
    expect(G21_INTERNAL_RANGE_CANARY).toHaveLength(12)
    expect(validateG21InternalRangeCanary(G21_INTERNAL_RANGE_CANARY)).toEqual([])
    expect(validateG21CompleteCoordinateCoverage()).toEqual([])

    for (const externalDepth of EXTERNAL_EVIDENCE_DEPTHS) {
      for (const internalDepth of G21_NONZERO_INTERNAL_DEPTHS) {
        expect(
          G21_INTERNAL_RANGE_CANARY.filter(
            (profile) =>
              profile.manifest.externalDepth === externalDepth &&
              profile.manifest.internalDepth === internalDepth,
          ),
        ).toHaveLength(1)
      }
    }
  })

  it('uses four matched fictional families so only internal evidence changes within a family', () => {
    const familyIds = new Set(G21_INTERNAL_RANGE_CANARY.map((profile) => profile.familyId))
    expect(familyIds.size).toBe(4)

    for (const familyId of familyIds) {
      const family = G21_INTERNAL_RANGE_CANARY.filter(
        (profile) => profile.familyId === familyId,
      )
      expect(family).toHaveLength(3)
      expect(new Set(family.map((profile) => JSON.stringify(profile.identity))).size).toBe(1)
      expect(
        new Set(family.map((profile) => JSON.stringify(profile.externalEvidence))).size,
      ).toBe(1)
      expect(family.map((profile) => profile.manifest.internalDepth)).toEqual(
        G21_NONZERO_INTERNAL_DEPTHS,
      )
      expect(family[0].internalEvidence.length).toBeLessThan(family[1].internalEvidence.length)
      expect(family[1].internalEvidence.length).toBeLessThan(family[2].internalEvidence.length)
    }
  })

  it('never dresses a real person in authored private evidence or claims fictional consent', () => {
    for (const profile of G21_INTERNAL_RANGE_CANARY) {
      expect(profile.manifest.namespace).toBe('synthetic_fixture')
      expect(profile.manifest.realNamedPerson).toBe(false)
      expect(profile.manifest.consentRecordId).toBeUndefined()
      expect(profile.manifest.displayLabel).toContain('fictional fixture')
      expect(profile.manifest.syntheticDisclosure?.toLowerCase()).toContain('fictional')
      expect(profile.identity.fictionalIdentityKey).toMatch(/^fictional-/)
      expect(profile.identity.organisationDescription.toLowerCase()).toContain('fictional')
      for (const source of profile.externalEvidence) {
        expect(source.locator).toContain('.invalid/')
        expect(source.syntheticDisclosure.toLowerCase()).toContain('fictional')
      }
    }
  })

  it('makes intake, work and longitudinal depth mean different kinds of evidence', () => {
    for (const familyId of new Set(G21_INTERNAL_RANGE_CANARY.map((profile) => profile.familyId))) {
      const family = G21_INTERNAL_RANGE_CANARY.filter(
        (profile) => profile.familyId === familyId,
      )
      const basic = family.find((profile) => profile.manifest.internalDepth === 'basic_intake')!
      const work = family.find((profile) => profile.manifest.internalDepth === 'work_evidence')!
      const longitudinal = family.find(
        (profile) => profile.manifest.internalDepth === 'longitudinal_corrections',
      )!

      expect(
        basic.internalEvidence.every((record) =>
          ['opening_intake', 'leader_reflection'].includes(record.sourceType),
        ),
      ).toBe(true)
      expect(
        work.internalEvidence.some((record) =>
          ['meeting_transcript', 'work_artifact', 'operating_metric', 'customer_evidence'].includes(
            record.sourceType,
          ),
        ),
      ).toBe(true)
      expect(work.internalEvidence.some((record) => record.sourceType === 'direct_correction')).toBe(
        false,
      )
      const corrections = longitudinal.internalEvidence.filter(
        (record) => record.sourceType === 'direct_correction',
      )
      expect(corrections.length).toBeGreaterThan(0)
      expect(
        corrections.every((record) =>
          record.claims.some((claim) => claim.supersedesClaimIds.length > 0),
        ),
      ).toBe(true)
    }
  })

  it('freezes a consequential decision, countercase, one plain question and human boundary per profile', () => {
    for (const profile of G21_INTERNAL_RANGE_CANARY) {
      expect(profile.oracle.decisionMagnitude).toMatch(/GBP \d/)
      expect(profile.oracle.decisionFocus.length).toBeGreaterThan(40)
      expect(profile.oracle.countercase.length).toBeGreaterThan(20)
      expect(profile.oracle.humanDecisionBoundary.length).toBeGreaterThan(20)
      expect(profile.oracle.routeChangingQuestion.match(/\?/g)).toHaveLength(1)
      expect(profile.oracle.routeChangingQuestion.trim().endsWith('?')).toBe(true)
      expect(profile.oracle.routeChangingQuestion.trim().split(/\s+/).length).toBeLessThanOrEqual(24)
      expect(G21_ANSWER_SHAPES).toContain(profile.oracle.expectedAnswerShape)
      expect(profile.oracle.answerContract.unknownAllowed).toBe(true)
      expect(profile.oracle.answerContract.optionalNoteAllowed).toBe(true)
      expect(profile.oracle.answerContract.evidenceRequestIfUnknown.length).toBeGreaterThan(20)
      expect(profile.oracle.answerContract.routeEffects.length).toBeGreaterThan(0)
      expect(profile.oracle.answerContract.unknownRouteEffect.effect).not.toBe('select')
      expect(profile.oracle.answerContract.unknownRouteEffect.routeChange.length).toBeGreaterThan(20)
      if (['choice', 'yes_no'].includes(profile.oracle.expectedAnswerShape)) {
        expect(profile.oracle.answerContract.options.length).toBeGreaterThanOrEqual(2)
        expect(
          profile.oracle.answerContract.routeEffects.map((effect) => effect.answer),
        ).toEqual(profile.oracle.answerContract.options)
      } else {
        expect(profile.oracle.answerContract.routeEffects).toHaveLength(1)
      }
      if (profile.oracle.expectedAnswerShape === 'threshold') {
        expect(profile.oracle.answerContract.unit).toBeTruthy()
        expect(profile.oracle.answerContract.comparator).toBeTruthy()
      }
      expect(profile.oracle.answerWouldChange.length).toBeGreaterThan(20)
      expect(profile.oracle.expectedDiagnosticBehaviours.length).toBeGreaterThanOrEqual(2)
      expect(profile.oracle.forbiddenClaims.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('creates 36 evidence-specific lifecycle cases without placeholder notices', () => {
    expect(G21_INTERNAL_RANGE_CASES).toHaveLength(36)
    expect(new Set(G21_INTERNAL_RANGE_CASES.map((rangeCase) => rangeCase.caseId)).size).toBe(36)
    for (const profile of G21_INTERNAL_RANGE_CANARY) {
      const cases = G21_INTERNAL_RANGE_CASES.filter(
        (rangeCase) => rangeCase.profileId === profile.manifest.profileId,
      )
      expect(cases.map((rangeCase) => rangeCase.runtimeState)).toEqual(RANGE_RUNTIME_STATES)
      for (const rangeCase of cases) {
        expect(rangeCase.expectedNotices.join(' ')).not.toContain(
          'Notice the evidence and lifecycle conditions',
        )
        expect(rangeCase.forbiddenClaims.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('builds 36 oracle-free inputs and adds conflict then correction evidence in order', () => {
    const inputs = buildG21InternalBlindInputs()
    expect(inputs).toHaveLength(36)
    expect(new Set(inputs.map((input) => input.caseId)).size).toBe(36)

    for (const profile of G21_INTERNAL_RANGE_CANARY) {
      const initial = inputs.find(
        (input) => input.profileId === profile.manifest.profileId && input.runtimeState === 'initial',
      )!
      const contradicted = inputs.find(
        (input) =>
          input.profileId === profile.manifest.profileId && input.runtimeState === 'contradicted',
      )!
      const corrected = inputs.find(
        (input) => input.profileId === profile.manifest.profileId && input.runtimeState === 'corrected',
      )!

      expect(initial.internalEvidence).toHaveLength(profile.internalEvidence.length)
      expect(contradicted.internalEvidence).toHaveLength(profile.internalEvidence.length + 1)
      expect(corrected.internalEvidence).toHaveLength(profile.internalEvidence.length + 2)
      expect(corrected.internalEvidence.at(-1)?.sourceType).toBe('direct_correction')
      expect(corrected.authority.mayRecommendConsequentialAction).toBe(false)
      expect(corrected.authority.mayPromoteDurableTruth).toBe(false)
      expect(corrected.evidenceAsOf).toBe(G21_INTERNAL_RANGE_EVIDENCE_AS_OF)
      expect(corrected.schemaVersion).toBe('g21-internal-range-input:v5')

      for (const input of [initial, contradicted, corrected]) {
        expect(validateG21InternalBlindInput(input)).toEqual([])
        expect(validateG21CanonicalInternalBlindInput(input, profile)).toEqual([])
        expect(input.task).toBe(G21_INTERNAL_R1_TASK)
        expect(input.authority).toEqual(G21_INTERNAL_R1_AUTHORITY)
        expect(input.audienceAuthorities).toHaveLength(input.internalEvidence.length)
        for (const record of input.internalEvidence) {
          const authority = input.audienceAuthorities.find(
            (candidate) => candidate.evidenceId === record.evidenceId,
          )
          expect(authority?.authorisedAudience).toBe(record.audience)
        }
      }

      const serialised = JSON.stringify(initial)
      expect(serialised).not.toContain('strongestSupportedView')
      expect(serialised).not.toContain('expectedDiagnosticBehaviours')
      expect(serialised).not.toContain('forbiddenClaims')
    }
  })

  it('rejects real-person costumes, realistic web domains and fake consent', () => {
    const realCostume = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    realCostume.manifest.realNamedPerson = true
    realCostume.manifest.consentRecordId = 'CONSENT-FICTIONAL-01'
    expect(validateG21InternalRangeProfile(realCostume)).toEqual(
      expect.arrayContaining([
        'real_named_person_wrong_namespace',
        'synthetic_fixture_cannot_name_real_person',
        'synthetic_fixture_cannot_claim_consent',
        'internal_range_cannot_name_real_person',
        'fictional_fixture_cannot_claim_consent',
      ]),
    )

    const webCostume = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find((profile) => profile.externalEvidence.length > 0)!,
    )
    webCostume.externalEvidence[0].locator = 'https://example.com/looks-real'
    webCostume.manifest.publicSourceLocators[0] = 'https://example.com/looks-real'
    expect(validateG21InternalRangeProfile(webCostume)).toContain(
      `${webCostume.externalEvidence[0].sourceId}:fictional_invalid_domain_required`,
    )

    const identityCostume = structuredClone(G21_INTERNAL_RANGE_CANARY[0]) as
      G21InternalRangeProfile & {
        identity: G21InternalRangeProfile['identity'] & {
          realNamedPerson?: boolean
          consentRecordId?: string
        }
      }
    identityCostume.identity.realNamedPerson = true
    expect(validateG21InternalRangeProfile(identityCostume)).toContain(
      'identity_fields_invalid',
    )
    delete identityCostume.identity.realNamedPerson
    identityCostume.identity.consentRecordId = 'CONSENT-FICTIONAL-01'
    expect(validateG21InternalRangeProfile(identityCostume)).toContain(
      'identity_fields_invalid',
    )

    const evidenceCostume = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    ;(
      evidenceCostume.internalEvidence[0] as typeof evidenceCostume.internalEvidence[number] & {
        consentRecordId?: string
      }
    ).consentRecordId = 'CONSENT-FICTIONAL-01'
    expect(validateG21InternalRangeProfile(evidenceCostume)).toContain(
      `${evidenceCostume.internalEvidence[0].evidenceId}:evidence_fields_invalid`,
    )

    const negatedDisclosure = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    negatedDisclosure.manifest.syntheticDisclosure = 'This person is not fictional.'
    expect(validateG21InternalRangeProfile(negatedDisclosure)).toContain(
      'fictional_disclosure_required',
    )
  })

  it('rejects depth inflation, broken supersession and weak pattern evidence', () => {
    const inflatedBasic = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.internalDepth === 'basic_intake',
      )!,
    )
    inflatedBasic.internalEvidence[0].sourceType = 'work_artifact'
    expect(validateG21InternalRangeProfile(inflatedBasic)).toContain(
      'basic_intake_may_only_use_intake_and_reflection',
    )

    const brokenLongitudinal = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.internalDepth === 'longitudinal_corrections',
      )!,
    )
    const directCorrection = brokenLongitudinal.internalEvidence.find(
      (record) => record.sourceType === 'direct_correction',
    )!
    directCorrection.claims.forEach((claim) => {
      claim.supersedesClaimIds = []
    })
    expect(validateG21InternalRangeProfile(brokenLongitudinal)).toContain(
      'longitudinal_correction_requires_supersession',
    )

    const weakPattern = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.internalDepth === 'work_evidence',
      )!,
    )
    const pattern = weakPattern.oracle.allowedNotices.find(
      (notice) => notice.standing === 'supported_pattern',
    )!
    pattern.evidenceIds = [pattern.evidenceIds[0]]
    expect(validateG21InternalRangeProfile(weakPattern)).toContain(
      `${pattern.noticeId}:pattern_requires_distinct_evidence`,
    )
  })

  it('rejects a family whose identity or source envelope changes as internal depth grows', () => {
    const changedIdentity = structuredClone(G21_INTERNAL_RANGE_CANARY)
    changedIdentity[1].identity.role = 'Chief Product Officer'
    expect(validateG21InternalRangeCanary(changedIdentity)).toContain(
      `${changedIdentity[1].familyId}:identity_must_remain_fixed`,
    )

    const changedEnvelope = structuredClone(G21_INTERNAL_RANGE_CANARY)
    changedEnvelope[1].externalEvidence.push({
      sourceId: 'EXT-EXTRA-001',
      locator: 'https://extra.fixtures.invalid/source',
      title: 'Extra fictional source',
      sourceType: 'company_identity',
      publishedOn: '2026-01-01T09:00:00.000Z',
      retrievedOn: '2026-09-10T09:00:00.000Z',
      summary: 'Fictional extra source.',
      limitations: ['Not part of the frozen envelope.'],
      syntheticDisclosure: 'Fictional source.',
    })
    changedEnvelope[1].manifest.publicSourceLocators.push(
      'https://extra.fixtures.invalid/source',
    )
    expect(validateG21InternalRangeCanary(changedEnvelope)).toContain(
      `${changedEnvelope[1].familyId}:external_envelope_must_remain_fixed`,
    )
  })

  it('rejects a lifecycle correction that does not follow and supersede the conflict', () => {
    const candidate = structuredClone(G21_INTERNAL_RANGE_CANARY[0]) as G21InternalRangeProfile
    const correctionClaim = candidate.lifecycleEvidence[1].claims.find(
      (claim) => claim.supersedesClaimIds.length > 0,
    )!
    correctionClaim.supersedesClaimIds = [
      candidate.internalEvidence[0].claims[0].claimId,
    ]
    candidate.lifecycleEvidence[1].recordedAt = candidate.lifecycleEvidence[0].recordedAt
    candidate.lifecycleEvidence[1].validAt = candidate.lifecycleEvidence[0].validAt
    expect(validateG21InternalRangeProfile(candidate)).toEqual(
      expect.arrayContaining([
        'lifecycle_correction_must_supersede_conflict',
        'lifecycle_correction_must_follow_conflict',
        'lifecycle_correction_valid_at_must_follow_conflict',
      ]),
    )
  })

  it('bounds every evidence clock by the frozen as-of time', () => {
    const futureInternal = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    futureInternal.internalEvidence[0].validAt = '2026-09-11T09:00:00.000Z'
    futureInternal.internalEvidence[0].recordedAt = '2026-09-11T09:01:00.000Z'
    expect(validateG21InternalRangeProfile(futureInternal)).toEqual(
      expect.arrayContaining([
        `${futureInternal.internalEvidence[0].evidenceId}:valid_at_after_as_of`,
        `${futureInternal.internalEvidence[0].evidenceId}:recorded_at_after_as_of`,
      ]),
    )

    const futureLifecycle = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    futureLifecycle.lifecycleEvidence[0].validAt = '2026-09-11T09:00:00.000Z'
    futureLifecycle.lifecycleEvidence[0].recordedAt = '2026-09-11T09:01:00.000Z'
    expect(validateG21InternalRangeProfile(futureLifecycle)).toEqual(
      expect.arrayContaining([
        `${futureLifecycle.lifecycleEvidence[0].evidenceId}:valid_at_after_as_of`,
        `${futureLifecycle.lifecycleEvidence[0].evidenceId}:recorded_at_after_as_of`,
      ]),
    )

    const futureExternal = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find((profile) => profile.externalEvidence.length > 0)!,
    )
    futureExternal.externalEvidence[0].publishedOn = '2026-09-11T09:00:00.000Z'
    futureExternal.externalEvidence[0].retrievedOn = '2026-09-11T09:01:00.000Z'
    expect(validateG21InternalRangeProfile(futureExternal)).toEqual(
      expect.arrayContaining([
        `${futureExternal.externalEvidence[0].sourceId}:published_after_as_of`,
        `${futureExternal.externalEvidence[0].sourceId}:retrieved_after_as_of`,
      ]),
    )
  })

  it('rejects audience widening, public private-evidence scope and unknown subjects', () => {
    const widened = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    const leaderRecord = widened.internalEvidence.find(
      (record) => record.audience === 'leader_private',
    )!
    leaderRecord.audience = 'company_private'
    expect(validateG21InternalRangeProfile(widened)).toContain(
      `AUTH-${leaderRecord.evidenceId}:audience_widening_without_authority`,
    )

    const publicAudience = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    publicAudience.internalEvidence[0].audience = 'public' as never
    expect(validateG21InternalRangeProfile(publicAudience)).toContain(
      `${publicAudience.internalEvidence[0].evidenceId}:audience_invalid`,
    )

    const badSubject = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    badSubject.internalEvidence[0].subjectScope = 'workforce_guess' as never
    expect(validateG21InternalRangeProfile(badSubject)).toContain(
      `${badSubject.internalEvidence[0].evidenceId}:subject_scope_invalid`,
    )
    expect(G21_INTERNAL_AUDIENCES).toEqual(['leader_private', 'company_private'])
  })

  it('retires only the corrected claim and keeps the source record in history', () => {
    const longitudinal = G21_INTERNAL_RANGE_CANARY.filter(
      (profile) => profile.manifest.internalDepth === 'longitudinal_corrections',
    )
    expect(longitudinal).toHaveLength(4)

    for (const profile of longitudinal) {
      const correction = profile.internalEvidence.find(
        (record) => record.sourceType === 'direct_correction',
      )!
      const correctionClaim = correction.claims.find(
        (claim) => claim.supersedesClaimIds.length > 0,
      )!
      const targetClaimId = correctionClaim.supersedesClaimIds[0]
      const targetRecord = profile.internalEvidence.find((record) =>
        record.claims.some((claim) => claim.claimId === targetClaimId),
      )!
      const view = buildG21CurrentClaimView(profile.internalEvidence)
      expect(view.find((claim) => claim.claimId === targetClaimId)).toMatchObject({
        status: 'superseded',
        supersededByClaimIds: [correctionClaim.claimId],
      })
      for (const unaffected of targetRecord.claims.filter(
        (claim) => claim.claimId !== targetClaimId,
      )) {
        expect(view.find((claim) => claim.claimId === unaffected.claimId)?.status).toBe('current')
      }
      expect(profile.internalEvidence).toContain(targetRecord)
    }

    const legacy = structuredClone(longitudinal[0])
    const legacyCorrection = legacy.internalEvidence.find(
      (record) => record.sourceType === 'direct_correction',
    )! as typeof legacy.internalEvidence[number] & { supersedesEvidenceId?: string }
    legacyCorrection.supersedesEvidenceId = legacy.internalEvidence[0].evidenceId
    expect(validateG21InternalRangeProfile(legacy)).toContain(
      `${legacyCorrection.evidenceId}:record_level_supersession_forbidden`,
    )
  })

  it('binds every lifecycle state to conflict then correction in exact order', () => {
    const swapped = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    swapped.lifecycleOracle.contradicted.evidenceIdsAdded = [
      swapped.lifecycleEvidence[1].evidenceId,
    ]
    expect(validateG21InternalRangeProfile(swapped)).toEqual(
      expect.arrayContaining([
        'contradicted:lifecycle_evidence_sequence_invalid',
        'lifecycle_oracle_does_not_match_frozen_contract',
      ]),
    )

    for (const profile of G21_INTERNAL_RANGE_CANARY) {
      const inputs = buildG21InternalBlindInputs().filter(
        (input) => input.profileId === profile.manifest.profileId,
      )
      const added = Object.fromEntries(
        inputs.map((input) => [
          input.runtimeState,
          input.internalEvidence
            .slice(profile.internalEvidence.length)
            .map((record) => record.evidenceId),
        ]),
      )
      expect(added).toEqual({
        initial: [],
        contradicted: [profile.lifecycleEvidence[0].evidenceId],
        corrected: profile.lifecycleEvidence.map((record) => record.evidenceId),
      })
      for (const input of inputs) {
        expect(input.currentClaims).toEqual(buildG21CurrentClaimView(input.internalEvidence))
      }
    }
  })

  it('rejects adjacent source, standing, locator and lifecycle shortcuts', () => {
    const unknownExternal = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find((profile) => profile.externalEvidence.length > 0)!,
    )
    unknownExternal.externalEvidence[0].sourceType = 'anonymous_rumour' as never
    expect(validateG21InternalRangeProfile(unknownExternal)).toContain(
      `${unknownExternal.externalEvidence[0].sourceId}:source_type_invalid`,
    )

    const wrongDirectStanding = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.internalDepth === 'work_evidence',
      )!,
    )
    const directNotice = wrongDirectStanding.oracle.allowedNotices.find(
      (notice) => notice.standing === 'measured_result',
    )!
    directNotice.standing = 'direct_statement'
    expect(validateG21InternalRangeProfile(wrongDirectStanding)).toContain(
      `${directNotice.noticeId}:direct_statement_requires_direct_source`,
    )

    const duplicateLocator = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find((profile) => profile.externalEvidence.length >= 2)!,
    )
    duplicateLocator.manifest.publicSourceLocators[1] =
      duplicateLocator.manifest.publicSourceLocators[0]
    expect(validateG21InternalRangeProfile(duplicateLocator)).toContain(
      'manifest_source_locators_must_match_fixture_envelope',
    )

    const genericLifecycle = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    genericLifecycle.lifecycleOracle.contradicted.expectedNotices = [
      'Review the new information and decide what matters.',
    ]
    expect(validateG21InternalRangeProfile(genericLifecycle)).toContain(
      'lifecycle_oracle_does_not_match_frozen_contract',
    )
  })

  it('rejects ID collisions plus self and forward contradiction links', () => {
    const collision = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    collision.lifecycleEvidence[0].evidenceId = collision.internalEvidence[0].evidenceId
    expect(validateG21InternalRangeProfile(collision)).toContain(
      'private_evidence_ids_must_be_unique_across_lifecycle',
    )

    const selfContradiction = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    const selfChallenge = selfContradiction.lifecycleEvidence[0].claims[0]
    selfChallenge.challengesClaimIds = [
      selfChallenge.claimId,
    ]
    expect(validateG21InternalRangeProfile(selfContradiction)).toContain(
      `${selfContradiction.lifecycleEvidence[0].evidenceId}:cannot_challenge_self_${selfChallenge.claimId}`,
    )

    const forwardContradiction = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    const forwardChallenge = forwardContradiction.lifecycleEvidence[0].claims[0]
    const futureClaimId = forwardContradiction.lifecycleEvidence[1].claims[0].claimId
    forwardChallenge.challengesClaimIds = [
      futureClaimId,
    ]
    expect(validateG21InternalRangeProfile(forwardContradiction)).toContain(
      `${forwardContradiction.lifecycleEvidence[0].evidenceId}:challenge_must_follow_target_${futureClaimId}`,
    )
  })

  it('keeps valid lifecycle observations when a correction retires only the inference', () => {
    const inputs = buildG21InternalBlindInputs()
    const forge = inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-FORGE-I2' && input.runtimeState === 'corrected',
    )!
    expect(
      forge.currentClaims.find(
        (claim) => claim.claimId === 'LIFE-FORGE-I2-CONFLICT-CLAIM-01',
      ),
    ).toMatchObject({
      status: 'current',
      evidenceId: 'LIFE-FORGE-I2-CONFLICT',
      sourceLocator: 'fixture://forge/lifecycle/work/conflict',
      audience: 'company_private',
    })
    expect(
      forge.currentClaims.find(
        (claim) => claim.claimId === 'LIFE-FORGE-I2-CONFLICT-CLAIM-02',
      )?.status,
    ).toBe('superseded')

    const story = inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-STORY-I3' && input.runtimeState === 'corrected',
    )!
    expect(
      story.currentClaims.find(
        (claim) => claim.claimId === 'LIFE-STORY-I3-CONFLICT-CLAIM-01',
      ),
    ).toMatchObject({
      status: 'current',
      evidenceId: 'LIFE-STORY-I3-CONFLICT',
      sourceLocator: 'fixture://story/lifecycle/longitudinal/conflict',
      audience: 'company_private',
    })
    expect(
      story.currentClaims.find(
        (claim) => claim.claimId === 'LIFE-STORY-I3-CONFLICT-CLAIM-02',
      )?.status,
    ).toBe('superseded')
  })

  it('rejects future clocks, shared sources, incapable provenance and misdirected correction', () => {
    const futureAsOf = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    futureAsOf.evidenceAsOf = '2030-01-01T00:00:00.000Z'
    futureAsOf.internalEvidence[0].validAt = '2029-01-01T09:00:00.000Z'
    futureAsOf.internalEvidence[0].recordedAt = '2029-01-01T09:01:00.000Z'
    expect(validateG21InternalRangeProfile(futureAsOf)).toContain(
      'evidence_as_of_must_match_frozen_clock',
    )

    const sharedSource = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find((profile) =>
        profile.oracle.allowedNotices.some((notice) => notice.standing === 'supported_pattern'),
      )!,
    )
    const pattern = sharedSource.oracle.allowedNotices.find(
      (notice) => notice.standing === 'supported_pattern',
    )!
    const [firstEvidenceId, secondEvidenceId] = pattern.evidenceIds
    const firstRecord = sharedSource.internalEvidence.find(
      (record) => record.evidenceId === firstEvidenceId,
    )!
    const secondRecord = sharedSource.internalEvidence.find(
      (record) => record.evidenceId === secondEvidenceId,
    )!
    secondRecord.sourceLocator = firstRecord.sourceLocator
    expect(validateG21InternalRangeProfile(sharedSource)).toContain(
      `${pattern.noticeId}:pattern_requires_distinct_evidence`,
    )

    const incapableSource = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.profileId === 'RANGE-INTERNAL-FORGE-I2',
      )!,
    )
    incapableSource.lifecycleEvidence[0].sourceType = 'customer_evidence'
    expect(validateG21InternalRangeProfile(incapableSource)).toContain(
      `${incapableSource.lifecycleEvidence[0].evidenceId}:source_subject_incompatible`,
    )

    const misdirected = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.profileId === 'RANGE-INTERNAL-CARE-I3',
      )!,
    )
    const correctionClaim = misdirected.internalEvidence
      .find((record) => record.evidenceId === 'INT-CARE-008')!
      .claims.find((claim) => claim.supersedesClaimIds.length > 0)!
    correctionClaim.supersedesClaimIds = ['INT-CARE-002-CLAIM-03']
    expect(validateG21InternalRangeProfile(misdirected)).toContain(
      'claim_relations_do_not_match_frozen_contract',
    )
  })

  it('seals lifecycle prose, route contracts and every blind-input field', () => {
    const swapped = structuredClone(G21_INTERNAL_RANGE_CANARY[0])
    ;[swapped.lifecycleEvidence[0].content, swapped.lifecycleEvidence[1].content] = [
      swapped.lifecycleEvidence[1].content,
      swapped.lifecycleEvidence[0].content,
    ]
    ;[swapped.lifecycleEvidence[0].claims[0].text, swapped.lifecycleEvidence[1].claims[0].text] = [
      swapped.lifecycleEvidence[1].claims[0].text,
      swapped.lifecycleEvidence[0].claims[0].text,
    ]
    expect(validateG21InternalRangeProfile(swapped)).toContain(
      'lifecycle_evidence_does_not_match_frozen_contract',
    )

    for (const profile of G21_INTERNAL_RANGE_CANARY) {
      const generic = structuredClone(profile)
      generic.oracle.routeChangingQuestion = 'What should we discuss next?'
      expect(validateG21InternalRangeProfile(generic)).toContain(
        'oracle_does_not_match_frozen_contract',
      )
    }

    const input = buildG21InternalBlindInputs()[0]
    for (const [field, value] of Object.entries(G21_INTERNAL_RANGE_CANARY[0].oracle)) {
      const leaked = { ...structuredClone(input), [field]: value }
      expect(validateG21InternalBlindInput(leaked)).toContain(
        'blind_input_fields_invalid',
      )
    }

    const badTask = structuredClone(input)
    badTask.task = 'Recommend the rollout and identify which named employees should leave.'
    expect(validateG21InternalBlindInput(badTask)).toContain(
      'blind_input_task_invalid',
    )

    const badAuthority = {
      ...structuredClone(input),
      authority: {
        ...structuredClone(input.authority),
        mayRecommendConsequentialAction: true,
      },
    }
    expect(validateG21InternalBlindInput(badAuthority)).toContain(
      'blind_input_authority_invalid',
    )

    const malformedAuthorities = {
      ...structuredClone(input),
      audienceAuthorities: 'private by default',
    }
    expect(() =>
      validateG21InternalBlindInput(malformedAuthorities),
    ).not.toThrow()
    expect(
      validateG21InternalBlindInput(malformedAuthorities),
    ).toContain('blind_input_audience_authority_fields_invalid')

    const invalidPopulation = structuredClone(G21_INTERNAL_RANGE_CANARY) as Array<
      G21InternalRangeProfile & {
        identity: G21InternalRangeProfile['identity'] & { realNamedPerson?: boolean }
      }
    >
    invalidPopulation[0].identity.realNamedPerson = true
    expect(() =>
      buildG21InternalBlindInputs('G21-INTERNAL-RANGE-RUN-003-INVALID', invalidPopulation),
    ).toThrow('refused invalid profiles')
  })

  it('separates total runtime safety from exact canonical fixture verification', () => {
    const profile = G21_INTERNAL_RANGE_CANARY[0]
    const input = buildG21InternalBlindInputs().find(
      (candidate) =>
        candidate.profileId === profile.manifest.profileId &&
        candidate.runtimeState === 'initial',
    )!

    expect(validateG21InternalBlindInput(input)).toEqual([])
    expect(validateG21CanonicalInternalBlindInput(input, profile)).toEqual([])
    expect(validateG21CanonicalInternalBlindInput(input, undefined)).toContain(
      'canonical_profile_required',
    )

    const safeNovelText = structuredClone(input)
    safeNovelText.internalEvidence[0].content = G21_TRUSTED_SAFE_NOVEL_VARIANT.content
    safeNovelText.internalEvidence[0].claims[0].text = G21_TRUSTED_SAFE_NOVEL_VARIANT.claimText
    safeNovelText.internalEvidence[0].semanticReceipt.receiptId =
      G21_TRUSTED_SAFE_NOVEL_VARIANT.receiptId
    safeNovelText.currentClaims = buildG21CurrentClaimView(safeNovelText.internalEvidence)
    expect(validateG21InternalBlindInput(safeNovelText)).toEqual([])
    expect(validateG21CanonicalInternalBlindInput(safeNovelText, profile)).toContain(
      'canonical_internal_evidence_bytes_mismatch',
    )

    const untrustedNovelText = structuredClone(input)
    untrustedNovelText.internalEvidence[0].content = 'A fictional but unissued intake sentence.'
    untrustedNovelText.internalEvidence[0].claims[0].text =
      'A fictional but unissued intake sentence.'
    untrustedNovelText.currentClaims = buildG21CurrentClaimView(
      untrustedNovelText.internalEvidence,
    )
    expect(validateG21InternalBlindInput(untrustedNovelText)).toContain(
      'INT-CARE-001:blind_input_semantic_receipt_binding_mismatch',
    )
  })

  it('fails closed over malformed, relabelled and counterfeited runtime envelopes', () => {
    const inputs = buildG21InternalBlindInputs()
    const baseline = inputs[0]
    const malformed = [
      { ...structuredClone(baseline), runId: null },
      { ...structuredClone(baseline), claims: 'not a field' },
      { ...structuredClone(baseline), subject: null },
      { ...structuredClone(baseline), externalCoverage: [] },
      { ...structuredClone(baseline), externalEvidence: 'not an array' },
      { ...structuredClone(baseline), internalEvidence: 'not an array' },
      { ...structuredClone(baseline), audienceAuthorities: 'not an array' },
      { ...structuredClone(baseline), currentClaims: 'not an array' },
      { ...structuredClone(baseline), authority: null },
    ]
    for (const candidate of malformed) {
      expect(() => validateG21InternalBlindInput(candidate)).not.toThrow()
      expect(validateG21InternalBlindInput(candidate).length).toBeGreaterThan(0)
    }

    const sparse = [
      { ...structuredClone(baseline), internalEvidence: new Array(1) },
      { ...structuredClone(baseline), audienceAuthorities: new Array(1) },
      { ...structuredClone(baseline), currentClaims: new Array(1) },
    ]
    const sparseClaims = structuredClone(baseline)
    sparseClaims.internalEvidence[0].claims = new Array(1)
    sparse.push(sparseClaims)
    const sparseRelations = structuredClone(baseline)
    sparseRelations.internalEvidence[0].claims[0].challengesClaimIds = new Array(1)
    sparse.push(sparseRelations)
    for (const candidate of sparse) {
      expect(() => validateG21InternalBlindInput(candidate)).not.toThrow()
      expect(validateG21InternalBlindInput(candidate).length).toBeGreaterThan(0)
    }

    const relabelledState = structuredClone(
      inputs.find((input) => input.runtimeState === 'initial')!,
    )
    relabelledState.runtimeState = 'corrected'
    relabelledState.caseId = `${relabelledState.profileId}-CORRECTED`
    expect(validateG21InternalBlindInput(relabelledState)).toContain(
      'blind_input_internal_evidence_binding_mismatch',
    )

    const careI1 = inputs.find(
      (input) =>
        input.profileId === 'RANGE-INTERNAL-CARE-I1' && input.runtimeState === 'initial',
    )!
    const relabelledDepth = structuredClone(careI1)
    relabelledDepth.profileId = 'RANGE-INTERNAL-CARE-I3'
    relabelledDepth.internalDepth = 'longitudinal_corrections'
    relabelledDepth.caseId = 'RANGE-INTERNAL-CARE-I3-INITIAL'
    expect(validateG21InternalBlindInput(relabelledDepth)).toContain(
      'blind_input_internal_evidence_binding_mismatch',
    )

    const counterfeitAuthority = structuredClone(baseline)
    counterfeitAuthority.audienceAuthorities[0].authorityId = 'AUTH-COUNTERFEIT'
    counterfeitAuthority.audienceAuthorities[0].authorisedAt = '2026-01-01T00:00:00.000Z'
    expect(validateG21InternalBlindInput(counterfeitAuthority)).toContain(
      `${counterfeitAuthority.internalEvidence[0].evidenceId}:blind_input_audience_not_authorised`,
    )

    const realPersonCostume = structuredClone(baseline)
    realPersonCostume.subject.fictionalIdentityKey = 'real-satya-nadella'
    realPersonCostume.subject.displayName = 'Satya Nadella'
    realPersonCostume.subject.organisation = 'Microsoft'
    expect(validateG21InternalBlindInput(realPersonCostume)).toEqual(
      expect.arrayContaining([
        'blind_input_fictional_identity_key_required',
        'blind_input_subject_mismatch',
      ]),
    )
  })

  it('rejects future evidence, unsafe claim semantics, broken lineage and oracle-bearing drift', () => {
    const inputs = buildG21InternalBlindInputs()
    const futureExternal = structuredClone(
      inputs.find((input) => input.externalEvidence.length > 0)!,
    )
    futureExternal.externalEvidence[0].publishedOn = '2026-09-11T09:00:00.000Z'
    futureExternal.externalEvidence[0].retrievedOn = '2026-09-11T09:01:00.000Z'
    expect(validateG21InternalBlindInput(futureExternal)).toEqual(
      expect.arrayContaining([
        `${futureExternal.externalEvidence[0].sourceId}:blind_input_published_after_as_of`,
        `${futureExternal.externalEvidence[0].sourceId}:blind_input_retrieved_after_as_of`,
      ]),
    )

    const causalObservation = structuredClone(
      inputs.find(
        (input) =>
          input.profileId === 'RANGE-INTERNAL-STORY-I3' && input.runtimeState === 'initial',
      )!,
    )
    const outcome = causalObservation.internalEvidence.find(
      (record) => record.evidenceId === 'INT-STORY-007',
    )!
    outcome.content = 'Theory-heavy exposure causes opening-weekend purchase across all fan groups.'
    outcome.claims[0].text = outcome.content
    causalObservation.currentClaims = buildG21CurrentClaimView(causalObservation.internalEvidence)
    expect(validateG21InternalBlindInput(causalObservation)).toContain(
      'INT-STORY-007:observational_claim_cannot_assert_causation_INT-STORY-007-CLAIM-01',
    )

    const causalParaphrase = structuredClone(causalObservation)
    const paraphrasedOutcome = causalParaphrase.internalEvidence.find(
      (record) => record.evidenceId === 'INT-STORY-007',
    )!
    paraphrasedOutcome.content =
      'Theory-heavy exposure drove opening-weekend purchase across all fan groups.'
    paraphrasedOutcome.claims[0].text = paraphrasedOutcome.content
    causalParaphrase.currentClaims = buildG21CurrentClaimView(causalParaphrase.internalEvidence)
    expect(validateG21InternalBlindInput(causalParaphrase)).toContain(
      'INT-STORY-007:blind_input_semantic_receipt_binding_mismatch',
    )

    const semanticPersonhood = structuredClone(inputs[0])
    semanticPersonhood.internalEvidence[0].content =
      'Satya Nadella personally consented to this private evidence being used by the fictional fixture.'
    semanticPersonhood.internalEvidence[0].claims[0].text =
      semanticPersonhood.internalEvidence[0].content
    semanticPersonhood.currentClaims = buildG21CurrentClaimView(
      semanticPersonhood.internalEvidence,
    )
    expect(validateG21InternalBlindInput(semanticPersonhood)).toContain(
      `${semanticPersonhood.internalEvidence[0].evidenceId}:blind_input_semantic_receipt_binding_mismatch`,
    )

    const semanticLifecycleReversal = structuredClone(
      inputs.find(
        (input) =>
          input.profileId === 'RANGE-INTERNAL-CARE-I1' && input.runtimeState === 'corrected',
      )!,
    )
    const careProfile = G21_INTERNAL_RANGE_CANARY.find(
      (profile) => profile.manifest.profileId === semanticLifecycleReversal.profileId,
    )!
    const conflict = semanticLifecycleReversal.internalEvidence[careProfile.internalEvidence.length]
    const correction =
      semanticLifecycleReversal.internalEvidence[careProfile.internalEvidence.length + 1]
    ;[conflict.content, correction.content] = [correction.content, conflict.content]
    ;[conflict.claims[0].text, correction.claims[0].text] = [
      correction.claims[0].text,
      conflict.claims[0].text,
    ]
    ;[conflict.semanticReceipt, correction.semanticReceipt] = [
      correction.semanticReceipt,
      conflict.semanticReceipt,
    ]
    semanticLifecycleReversal.currentClaims = buildG21CurrentClaimView(
      semanticLifecycleReversal.internalEvidence,
    )
    expect(validateG21InternalBlindInput(semanticLifecycleReversal)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/blind_input_semantic_receipt_binding_mismatch$/),
      ]),
    )

    const incapableSource = structuredClone(
      inputs.find(
        (input) =>
          input.profileId === 'RANGE-INTERNAL-RESEARCH-I3' && input.runtimeState === 'initial',
      )!,
    )
    const leaderChoice = incapableSource.internalEvidence.find(
      (record) => record.evidenceId === 'INT-RESEARCH-009',
    )!
    leaderChoice.sourceType = 'staff_evidence'
    leaderChoice.subjectScope = 'staff_group'
    leaderChoice.claims.forEach((claim) => {
      claim.subjectScope = 'staff_group'
    })
    incapableSource.currentClaims = buildG21CurrentClaimView(incapableSource.internalEvidence)
    expect(validateG21InternalBlindInput(incapableSource)).toContain(
      'INT-RESEARCH-009:blind_input_semantic_receipt_binding_mismatch',
    )

    const misdirected = structuredClone(
      inputs.find(
        (input) =>
          input.profileId === 'RANGE-INTERNAL-CARE-I3' && input.runtimeState === 'initial',
      )!,
    )
    const correction = misdirected.internalEvidence.find(
      (record) => record.evidenceId === 'INT-CARE-008',
    )!
    correction.claims[0].supersedesClaimIds = ['INT-CARE-002-CLAIM-03']
    misdirected.currentClaims = buildG21CurrentClaimView(misdirected.internalEvidence)
    expect(validateG21InternalBlindInput(misdirected)).toContain(
      'INT-CARE-008:blind_input_semantic_receipt_binding_mismatch',
    )

    const oracleProfile = G21_INTERNAL_RANGE_CANARY.find(
      (profile) => profile.manifest.profileId === 'RANGE-INTERNAL-CARE-I1',
    )!
    const oracleDrift = structuredClone(
      inputs.find(
        (input) =>
          input.profileId === 'RANGE-INTERNAL-CARE-I1' && input.runtimeState === 'initial',
      )!,
    )
    oracleDrift.internalEvidence[0].content = oracleProfile.oracle.strongestSupportedView
    oracleDrift.internalEvidence[0].claims[0].text = oracleProfile.oracle.strongestSupportedView
    oracleDrift.currentClaims = buildG21CurrentClaimView(oracleDrift.internalEvidence)
    expect(validateG21InternalBlindInput(oracleDrift)).toContain(
      'blind_input_oracle_value_detected',
    )

    const populationDrift = structuredClone(G21_INTERNAL_RANGE_CANARY)
    for (const profile of populationDrift.filter(
      (candidate) => candidate.familyId === 'fictional-care-scheduling',
    )) {
      profile.internalEvidence[0].content = oracleProfile.oracle.strongestSupportedView
      profile.internalEvidence[0].claims[0].text = oracleProfile.oracle.strongestSupportedView
    }
    expect(validateG21InternalRangeCanary(populationDrift)).toEqual(
      expect.arrayContaining([
        'RANGE-INTERNAL-CARE-I1:profile_substrate_does_not_match_frozen_contract',
      ]),
    )
    expect(() =>
      buildG21InternalBlindInputs('G21-INTERNAL-RANGE-RUN-005-ORACLE-DRIFT', populationDrift),
    ).toThrow('refused invalid profiles')
  })

  it('makes every repaired question alter its exact material route while keeping the final call human', () => {
    const expectedQuestions = {
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
    } as const
    for (const [profileId, question] of Object.entries(expectedQuestions)) {
      const profile = G21_INTERNAL_RANGE_CANARY.find(
        (candidate) => candidate.manifest.profileId === profileId,
      )!
      expect(profile.oracle.routeChangingQuestion).toBe(question)
      expect(profile.oracle.answerContract.routeEffects.every(
        (effect) => effect.routeChange.length > 20,
      )).toBe(true)
    }

    const forge = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.profileId === 'RANGE-INTERNAL-FORGE-I3',
      )!,
    )
    forge.oracle.answerContract.options[0] = 'The system'
    forge.oracle.answerContract.routeEffects[0].answer = 'The system'
    expect(validateG21InternalRangeProfile(forge)).toContain(
      'material_final_call_requires_human_options',
    )

    const story = structuredClone(
      G21_INTERNAL_RANGE_CANARY.find(
        (profile) => profile.manifest.profileId === 'RANGE-INTERNAL-STORY-I2',
      )!,
    )
    story.oracle.answerContract.routeEffects.pop()
    expect(validateG21InternalRangeProfile(story)).toContain(
      'each_answer_option_requires_route_effect',
    )
  })

  it('keeps the rejected abstraction-heavy questions as negative regressions', () => {
    const regressions = [
      {
        familyId: 'fictional-care-scheduling',
        internalDepth: 'work_evidence',
        question: 'Did the unsafe schedules come from bad referral data or the scheduling logic?',
      },
      {
        familyId: 'fictional-care-scheduling',
        internalDepth: 'longitudinal_corrections',
        question: 'Do the same vulnerable clients keep the same carer when you stop reviewing exceptions?',
      },
      {
        familyId: 'fictional-manufacturing-redesign',
        internalDepth: 'longitudinal_corrections',
        question: 'Which exceptions still change customer risk enough that a planner must own the final call?',
      },
      {
        familyId: 'fictional-franchise-fan-intelligence',
        internalDepth: 'work_evidence',
        question: 'What should new viewers see first to raise ticket intent without exhausting core fans?',
      },
      {
        familyId: 'fictional-franchise-fan-intelligence',
        internalDepth: 'longitudinal_corrections',
        question: 'How much must ticket intent rise in a fair comparison before you move GBP 18 million?',
      },
    ] as const

    for (const regression of regressions) {
      const candidate = structuredClone(
        G21_INTERNAL_RANGE_CANARY.find(
          (profile) =>
            profile.familyId === regression.familyId &&
            profile.manifest.internalDepth === regression.internalDepth,
        )!,
      )
      candidate.oracle.routeChangingQuestion = regression.question
      expect(validateG21InternalRangeProfile(candidate)).toContain(
        'route_question_contains_specialist_jargon',
      )
    }
  })
})

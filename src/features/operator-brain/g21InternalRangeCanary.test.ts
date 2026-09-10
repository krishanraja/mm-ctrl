import { describe, expect, it } from 'vitest'
import { EXTERNAL_EVIDENCE_DEPTHS, RANGE_RUNTIME_STATES } from './rangeCouncilContract'
import {
  G21_INTERNAL_RANGE_CANARY,
  G21_INTERNAL_RANGE_CASES,
  G21_NONZERO_INTERNAL_DEPTHS,
  buildG21InternalBlindInputs,
  validateG21CompleteCoordinateCoverage,
  validateG21InternalRangeCanary,
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
      expect(corrections.every((record) => record.supersedesEvidenceId)).toBe(true)
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
    delete directCorrection.supersedesEvidenceId
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
    candidate.lifecycleEvidence[1].supersedesEvidenceId = candidate.internalEvidence[0].evidenceId
    candidate.lifecycleEvidence[1].recordedAt = candidate.lifecycleEvidence[0].recordedAt
    expect(validateG21InternalRangeProfile(candidate)).toEqual(
      expect.arrayContaining([
        'lifecycle_correction_must_supersede_conflict',
        'lifecycle_correction_must_follow_conflict',
      ]),
    )
  })
})

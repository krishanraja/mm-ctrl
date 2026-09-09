import { describe, expect, it } from 'vitest'
import {
  COUNCIL_JUDGES,
  COUNCIL_EVENT_FAMILIES,
  EVIDENCE_NAMESPACES,
  EXTERNAL_EVIDENCE_DEPTHS,
  INTERNAL_EVIDENCE_DEPTHS,
  NON_VOTING_COUNCIL_ROLES,
  RANGE_RUNTIME_STATES,
  RESPONSIBILITY_GATE_LABELS,
  SHARED_THEORY_CARDS,
  THEORY_TRIGGERS,
  THEORY_PACK_SEQUENCE,
  adjudicateSealedCouncil,
  buildRangeCases,
  buildTheoryPack,
  resolveResponsibilityGate,
  validateProfileManifest,
  validateRangePopulation,
  validateSealedCouncil,
  type JudgeRuling,
  type RangeProfileManifest,
} from './rangeCouncilContract'

function buildProfiles(): RangeProfileManifest[] {
  let index = 0
  return EXTERNAL_EVIDENCE_DEPTHS.flatMap((externalDepth) =>
    INTERNAL_EVIDENCE_DEPTHS.map((internalDepth) => {
      index += 1
      const isPublicOnly = internalDepth === 'none'
      return {
        profileId: `RANGE-${String(index).padStart(2, '0')}`,
        displayLabel: isPublicOnly ? `Public subject ${index}` : `Fixture subject ${index}`,
        namespace: isPublicOnly ? 'real_public' : 'synthetic_fixture',
        externalDepth,
        internalDepth,
        realNamedPerson: isPublicOnly,
        publicSourceLocators: isPublicOnly ? [`https://example.com/public-source-${index}`] : [],
        syntheticDisclosure: isPublicOnly ? undefined : 'Wholly fictional test identity.',
      } satisfies RangeProfileManifest
    }),
  )
}

describe('evidence range contract', () => {
  it('defines the complete four by four evidence range and three lifecycle states', () => {
    const profiles = buildProfiles()
    const population = { profiles, cases: buildRangeCases(profiles) }

    expect(EXTERNAL_EVIDENCE_DEPTHS).toHaveLength(4)
    expect(INTERNAL_EVIDENCE_DEPTHS).toHaveLength(4)
    expect(RANGE_RUNTIME_STATES).toEqual(['initial', 'contradicted', 'corrected'])
    expect(population.profiles).toHaveLength(16)
    expect(population.cases).toHaveLength(48)
    expect(validateRangePopulation(population)).toEqual([])
  })

  it('rejects a missing coordinate even when the profile count is padded', () => {
    const profiles = buildProfiles()
    profiles[15] = { ...profiles[14], profileId: 'RANGE-16' }
    const errors = validateRangePopulation({ profiles, cases: buildRangeCases(profiles) })
    expect(errors).toContain('range_missing_evidence_coordinate')
  })

  it('keeps real named people in public-only evidence', () => {
    const invalid: RangeProfileManifest = {
      profileId: 'RANGE-REAL-01',
      displayLabel: 'Named leader',
      namespace: 'real_public',
      externalDepth: 'rich_longitudinal',
      internalDepth: 'basic_intake',
      realNamedPerson: true,
      publicSourceLocators: ['https://example.com/source'],
      consentRecordId: 'CONSENT-PRIVATE-01',
    }
    expect(validateProfileManifest(invalid)).toEqual(
      expect.arrayContaining([
        'real_public_cannot_contain_internal_evidence',
        'real_public_cannot_claim_private_consent',
      ]),
    )
  })

  it('requires consent evidence or an explicit fictional disclosure outside public profiles', () => {
    const consented: RangeProfileManifest = {
      profileId: 'RANGE-CONSENTED-01',
      displayLabel: 'Anonymised leader',
      namespace: 'consented_anonymised',
      externalDepth: 'sparse',
      internalDepth: 'work_evidence',
      realNamedPerson: false,
      publicSourceLocators: [],
    }
    const synthetic = { ...consented, profileId: 'RANGE-SYNTH-01', namespace: 'synthetic_fixture' as const }
    expect(validateProfileManifest(consented)).toContain(
      'consented_namespace_requires_symbolic_consent_record',
    )
    expect(validateProfileManifest(synthetic)).toContain(
      'synthetic_fixture_requires_fictional_disclosure',
    )
    expect(EVIDENCE_NAMESPACES).toHaveLength(4)
  })
})

describe('durable council contract', () => {
  function sealedRulings(): JudgeRuling[] {
    return COUNCIL_JUDGES.map((judge) => ({
      rulingId: `RULING-${judge}`,
      runId: 'COUNCIL-RUN-001',
      judge,
      phase: 'sealed_review',
      verdict: 'pass',
      criterionVersion: `${judge}:v1`,
      artifactHash: 'sha256:artifact',
      theoryPackHash: 'sha256:pack',
      claims: ['The owned criterion passed.'],
      evidenceLocators: ['fixture:case-1'],
      recordedAt: '2026-09-09T09:00:00.000Z',
    }))
  }

  it('requires seven independent first-pass rulings and keeps prosecutors non-voting', () => {
    const rulings = sealedRulings()
    expect(validateSealedCouncil(rulings)).toEqual([])
    expect(COUNCIL_JUDGES).toHaveLength(7)
    expect(NON_VOTING_COUNCIL_ROLES).toEqual(['standards_prosecutor', 'founder_calibration'])
    expect(NON_VOTING_COUNCIL_ROLES.some((role) => COUNCIL_JUDGES.includes(role as never))).toBe(false)
    expect(COUNCIL_EVENT_FAMILIES).toHaveLength(6)
    expect(adjudicateSealedCouncil(rulings)).toEqual({ status: 'passed' })
  })

  it('does not permit a veto to hide inside a pass', () => {
    const rulings = sealedRulings()
    rulings[0].veto = {
      ruleId: 'AGENCY-01',
      failure: 'The product acts past human authority.',
      resolvingTest: 'Require and verify a named human gate.',
    }
    expect(validateSealedCouncil(rulings)).toContain('human_agency:veto_requires_fail_verdict')
  })

  it('lets a valid hard veto block a unanimous-looking council', () => {
    const rulings = sealedRulings()
    rulings[0].verdict = 'fail'
    rulings[0].veto = {
      ruleId: 'AGENCY-01',
      failure: 'The product acts past human authority.',
      resolvingTest: 'Require and verify a named human gate.',
    }
    expect(adjudicateSealedCouncil(rulings)).toEqual({ status: 'blocked', vetoes: [rulings[0].veto] })
  })
})

describe('responsibility and theory routing', () => {
  it('uses the highest consequence dimension rather than an average', () => {
    const gate = resolveResponsibilityGate({
      harm: 1,
      irreversibility: 1,
      externalReach: 2,
      evidenceUncertainty: 1,
      changesToMoneyRightsEmploymentReputationAccessOrDurableTruth: 4,
    })
    expect(gate).toBe(4)
    expect(RESPONSIBILITY_GATE_LABELS[gate]).toBe('Restricted')
  })

  it('rejects out-of-range dimensions even when the maximum looks valid', () => {
    expect(() =>
      resolveResponsibilityGate({
        harm: -1 as 0,
        irreversibility: 0,
        externalReach: 0,
        evidenceUncertainty: 0,
        changesToMoneyRightsEmploymentReputationAccessOrDurableTruth: 0,
      }),
    ).toThrow('integer gates from 0 to 4')
  })

  it('loads four current cards on every pass and only triggered historical theory', () => {
    const pack = buildTheoryPack(['memory_change', 'question_generation'])
    expect(SHARED_THEORY_CARDS.map((card) => card.cardId)).toEqual([
      'agency',
      'evidence',
      'boundary',
      'reality',
    ])
    expect(pack.shared).toHaveLength(4)
    expect(pack.optional.map((card) => card.cardId)).toEqual([
      'bitemporal-provenance',
      'memory-poisoning',
      'recognition-first-intake',
    ])
    expect(pack.splitRequired).toBe(false)
  })

  it('keeps the suspect expert-judgement source quarantined', () => {
    const pack = buildTheoryPack(['expert_judgement_claim'])
    expect(pack.optional[0].warning).toContain('Broken or mismatched')
    expect(pack.optional[0].rule).toContain('hypotheses or search terms')
    expect(THEORY_TRIGGERS).toContain('expert_judgement_claim')
  })

  it('caps optional history and requires stable split passes when the cap is exceeded', () => {
    const pack = buildTheoryPack([...THEORY_TRIGGERS])
    expect(pack.optional).toHaveLength(8)
    expect(pack.splitRequired).toBe(true)
    expect(THEORY_PACK_SEQUENCE).toEqual([
      'blind_truth',
      'historical_calibration',
      'adversarial_challenge',
    ])
  })
})

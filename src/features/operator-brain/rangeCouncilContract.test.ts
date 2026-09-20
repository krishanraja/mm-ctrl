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
  adjudicateFrozenRangeCouncil,
  adjudicateSealedCouncil,
  buildRangeCases,
  buildTheoryPack,
  resolveResponsibilityGate,
  validateProfileManifest,
  validateRangePopulation,
  validateFrozenRangeCouncil,
  validateG21SemanticReviewAllowlist,
  validateSealedCouncil,
  type CouncilJudge,
  type FrozenRangeCouncilContract,
  type FrozenRangeJudgeRuling,
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

  it('does not let a fictional fixture borrow the language of consent', () => {
    const fixture: RangeProfileManifest = {
      profileId: 'RANGE-SYNTH-CONSENT',
      displayLabel: 'Fictional leader',
      namespace: 'synthetic_fixture',
      externalDepth: 'sparse',
      internalDepth: 'basic_intake',
      realNamedPerson: false,
      publicSourceLocators: [],
      consentRecordId: 'CONSENT-NOT-REAL',
      syntheticDisclosure: 'Wholly fictional test identity.',
    }

    expect(validateProfileManifest(fixture)).toContain(
      'synthetic_fixture_cannot_claim_consent',
    )
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

  it('turns an inconclusive ruling into a named evidence request and resolving test', () => {
    const rulings = sealedRulings()
    rulings[1].verdict = 'inconclusive'
    expect(validateSealedCouncil(rulings)).toEqual(
      expect.arrayContaining([
        'epistemic_integrity:inconclusive_requires_missing_evidence',
        'epistemic_integrity:inconclusive_requires_resolving_test',
      ]),
    )

    rulings[1].missingEvidence = ['A source capable of resolving the causal claim.']
    rulings[1].resolvingTest = 'Acquire the source and rerun the same frozen criterion.'
    expect(adjudicateSealedCouncil(rulings)).toEqual({
      status: 'needs_evidence',
      judges: ['epistemic_integrity'],
    })
  })

  it('rejects mixed artifacts in one sealed council', () => {
    const rulings = sealedRulings()
    rulings[2].artifactHash = 'sha256:different-artifact'
    expect(validateSealedCouncil(rulings)).toContain('sealed_review_requires_one_artifact_hash')
  })

  it('rejects prose objects disguised as string claims', () => {
    const rulings = sealedRulings()
    rulings[5].claims = [{ claim: 'Nested prose is not the frozen schema.' } as unknown as string]
    expect(validateSealedCouncil(rulings)).toContain(
      'human_comprehension_and_access:claims_must_be_nonempty_strings',
    )
  })

  function frozenRangeContract(): FrozenRangeCouncilContract {
    const criterionVersions = Object.fromEntries(
      COUNCIL_JUDGES.map((judge) => [judge, `${judge}:range-v2`]),
    ) as Record<CouncilJudge, string>
    return {
      runId: 'G21-INTERNAL-RANGE-FREEZE-002',
      artifactCompositeSha256: 'artifact-composite-v2',
      criterionVersions,
    }
  }

  function frozenRangeRulings(): FrozenRangeJudgeRuling[] {
    const contract = frozenRangeContract()
    return COUNCIL_JUDGES.map((judge) => ({
      runId: contract.runId,
      judge,
      criterionVersion: contract.criterionVersions[judge],
      artifactCompositeSha256: contract.artifactCompositeSha256,
      verdict: 'pass',
      claims: ['The owned range criterion passed.'],
      evidenceLocators: ['fixture://range/case-1'],
      veto: null,
      missingEvidence: [],
      resolvingTest: null,
      recordedAt: '2026-09-10T09:00:00.000Z',
    }))
  }

  function frozenRangeV4Contract(): FrozenRangeCouncilContract {
    const criterionVersions = Object.fromEntries(
      COUNCIL_JUDGES.map((judge) => [
        judge,
        `${judge.replace(/_/g, '-')}:g21-internal-range-freeze-v4`,
      ]),
    ) as Record<CouncilJudge, string>
    return {
      runId: 'G21-INTERNAL-RANGE-FREEZE-004',
      artifactCompositeSha256: 'artifact-composite-v4',
      criterionVersions,
      reviewBoundary: {
        protocolVersion: 'history-free-semantic-allowlist:v1',
        semanticReviewCompositeSha256: 'a'.repeat(64),
      },
    }
  }

  function frozenRangeV4Rulings(): FrozenRangeJudgeRuling[] {
    const contract = frozenRangeV4Contract()
    return COUNCIL_JUDGES.map((judge) => ({
      runId: contract.runId,
      judge,
      criterionVersion: contract.criterionVersions[judge],
      artifactCompositeSha256: contract.artifactCompositeSha256,
      verdict: 'pass',
      claims: ['The owned range criterion passed.'],
      evidenceLocators: ['fixture://range/case-1'],
      veto: null,
      missingEvidence: [],
      resolvingTest: null,
      recordedAt: '2026-09-10T22:00:00.000Z',
      reviewBoundaryAttestation: {
        semanticReviewCompositeSha256:
          contract.reviewBoundary!.semanticReviewCompositeSha256,
        excludedHistoryEncountered: false,
      },
    }))
  }

  it('validates the exact frozen range envelope and adjudicates its raw veto unchanged', () => {
    const contract = frozenRangeContract()
    const rulings = frozenRangeRulings()
    expect(validateFrozenRangeCouncil(rulings, contract)).toEqual([])
    expect(adjudicateFrozenRangeCouncil(rulings, contract)).toEqual({ status: 'passed' })

    const resolvingTest = 'Reject a future-dated source and rerun the same frozen artifact.'
    rulings[1].verdict = 'fail'
    rulings[1].veto = {
      ruleId: 'EPISTEMIC-RANGE-01',
      failure: 'A future-dated source passed validation.',
      resolvingTest,
    }
    rulings[1].resolvingTest = resolvingTest
    expect(adjudicateFrozenRangeCouncil(rulings, contract)).toEqual({
      status: 'blocked',
      vetoes: [rulings[1].veto],
    })
  })

  it('rejects range rulings whose envelope drifts or whose veto test is rewritten', () => {
    const contract = frozenRangeContract()
    const rulings = frozenRangeRulings()
    const drifted = rulings[0] as FrozenRangeJudgeRuling & { theoryPackHash?: string }
    drifted.theoryPackHash = 'unimplemented-field'
    expect(validateFrozenRangeCouncil(rulings, contract)).toContain(
      'human_agency:frozen_ruling_fields_invalid',
    )

    delete drifted.theoryPackHash
    rulings[0].verdict = 'fail'
    rulings[0].veto = {
      ruleId: 'AGENCY-RANGE-01',
      failure: 'The human became a rubber stamp.',
      resolvingTest: 'Restore a named human decision boundary.',
    }
    rulings[0].resolvingTest = 'A rewritten test that no longer matches.'
    expect(validateFrozenRangeCouncil(rulings, contract)).toContain(
      'human_agency:frozen_resolving_test_must_match_veto',
    )
  })

  it('does not let a pass claim unresolved evidence or an inconclusive ruling carry a veto', () => {
    const contract = frozenRangeContract()
    const passWithGap = frozenRangeRulings()
    passWithGap[0].missingEvidence = ['The source needed to decide the criterion.']
    expect(validateFrozenRangeCouncil(passWithGap, contract)).toContain(
      'human_agency:frozen_pass_cannot_claim_missing_evidence',
    )

    const inconclusiveWithVeto = frozenRangeRulings()
    inconclusiveWithVeto[1].verdict = 'inconclusive'
    inconclusiveWithVeto[1].missingEvidence = ['A source capable of resolving the claim.']
    inconclusiveWithVeto[1].resolvingTest = 'Acquire that source and rerun the frozen criterion.'
    inconclusiveWithVeto[1].veto = {
      ruleId: 'EPISTEMIC-RANGE-INVALID',
      failure: 'A veto cannot be issued before the missing evidence exists.',
      resolvingTest: inconclusiveWithVeto[1].resolvingTest,
    }
    expect(validateFrozenRangeCouncil(inconclusiveWithVeto, contract)).toContain(
      'epistemic_integrity:frozen_inconclusive_cannot_veto',
    )
  })

  it('rejects malformed nested ruling data without throwing', () => {
    const contract = frozenRangeContract()
    const malformed = frozenRangeRulings() as unknown[]
    malformed[0] = {
      ...malformed[0] as FrozenRangeJudgeRuling,
      claims: [{ prose: 'Not a string claim.' }],
      evidenceLocators: [42],
      missingEvidence: { gap: 'Not an array.' },
    }
    expect(() => validateFrozenRangeCouncil(malformed, contract)).not.toThrow()
    expect(validateFrozenRangeCouncil(malformed, contract)).toEqual(
      expect.arrayContaining([
        'human_agency:frozen_claims_invalid',
        'human_agency:frozen_evidence_invalid',
        'human_agency:frozen_missing_evidence_invalid',
      ]),
    )

    const malformedVeto = frozenRangeRulings() as unknown[]
    malformedVeto[0] = {
      ...malformedVeto[0] as FrozenRangeJudgeRuling,
      verdict: 'fail',
      veto: {
        ruleId: 'AGENCY-RANGE-INVALID',
        failure: 'The veto envelope contains an unrecognised field.',
        resolvingTest: 'Reject this malformed veto.',
        severity: 'critical',
      },
      resolvingTest: 'Reject this malformed veto.',
    }
    expect(validateFrozenRangeCouncil(malformedVeto, contract)).toContain(
      'human_agency:frozen_veto_invalid',
    )
  })

  it('requires exactly one frozen criterion version for every voting judge', () => {
    const completeContract = frozenRangeContract()
    const missingJudge = {
      ...completeContract,
      criterionVersions: Object.fromEntries(
        Object.entries(completeContract.criterionVersions).filter(
          ([judge]) => judge !== 'human_agency',
        ),
      ),
    }
    expect(
      validateFrozenRangeCouncil(
        frozenRangeRulings(),
        missingJudge as unknown as FrozenRangeCouncilContract,
      ),
    ).toContain('frozen_range_criterion_versions_invalid')

    const extraJudge = frozenRangeContract() as FrozenRangeCouncilContract & {
      criterionVersions: Record<string, string>
    }
    extraJudge.criterionVersions.standards_prosecutor = 'must-not-vote:v1'
    expect(validateFrozenRangeCouncil(frozenRangeRulings(), extraJudge)).toContain(
      'frozen_range_criterion_versions_invalid',
    )
  })

  it('requires every v4 judge to attest to the same history-free semantic boundary', () => {
    const contract = frozenRangeV4Contract()
    const rulings = frozenRangeV4Rulings()
    expect(validateFrozenRangeCouncil(rulings, contract)).toEqual([])

    delete rulings[0].reviewBoundaryAttestation
    expect(validateFrozenRangeCouncil(rulings, contract)).toEqual(
      expect.arrayContaining([
        'human_agency:frozen_ruling_fields_invalid',
        'human_agency:frozen_review_boundary_attestation_invalid',
      ]),
    )

    const encounteredHistory = frozenRangeV4Rulings()
    encounteredHistory[1].reviewBoundaryAttestation!.excludedHistoryEncountered = true as false
    expect(validateFrozenRangeCouncil(encounteredHistory, contract)).toContain(
      'epistemic_integrity:frozen_review_boundary_attestation_invalid',
    )
  })

  it('keeps semantic review files separate from hash-only provenance history', () => {
    const semantic = [
      'src/features/operator-brain/g21InternalRangeCanary.ts',
      'src/features/operator-brain/g21InternalRangeCanary.test.ts',
      'scripts/check-g21-internal-range.mjs',
      'project-documentation/ctrl-evolution/runs/g21-internal-range-freeze-004/council-brief.md',
      'project-documentation/ctrl-evolution/runs/g21-internal-range-freeze-004/question-pack.json',
    ]
    const provenance = [
      'project-documentation/ctrl-evolution/g21-internal-range-canary.md',
      'project-documentation/ctrl-evolution/runs/g21-internal-range-freeze-003/adjudication.json',
    ]
    expect(validateG21SemanticReviewAllowlist(semantic, provenance)).toEqual([])
    expect(
      validateG21SemanticReviewAllowlist(
        [...semantic, 'project-documentation/ctrl-evolution/g21-internal-range-canary.md'],
        provenance,
      ),
    ).toContain(
      'history_bearing_semantic_path_forbidden_project-documentation/ctrl-evolution/g21-internal-range-canary.md',
    )
    expect(
      validateG21SemanticReviewAllowlist(
        [...semantic, 'project-documentation/ctrl-evolution/judge-history/human-agency.md'],
        provenance,
      ),
    ).toContain(
      'history_bearing_semantic_path_forbidden_project-documentation/ctrl-evolution/judge-history/human-agency.md',
    )
    expect(
      validateG21SemanticReviewAllowlist(
        [
          ...semantic,
          'project-documentation/ctrl-evolution/runs/g21-internal-range-freeze-005/judges/human_agency.json',
        ],
        provenance,
      ),
    ).toContain(
      'history_bearing_semantic_path_forbidden_project-documentation/ctrl-evolution/runs/g21-internal-range-freeze-005/judges/human_agency.json',
    )
    expect(
      validateG21SemanticReviewAllowlist(
        [...semantic, 'project-documentation/ctrl-evolution/g21-v4-contract-separation.md'],
        provenance,
      ),
    ).toContain(
      'history_bearing_semantic_path_forbidden_project-documentation/ctrl-evolution/g21-v4-contract-separation.md',
    )
    expect(validateG21SemanticReviewAllowlist(new Array(1), provenance)).toEqual([
      'semantic_review_allowlist_required',
    ])
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

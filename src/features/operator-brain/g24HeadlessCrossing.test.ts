import { describe, expect, it } from 'vitest'
import {
  G24_LIFECYCLE_TRANSITIONS,
  G24_MINIMUM_CONTROL_KEYS,
  applyG24LifecycleTransition,
  approveG24InterventionAtom,
  compileG24PendingRelease,
  correctG24Answer,
  createG24EnrichmentExecutionPlan,
  createG24InterventionAtom,
  evaluateG24PendingReleaseUse,
  fingerprintG24ControlGraph,
  recordG24Answer,
  recordG24EnrichmentAttempt,
  renderG24SelectorReceipt,
  resolveG24ControlClosure,
  selectG24Intervention,
  validateG24InterventionAtom,
  type G24ControlRegistry,
  type G24InterventionAtom,
  type G24LifecycleSnapshot,
  type G24LifecycleTransition,
  type G24LifecycleTransitionRequest,
  type G24PendingReleaseProjection,
  type G24SelectorInput,
  type G24SelectorResult,
} from './g24HeadlessCrossing'
import {
  G24_FIXTURE_CONTROL_ROOTS,
  G24_CROSSING_HIDDEN_ORACLE,
  G24_FIXTURE_EXPIRY,
  G24_FIXTURE_NOW,
  buildExactG24ReleaseAuthority,
  buildG24CrossingSelectorFixtures,
  buildG24FixtureControls,
} from './g24HeadlessCrossingFixtures'

function cloneControls(controls: G24ControlRegistry): G24ControlRegistry {
  return structuredClone(controls)
}

function lifecycleRequest(
  transition: G24LifecycleTransition,
  overrides: Partial<G24LifecycleTransitionRequest> = {},
): G24LifecycleTransitionRequest {
  const actorRefs =
    transition.actor === 'krish'
      ? ['krish']
      : transition.actor === 'named_leader_and_krish'
        ? ['krish', 'leader:maya']
        : transition.actor === 'krish_or_krish_recording_named_leader_decline_or_withdrawal'
          ? ['krish', 'leader:maya']
          : ['leader:maya']
  return {
    transitionId: transition.id,
    fromVersion: transition.from === 'none' ? null : `${transition.from}:v1`,
    afterVersion: `${transition.to}:v2`,
    actorClass: transition.actor,
    actorRefs,
    authority: transition.authority,
    authorityVersionRef: `authority:${transition.id}:v1`,
    precondition: transition.precondition,
    preconditionEvidenceRefs: [`precondition:${transition.id}:v1`],
    idempotencyKey: `idempotency:${transition.id}`,
    receiptId: `receipt:${transition.id}`,
    ...overrides,
  }
}

function selectedFixture(name = 'lowExternalHighInternal'): G24SelectorResult {
  return selectG24Intervention(buildG24CrossingSelectorFixtures()[name])
}

function compileProjection(
  selector = selectedFixture(),
  controls = buildG24FixtureControls(),
  projectionVersion = 'release-projection:v1',
): G24PendingReleaseProjection {
  const result = compileG24PendingRelease({
    projectionVersion,
    purpose: 'Help the named leader decide how to rebuild marketing around AI.',
    audience: 'named_leader_private',
    selectorResults: [selector],
    controls,
    trustedAsOf: G24_FIXTURE_NOW,
    includedCanonicalSourceVersions: ['source-set:v1'],
    includedCanonicalBrainVersions: ['brain-set:v1'],
  })
  expect(result.errors).toEqual([])
  expect(result.projection).not.toBeNull()
  return result.projection as G24PendingReleaseProjection
}

function questionAtom(selector = selectedFixture('highExternalHighInternal')): G24InterventionAtom {
  return createG24InterventionAtom(selector, {
    atomVersion: 'question-plan:v1',
    controlVersion: 'question-control:v1',
    purpose: 'Resolve the quality-standard transfer gap.',
    audience: 'named_leader_private',
    sensitivity: 'private',
    channel: 'mobile_companion',
    timing: 'before_next_operator_session',
    decisionFrameVersion: 'decision-frame:ai-marketing-operating-model:v3',
    evidenceVersions: ['coverage:decision-014:v4'],
    payload: {
      kind: 'question',
      visibleWording:
        'Which customer result would prove the team can apply your quality standard without your final rewrite?',
      renderedControlPayload: 'single-choice-with-write-in:v1',
      answerGrammar: 'single_choice',
      optionsOrComparator: ['Fewer rewrites', 'Faster approval', 'Higher customer preference'],
      scopedWriteIn: true,
      honestExits: ['unknown', 'defer', 'refuse', 'premise_wrong'],
      materialEffectDisclosure: 'Your answer will change the proof required before any team rebuild.',
      visibleChangedConsequence: 'The proof requirement will be rebuilt around this result.',
      visibleUnknownConsequence: 'Nothing changes. The gap remains open.',
      answerEffects: {
        'Fewer rewrites': {
          caseEffect: 'rebuild_required',
          visibleConsequence: 'The proof now tests whether final rewrites fall.',
          retireInterventionRefs: ['question:rewrite-signal-follow-up:v1'],
          pendingHumanOwnedProposal: 'Use fewer final rewrites as the proof threshold.',
        },
        'Faster approval': {
          caseEffect: 'rebuild_required',
          visibleConsequence: 'The proof now tests whether sound work is approved faster.',
          retireInterventionRefs: ['question:approval-speed-follow-up:v1'],
          pendingHumanOwnedProposal: 'Use faster sound approval as the proof threshold.',
        },
        'Higher customer preference': {
          caseEffect: 'rebuild_required',
          visibleConsequence: 'The proof now tests customer preference.',
          retireInterventionRefs: ['question:next-proof-signal:v1'],
          pendingHumanOwnedProposal: 'Use customer preference as the proof threshold.',
        },
        unknown: {
          caseEffect: 'no_case_change',
          visibleConsequence: 'Nothing changes. The gap remains open.',
          retireInterventionRefs: [],
          pendingHumanOwnedProposal: null,
        },
        defer: {
          caseEffect: 'no_case_change',
          visibleConsequence: 'Nothing changes. The question is left for later.',
          retireInterventionRefs: [],
          pendingHumanOwnedProposal: null,
        },
        refuse: {
          caseEffect: 'no_case_change',
          visibleConsequence: 'Nothing changes and no reason is inferred.',
          retireInterventionRefs: [],
          pendingHumanOwnedProposal: null,
        },
        premise_wrong: {
          caseEffect: 'no_case_change',
          visibleConsequence: 'Nothing changes. The premise needs operator review.',
          retireInterventionRefs: [],
          pendingHumanOwnedProposal: null,
        },
      },
    },
  })
}

function approvedQuestionAtom(
  selector = selectedFixture('highExternalHighInternal'),
): G24InterventionAtom {
  const atom = questionAtom(selector)
  return approveG24InterventionAtom(atom, selector, {
    atomVersion: atom.atomVersion,
    controlVersion: atom.controlVersion,
    purpose: atom.purpose,
    audience: atom.audience,
    channel: atom.channel,
    timing: atom.timing,
    decisionFrameVersion: atom.decisionFrameVersion,
    evidenceVersions: [...atom.evidenceVersions],
    payloadFingerprint: atom.payloadFingerprint,
  })
}

describe('G24 headless Crossing selector', () => {
  it('matches the frozen semantic oracle without receiving the answers as input', () => {
    const fixtures = buildG24CrossingSelectorFixtures()
    for (const oracle of G24_CROSSING_HIDDEN_ORACLE) {
      const input = fixtures[oracle.fixtureKey]
      expect(input).toBeDefined()
      expect(input).not.toHaveProperty('expectedRoute')
      expect(selectG24Intervention(input).route, oracle.fixtureKey).toBe(oracle.expectedRoute)
    }
  })

  it('records no claimed advantage where a competent same-evidence baseline makes the same call', () => {
    const fixtures = buildG24CrossingSelectorFixtures()
    const comparisons = G24_CROSSING_HIDDEN_ORACLE.map((oracle) => ({
      fixtureKey: oracle.fixtureKey,
      selectorRoute: selectG24Intervention(fixtures[oracle.fixtureKey]).route,
      baselineRoute: oracle.competentSameEvidenceBaselineRoute,
    }))
    expect(comparisons.every(({ selectorRoute, baselineRoute }) => selectorRoute === baselineRoute)).toBe(
      true,
    )
  })

  it('chooses research, reuse, one question, a live session and quiet hold across the evidence range', () => {
    const fixtures = buildG24CrossingSelectorFixtures()
    expect(selectG24Intervention(fixtures.highExternalLowInternal).route).toBe('enrich')
    expect(selectG24Intervention(fixtures.lowExternalHighInternal).route).toBe('reuse')
    expect(selectG24Intervention(fixtures.highExternalHighInternal).route).toBe('ask')
    expect(selectG24Intervention(fixtures.lowExternalLowInternal).route).toBe('session')
    expect(selectG24Intervention(fixtures.quiet)).toMatchObject({
      route: 'abstain_hold',
      reasonCode: 'no_material_effect',
      actionable: false,
    })
    expect(selectG24Intervention(fixtures.noEligibleRoute)).toMatchObject({
      route: 'abstain_hold',
      reasonCode: 'unknowable',
      actionable: false,
    })
  })

  it('chooses only among eligible routes and then uses least burden deterministically', () => {
    const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
    const baseline = selectG24Intervention(input)
    const reversed = selectG24Intervention({
      ...input,
      controlRootKeys: [...input.controlRootKeys].reverse(),
      candidates: [...input.candidates].reverse(),
    })
    expect(reversed.route).toBe('enrich')
    expect(reversed.controllingFingerprint).toBe(baseline.controllingFingerprint)
    expect(reversed.controllingWatermarks).toEqual(baseline.controllingWatermarks)
  })

  it('keeps low-value work quiet even when an interruption is otherwise possible', () => {
    const input = buildG24CrossingSelectorFixtures().highExternalHighInternal
    input.decisionConsequence = 'low_value'
    expect(selectG24Intervention(input)).toMatchObject({
      route: 'abstain_hold',
      reasonCode: 'no_material_effect',
      provisionalDiagnostic: 'outside_consequential_decision_scope',
    })
  })

  it('forbids private cross-case reasoning but permits current immutable public reference reuse', () => {
    const privateCrossCase = buildG24CrossingSelectorFixtures().lowExternalHighInternal
    privateCrossCase.candidates[0].reuseOrigin = 'same_person_other_case'
    privateCrossCase.candidates[0].originCaseRef = 'case:maya:decision-008'
    privateCrossCase.candidates[0].containsPrivateReasoning = true
    expect(selectG24Intervention(privateCrossCase)).toMatchObject({
      route: 'abstain_hold',
      reasonCode: 'source_incapable',
    })

    const publicImmutable = buildG24CrossingSelectorFixtures().lowExternalHighInternal
    publicImmutable.candidates[0].reuseOrigin = 'public_immutable'
    publicImmutable.candidates[0].originCaseRef = 'public:case:industry-reference'
    publicImmutable.candidates[0].reuseEvidenceRef = 'evidence:public:industry-reference:v1'
    publicImmutable.candidates[0].publicSourceRef = 'public-source:industry-report'
    publicImmutable.candidates[0].immutableContentVersion = 'sha256:public-report-v1'
    publicImmutable.candidates[0].immutableReference = true
    publicImmutable.candidates[0].containsPrivateReasoning = false
    expect(selectG24Intervention(publicImmutable).route).toBe('reuse')
  })

  it.each([
    null,
    {},
    { selectorResultVersion: 'malformed:v1' },
    { ...buildG24CrossingSelectorFixtures().highExternalLowInternal, evidenceState: 'guess' },
  ])('turns malformed input into a non-actionable hold instead of throwing', (input) => {
    expect(selectG24Intervention(input)).toMatchObject({
      route: 'abstain_hold',
      reasonCode: 'invalid_input',
      actionable: false,
    })
  })

  it('captures transitive permission and assertion-policy dependencies', () => {
    const closure = resolveG24ControlClosure(
      G24_FIXTURE_CONTROL_ROOTS,
      buildG24FixtureControls(),
      G24_FIXTURE_NOW,
    )
    expect(closure.errors).toEqual([])
    expect(closure.watermarks.map(({ key }) => key)).toEqual(
      expect.arrayContaining(['source_permission_grant', 'assertion_policy_version']),
    )
  })

  it.each(['unknown', 'mismatched', 'invalid', 'indeterminate'] as const)(
    'fails closed when a controlling reference is %s',
    (state) => {
      const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
      input.controls.authority_version.state = state
      expect(selectG24Intervention(input)).toMatchObject({
        route: 'abstain_hold',
        reasonCode: 'invalid_input',
        actionable: false,
      })
    },
  )

  it.each(G24_MINIMUM_CONTROL_KEYS)(
    'fails closed when the %s control is not current',
    (controlKey) => {
      const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
      input.controls[controlKey].state = 'invalid'
      expect(selectG24Intervention(input)).toMatchObject({
        route: 'abstain_hold',
        reasonCode: 'invalid_input',
        actionable: false,
      })
    },
  )

  it.each(['source_permission_grant', 'assertion_policy_version'])(
    'fails closed when the transitive %s control is not current',
    (controlKey) => {
      const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
      input.controls[controlKey].state = 'invalid'
      expect(selectG24Intervention(input).route).toBe('abstain_hold')
    },
  )

  it('fails closed on missing, future-dated and expired controlling references', () => {
    const fixtures = buildG24CrossingSelectorFixtures()
    delete fixtures.highExternalLowInternal.controls.permission_version
    fixtures.highExternalHighInternal.controls.audience_version.validFrom = '2027-01-01T00:00:00.000Z'
    fixtures.lowExternalLowInternal.controls.purpose_version.validUntil = '2026-09-01T00:00:00.000Z'

    for (const input of [
      fixtures.highExternalLowInternal,
      fixtures.highExternalHighInternal,
      fixtures.lowExternalLowInternal,
    ]) {
      expect(selectG24Intervention(input)).toMatchObject({
        route: 'abstain_hold',
        reasonCode: 'invalid_input',
        actionable: false,
      })
    }
  })

  it('rejects an under-recorded minimum root and an added applicable dependency', () => {
    const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
    input.controlRootKeys = input.controlRootKeys.filter((key) => key !== 'permission_version')
    expect(selectG24Intervention(input).provisionalDiagnostic).toContain(
      'under_recorded_lineage:permission_version',
    )

    const complete = buildG24CrossingSelectorFixtures().highExternalLowInternal
    complete.controls.epistemic_policy_version.dependencies.push('new_applicable_policy_control')
    expect(selectG24Intervention(complete).provisionalDiagnostic).toContain(
      'missing_reference:new_applicable_policy_control',
    )

    const deletedEdge = buildG24CrossingSelectorFixtures().lowExternalHighInternal
    deletedEdge.controls.canonical_source_versions.dependencies = []
    const deletedEdgeResult = selectG24Intervention(deletedEdge)
    expect(deletedEdgeResult).toMatchObject({ route: 'abstain_hold', actionable: false })
    expect(deletedEdgeResult.provisionalDiagnostic).toContain(
      'under_recorded_applicable_control:source_permission_grant',
    )
    expect(deletedEdgeResult.provisionalDiagnostic).toContain('control_manifest_graph_mismatch')
  })

  it('requires trusted evaluation and a declared boundary for a bounded-none challenger result', () => {
    const missingTrust = buildG24CrossingSelectorFixtures().highExternalLowInternal
    missingTrust.trustedEvaluation.epistemicPolicyVersion = 'epistemic-policy:untrusted:v0'
    expect(selectG24Intervention(missingTrust).route).toBe('abstain_hold')

    const missingBoundary = buildG24CrossingSelectorFixtures().highExternalLowInternal
    missingBoundary.challengerSearchBoundary = ''
    expect(selectG24Intervention(missingBoundary).provisionalDiagnostic).toContain(
      'challenger_boundary_missing',
    )
  })

  it('binds trusted semantic outcomes to the current decision, coverage, cutoff, policy and challenger versions', () => {
    const mutations: Array<(input: G24SelectorInput) => void> = [
      (input) => {
        input.trustedEvaluation.decisionRequirementVersion = 'decision-requirement:wrong'
      },
      (input) => {
        input.trustedEvaluation.evidenceCoverageVersion = 'coverage:wrong'
      },
      (input) => {
        input.trustedEvaluation.trustedCutoffVersion = 'cutoff:wrong'
      },
      (input) => {
        input.trustedEvaluation.epistemicPolicyVersion = 'policy:wrong'
      },
      (input) => {
        input.trustedEvaluation.independentChallengerResultVersion = 'challenger:wrong'
      },
      (input) => {
        input.trustedEvaluation.trustedAsOf = '2026-09-11T00:00:00.000Z'
      },
      (input) => {
        input.candidates[0].trustedEvaluationVersion = 'trusted-evaluation:wrong'
      },
    ]
    for (const mutate of mutations) {
      const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
      mutate(input)
      expect(selectG24Intervention(input)).toMatchObject({
        route: 'abstain_hold',
        reasonCode: 'invalid_input',
        actionable: false,
      })
    }
  })

  it('rejects ambiguous duplicate route proposals instead of taking the first one', () => {
    const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
    input.candidates.push(structuredClone(input.candidates[0]))
    expect(selectG24Intervention(input)).toMatchObject({
      route: 'abstain_hold',
      reasonCode: 'invalid_input',
      provisionalDiagnostic: 'duplicate_candidate_route',
    })
  })

  it('preserves valid unresolved evidence and does not convert conflict into truth', () => {
    const input = buildG24CrossingSelectorFixtures().lowExternalLowInternal
    const result = selectG24Intervention(input)
    expect(result.route).toBe('session')
    expect(result.unresolvedGap).toBe('contradiction')
    expect(result.unresolvedEvidenceRefs).toEqual(
      expect.arrayContaining([
        'contradiction:tool-capability-versus-behaviour-change',
        'gap:current-incentive-mechanism',
      ]),
    )
  })

  it('transfers accepted judgement only when the later decision earns it, otherwise blocks', () => {
    const fixtures = buildG24CrossingSelectorFixtures()
    expect(selectG24Intervention(fixtures.laterDecisionTransfer)).toMatchObject({
      route: 'reuse',
      reasonCode: 'current_sufficient',
      acceptedDecisionFrameRef: 'decision-frame:ai-product-research:v1',
    })
    expect(selectG24Intervention(fixtures.laterDecisionBlocked)).toMatchObject({
      route: 'abstain_hold',
      reasonCode: 'unresolved_contradiction',
      unresolvedEvidenceRefs: ['countercase:high-novelty-research:v1'],
      actionable: false,
    })
  })

  it('produces a short readable receipt without exposing policy machinery', () => {
    const receipt = renderG24SelectorReceipt(selectedFixture('highExternalHighInternal'))
    expect(receipt).toContain('Route: ask')
    expect(receipt).toContain('What this could change:')
    expect(receipt).not.toContain('epistemic_policy_version')
    expect(receipt.split('\n')).toHaveLength(6)
  })
})

describe('G24 versioned intervention and answer effects', () => {
  it('binds an ask route to one complete proposed question atom', () => {
    expect(questionAtom()).toMatchObject({
      selectorResultVersion: 'selector:high-external-high-internal:v1',
      atomVersion: 'question-plan:v1',
      approvalState: 'proposed',
      payload: { kind: 'question' },
    })
  })

  it('creates a prepared session without granting contact, scheduling, capture or learning authority', () => {
    const selector = selectedFixture('lowExternalLowInternal')
    expect(
      createG24InterventionAtom(selector, {
        atomVersion: 'session-opportunity:v1',
        controlVersion: 'session-control:v1',
        purpose: 'Resolve the incentive and quality-standard conflict.',
        audience: 'named_leader_private',
        sensitivity: 'private',
        channel: 'operator_pull_only',
        timing: 'next_operator_review',
        decisionFrameVersion: selector.acceptedDecisionFrameRef,
        evidenceVersions: [selector.evidenceCoverageRef],
        payload: {
          kind: 'session',
          exactAgenda: [
            'Name the customer proof the rebuild must earn.',
            'Test whether incentives or capability are the stronger cause.',
            'Agree the stop condition for a bounded pilot.',
          ],
          leaderVisiblePurpose: 'Leave with a testable route, not a generic AI commitment.',
          expectedEndState: 'One leader-owned proof threshold and one stop condition.',
          leaderCanDeclineRejectOrReframe: true,
          noContactScheduleCaptureOrLearningAuthority: true,
        },
      }),
    ).toMatchObject({
      approvalState: 'proposed',
      payload: {
        kind: 'session',
        noContactScheduleCaptureOrLearningAuthority: true,
      },
    })
  })

  it('requires exact content, control, purpose, audience, channel, timing and evidence approval binding', () => {
    const selector = selectedFixture('highExternalHighInternal')
    const atom = questionAtom(selector)
    const approved = approveG24InterventionAtom(atom, selector, {
      atomVersion: atom.atomVersion,
      controlVersion: atom.controlVersion,
      purpose: atom.purpose,
      audience: atom.audience,
      channel: atom.channel,
      timing: atom.timing,
      decisionFrameVersion: atom.decisionFrameVersion,
      evidenceVersions: [...atom.evidenceVersions],
      payloadFingerprint: atom.payloadFingerprint,
    })
    expect(approved.approvalState).toBe('approved')

    const silentlyChanged = structuredClone(atom)
    if (silentlyChanged.payload.kind === 'question') {
      silentlyChanged.payload.visibleWording = 'A materially different question?'
    }
    expect(validateG24InterventionAtom(silentlyChanged)).toEqual([
      'intervention_payload_changed_without_new_version',
    ])
    expect(() =>
      approveG24InterventionAtom(silentlyChanged, selector, {
        atomVersion: silentlyChanged.atomVersion,
        controlVersion: silentlyChanged.controlVersion,
        purpose: silentlyChanged.purpose,
        audience: silentlyChanged.audience,
        channel: silentlyChanged.channel,
        timing: silentlyChanged.timing,
        decisionFrameVersion: silentlyChanged.decisionFrameVersion,
        evidenceVersions: [...silentlyChanged.evidenceVersions],
        payloadFingerprint: silentlyChanged.payloadFingerprint,
      }),
    ).toThrow('intervention_approval_binding_mismatch')

    const {
      selectorResultVersion: _selectorResultVersion,
      selectorFingerprint: _selectorFingerprint,
      payloadFingerprint: _payloadFingerprint,
      approvalState: _approvalState,
      ...atomInput
    } = atom
    expect(() =>
      createG24InterventionAtom(selector, {
        ...atomInput,
        audience: 'public',
      }),
    ).toThrow('intervention_atom_selector_binding_mismatch')
  })

  it('keeps an answer immutable while making human-owned change only a pending proposal', () => {
    const receipt = recordG24Answer(approvedQuestionAtom(), {
      receiptId: 'answer:v1',
      kind: 'option',
      value: 'Higher customer preference',
    })
    expect(receipt).toMatchObject({
      immutableCaseEvidence: true,
      caseEffect: 'rebuild_required',
      pendingHumanOwnedProposal: 'Use customer preference as the proof threshold.',
      retiredInterventionRefs: ['question:next-proof-signal:v1'],
      automaticReaskPressure: false,
      automaticSessionEscalation: false,
    })
  })

  it('rejects answers to proposed atoms and approval against a changed selector under the same version', () => {
    const atom = questionAtom()
    expect(() =>
      recordG24Answer(atom, {
        receiptId: 'answer:unapproved',
        kind: 'option',
        value: 'Higher customer preference',
      }),
    ).toThrow('answer_requires_approved_atom')

    const changedSelector = selectedFixture('highExternalHighInternal')
    changedSelector.expectedMaterialEffect = 'A changed effect under the same nominal selector version.'
    expect(() =>
      approveG24InterventionAtom(atom, changedSelector, {
        atomVersion: atom.atomVersion,
        controlVersion: atom.controlVersion,
        purpose: atom.purpose,
        audience: atom.audience,
        channel: atom.channel,
        timing: atom.timing,
        decisionFrameVersion: atom.decisionFrameVersion,
        evidenceVersions: [...atom.evidenceVersions],
        payloadFingerprint: atom.payloadFingerprint,
      }),
    ).toThrow('intervention_approval_binding_mismatch')
  })

  it.each(['unknown', 'defer', 'refuse', 'premise_wrong'] as const)(
    'treats %s as an honest exit with no adverse automation',
    (kind) => {
      expect(
        recordG24Answer(approvedQuestionAtom(), { receiptId: `answer:${kind}`, kind }),
      ).toMatchObject({
        answerKind: kind,
        caseEffect: 'no_case_change',
        pendingHumanOwnedProposal: null,
        automaticReaskPressure: false,
        automaticSessionEscalation: false,
      })
    },
  )

  it('turns an optional voice critical incident into evidence and only a pending learning proposal', () => {
    const selectorInput = buildG24CrossingSelectorFixtures().highExternalHighInternal
    selectorInput.purposeRef = 'Learn the first quality signal from a real incident.'
    const selector = selectG24Intervention(selectorInput)
    const atom = createG24InterventionAtom(selector, {
      atomVersion: 'voice-critical-incident:v1',
      controlVersion: 'voice-control:v1',
      purpose: 'Learn the first quality signal from a real incident.',
      audience: 'named_leader_private',
      sensitivity: 'private',
      channel: 'operator_session',
      timing: 'only_when_leader_offers_an_example',
      decisionFrameVersion: selector.acceptedDecisionFrameRef,
      evidenceVersions: [selector.evidenceCoverageRef],
      payload: {
        kind: 'question',
        visibleWording: 'Tell me about the last piece of work you had to rescue. What was wrong first?',
        renderedControlPayload: 'optional-voice:v1',
        answerGrammar: 'voice_critical_incident',
        optionsOrComparator: ['A concrete incident, not a general opinion'],
        scopedWriteIn: true,
        honestExits: ['unknown', 'defer', 'refuse', 'premise_wrong'],
        materialEffectDisclosure:
          'This may propose a quality signal for your review. It will not become your standard automatically.',
        visibleChangedConsequence: 'A possible quality signal is ready for your review.',
        visibleUnknownConsequence: 'Nothing changes. No quality signal is inferred.',
        answerEffects: {
          default: {
            caseEffect: 'rebuild_required',
            visibleConsequence: 'A possible quality signal is ready for human review.',
            retireInterventionRefs: ['question:generic-quality-signal:v1'],
            pendingHumanOwnedProposal:
              'Review whether early vagueness is a durable quality-rejection signal.',
          },
          unknown: {
            caseEffect: 'no_case_change',
            visibleConsequence: 'Nothing changes.',
            retireInterventionRefs: [],
            pendingHumanOwnedProposal: null,
          },
          defer: {
            caseEffect: 'no_case_change',
            visibleConsequence: 'Nothing changes.',
            retireInterventionRefs: [],
            pendingHumanOwnedProposal: null,
          },
          refuse: {
            caseEffect: 'no_case_change',
            visibleConsequence: 'Nothing changes.',
            retireInterventionRefs: [],
            pendingHumanOwnedProposal: null,
          },
          premise_wrong: {
            caseEffect: 'no_case_change',
            visibleConsequence: 'Nothing changes. The premise needs review.',
            retireInterventionRefs: [],
            pendingHumanOwnedProposal: null,
          },
        },
      },
    })
    const approvedAtom = approveG24InterventionAtom(atom, selector, {
      atomVersion: atom.atomVersion,
      controlVersion: atom.controlVersion,
      purpose: atom.purpose,
      audience: atom.audience,
      channel: atom.channel,
      timing: atom.timing,
      decisionFrameVersion: atom.decisionFrameVersion,
      evidenceVersions: [...atom.evidenceVersions],
      payloadFingerprint: atom.payloadFingerprint,
    })
    const receipt = recordG24Answer(approvedAtom, {
      receiptId: 'voice-answer:v1',
      kind: 'voice',
      value: 'The work sounded polished but nobody could say what decision it changed.',
    })
    expect(receipt).toMatchObject({
      immutableCaseEvidence: true,
      caseEffect: 'rebuild_required',
      pendingHumanOwnedProposal:
        'Review whether early vagueness is a durable quality-rejection signal.',
      automaticReaskPressure: false,
      automaticSessionEscalation: false,
    })
  })

  it('records correction as repair across every named affected decision', () => {
    const atom = approvedQuestionAtom()
    const original = recordG24Answer(atom, {
      receiptId: 'answer:v1',
      kind: 'option',
      value: 'Fewer rewrites',
    })
    const replacement = recordG24Answer(atom, {
      receiptId: 'answer:v2',
      kind: 'option',
      value: 'Higher customer preference',
    })
    const correction = correctG24Answer(original, replacement, {
      receiptId: 'answer-correction:v1',
      dependencyGraph: {
        graphVersion: 'answer-dependency-graph:v1',
        derivativeDependencies: {
          'coverage:decision-014:v4': ['answer:v1'],
          'question:obsolete:v1': ['coverage:decision-014:v4'],
          'question:unrelated:v1': ['answer:unrelated:v1'],
        },
        decisionDependencies: {
          'decision:current:v1': ['coverage:decision-014:v4'],
          'decision:later:v1': ['question:obsolete:v1'],
          'decision:unrelated:v1': ['question:unrelated:v1'],
        },
      },
    })
    expect(correction).toMatchObject({
      correctsAnswerReceiptId: 'answer:v1',
      replacementAnswerReceiptId: 'answer:v2',
      rebuildRequired: true,
    })
    expect(correction.affectedDecisionRefs).toEqual(['decision:current:v1', 'decision:later:v1'])
    expect(correction.retiredDerivativeRefs).toEqual([
      'coverage:decision-014:v4',
      'question:obsolete:v1',
    ])
  })

  it('rejects a correction whose replacement answer belongs to another atom', () => {
    const atom = approvedQuestionAtom()
    const original = recordG24Answer(atom, {
      receiptId: 'answer:v1',
      kind: 'option',
      value: 'Fewer rewrites',
    })
    const replacement = {
      ...recordG24Answer(atom, {
        receiptId: 'answer:v2',
        kind: 'option',
        value: 'Higher customer preference',
      }),
      atomVersion: 'question-plan:different:v1',
    }
    expect(() =>
      correctG24Answer(original, replacement, {
        receiptId: 'answer-correction:v1',
        dependencyGraph: {
          graphVersion: 'answer-dependency-graph:v1',
          derivativeDependencies: {},
          decisionDependencies: {},
        },
      }),
    ).toThrow('replacement_answer_atom_mismatch')
  })
})

describe('G24 dependent Release closure', () => {
  it('compiles the exact selector result with its complete functional closure', () => {
    const projection = compileProjection()
    expect(projection.selectorResultVersions).toEqual([
      'selector:low-external-high-internal:v1',
    ])
    expect(
      projection.selectorControllingWatermarks['selector:low-external-high-internal:v1'],
    ).toEqual(projection.controllingWatermarks)
    expect(projection.controllingWatermarks.length).toBeGreaterThan(G24_MINIMUM_CONTROL_KEYS.length)
    expect(projection.controllingWatermarks.map(({ key }) => key)).toEqual(
      expect.arrayContaining(['source_permission_grant', 'assertion_policy_version']),
    )
  })

  it('refuses compilation when the selector lineage was under-recorded or changed before compile', () => {
    const selector = selectedFixture()
    selector.controllingWatermarks = selector.controllingWatermarks.filter(
      ({ key }) => key !== 'source_permission_grant',
    )
    const result = compileG24PendingRelease({
      projectionVersion: 'release-projection:bad:v1',
      purpose: 'A purpose.',
      audience: 'named_leader_private',
      selectorResults: [selector],
      controls: buildG24FixtureControls(),
      trustedAsOf: G24_FIXTURE_NOW,
      includedCanonicalSourceVersions: ['source-set:v1'],
      includedCanonicalBrainVersions: ['brain-set:v1'],
    })
    expect(result.projection).toBeNull()
    expect(result.errors).toContain(
      'selector:low-external-high-internal:v1:watermark_added:source_permission_grant',
    )
  })

  it('rejects a deleted applicable edge at selector, Release compile, and before use', () => {
    const selectorInput = buildG24CrossingSelectorFixtures().lowExternalHighInternal
    selectorInput.controls.canonical_source_versions.dependencies = []
    expect(selectG24Intervention(selectorInput)).toMatchObject({
      route: 'abstain_hold',
      actionable: false,
    })

    const selector = selectedFixture()
    const projection = compileProjection(selector)
    const changedControls = buildG24FixtureControls()
    changedControls.canonical_source_versions.dependencies = []
    const compileResult = compileG24PendingRelease({
      projectionVersion: 'release-projection:deleted-edge:v1',
      purpose: 'A purpose.',
      audience: 'named_leader_private',
      selectorResults: [selector],
      controls: changedControls,
      trustedAsOf: G24_FIXTURE_NOW,
      includedCanonicalSourceVersions: ['source-set:v1'],
      includedCanonicalBrainVersions: ['brain-set:v1'],
    })
    expect(compileResult.projection).toBeNull()
    expect(compileResult.errors).toEqual(
      expect.arrayContaining([
        'selector:low-external-high-internal:v1:control_manifest_graph_changed',
        'selector:low-external-high-internal:v1:under_recorded_applicable_control:source_permission_grant',
      ]),
    )

    const useResult = evaluateG24PendingReleaseUse({
      projection,
      authority: buildExactG24ReleaseAuthority(projection),
      controls: changedControls,
      trustedAsOf: G24_FIXTURE_NOW,
      receiptId: 'release-check:deleted-edge',
    })
    expect(useResult).toMatchObject({ eligible: false })
    expect(useResult.receipt?.changedControls).toEqual(
      expect.arrayContaining([
        'selector:low-external-high-internal:v1:control_manifest_graph_changed',
        'selector:low-external-high-internal:v1:under_recorded_applicable_control:source_permission_grant',
      ]),
    )
  })

  it('refuses a selector whose route changed without a new sealed result version', () => {
    const selector = selectedFixture('highExternalHighInternal')
    selector.route = 'session'
    const result = compileG24PendingRelease({
      projectionVersion: 'release-projection:mutated-selector:v1',
      purpose: 'A purpose.',
      audience: 'named_leader_private',
      selectorResults: [selector],
      controls: buildG24FixtureControls(),
      trustedAsOf: G24_FIXTURE_NOW,
      includedCanonicalSourceVersions: ['source-set:v1'],
      includedCanonicalBrainVersions: ['brain-set:v1'],
    })
    expect(result.projection).toBeNull()
    expect(result.errors).toContain(
      'selector:high-external-high-internal:v1:selector_result_mutated_without_new_version',
    )
  })

  it('refuses to compile any invalid or held selector into a pending Release projection', () => {
    const input = buildG24CrossingSelectorFixtures().highExternalLowInternal
    input.challengerResult = 'indeterminate'
    const selector = selectG24Intervention(input)
    expect(selector).toMatchObject({ route: 'abstain_hold', actionable: false })
    const result = compileG24PendingRelease({
      projectionVersion: 'release-projection:held:v1',
      purpose: 'A purpose.',
      audience: 'named_leader_private',
      selectorResults: [selector],
      controls: input.controls,
      trustedAsOf: G24_FIXTURE_NOW,
      includedCanonicalSourceVersions: ['source-set:v1'],
      includedCanonicalBrainVersions: ['brain-set:v1'],
    })
    expect(result.projection).toBeNull()
    expect(result.errors).toContain(
      'selector:high-external-low-internal:v1:non_actionable_selector_cannot_compile_release',
    )
  })

  it('allows use only with current controls and exact named-leader Release authority', () => {
    const controls = buildG24FixtureControls()
    const projection = compileProjection(selectedFixture(), controls)
    expect(
      evaluateG24PendingReleaseUse({
        projection,
        controls,
        trustedAsOf: G24_FIXTURE_NOW,
        receiptId: 'release-check:no-authority',
      }),
    ).toMatchObject({ eligible: false, reason: 'release_authority_missing_or_mismatched' })

    expect(
      evaluateG24PendingReleaseUse({
        projection,
        authority: buildExactG24ReleaseAuthority(projection),
        controls,
        trustedAsOf: G24_FIXTURE_NOW,
        receiptId: 'release-check:eligible',
      }),
    ).toEqual({ eligible: true, reason: 'eligible', receipt: null })

    const emptyAuthorityVersion = buildExactG24ReleaseAuthority(projection, '')
    expect(
      evaluateG24PendingReleaseUse({
        projection,
        authority: emptyAuthorityVersion,
        controls,
        trustedAsOf: G24_FIXTURE_NOW,
        receiptId: 'release-check:empty-authority-version',
      }),
    ).toMatchObject({ eligible: false, reason: 'release_authority_missing_or_mismatched' })
  })

  it('rejects a same-version projection whose selector binding was removed', () => {
    const controls = buildG24FixtureControls()
    const first = selectedFixture('lowExternalHighInternal')
    const secondInput = buildG24CrossingSelectorFixtures().laterDecisionTransfer
    secondInput.selectorResultVersion = 'selector:second:v1'
    const second = selectG24Intervention(secondInput)
    const compiled = compileG24PendingRelease({
      projectionVersion: 'release-projection:two-selectors:v1',
      purpose: 'A purpose.',
      audience: 'named_leader_private',
      selectorResults: [first, second],
      controls,
      trustedAsOf: G24_FIXTURE_NOW,
      includedCanonicalSourceVersions: ['source-set:v1'],
      includedCanonicalBrainVersions: ['brain-set:v1'],
    })
    expect(compiled.errors).toEqual([])
    const projection = compiled.projection as G24PendingReleaseProjection
    delete projection.selectorControlRoots['selector:second:v1']
    delete projection.selectorControllingWatermarks['selector:second:v1']

    const result = evaluateG24PendingReleaseUse({
      projection,
      authority: buildExactG24ReleaseAuthority(projection),
      controls,
      trustedAsOf: G24_FIXTURE_NOW,
      receiptId: 'release-check:deleted-selector-binding',
    })
    expect(result).toMatchObject({ eligible: false, reason: 'controlling_state_invalid' })
    expect(result.receipt?.changedControls).toEqual(
      expect.arrayContaining([
        'release_projection_mutated_without_new_version',
        'release_projection_selector_binding_incomplete',
      ]),
    )
  })

  it('invalidates before use when each controlling dependency changes independently', () => {
    const baselineControls = buildG24FixtureControls()
    const projection = compileProjection(selectedFixture(), baselineControls)
    const authority = buildExactG24ReleaseAuthority(projection)

    for (const { key } of projection.controllingWatermarks) {
      const controls = cloneControls(baselineControls)
      controls[key].version = `${controls[key].version}:changed`
      const result = evaluateG24PendingReleaseUse({
        projection,
        authority,
        controls,
        trustedAsOf: G24_FIXTURE_NOW,
        receiptId: `release-invalidation:${key}`,
      })
      expect(result.eligible, key).toBe(false)
      expect(result.reason, key).toBe('controlling_watermark_changed')
      expect(result.receipt, key).toMatchObject({
        appendOnly: true,
        approvalCreated: false,
        deliveryCreated: false,
        externalSideEffectCreated: false,
      })
      expect(result.receipt?.changedControls, key).toContain(`watermark_changed:${key}`)
    }
  })

  it('invalidates on challenger change even when source and Brain versions stay fixed', () => {
    const controls = buildG24FixtureControls()
    const projection = compileProjection(selectedFixture(), controls)
    const originalSource = controls.canonical_source_versions.version
    const originalBrain = controls.canonical_brain_versions.version
    controls.independent_challenger_result_version.version =
      'independent_challenger_result_version:countercase:v2'

    const result = evaluateG24PendingReleaseUse({
      projection,
      authority: buildExactG24ReleaseAuthority(projection),
      controls,
      trustedAsOf: G24_FIXTURE_NOW,
      receiptId: 'release-invalidation:challenger',
    })
    expect(controls.canonical_source_versions.version).toBe(originalSource)
    expect(controls.canonical_brain_versions.version).toBe(originalBrain)
    expect(result).toMatchObject({
      eligible: false,
      reason: 'controlling_watermark_changed',
      receipt: {
        approvalCreated: false,
        deliveryCreated: false,
        externalSideEffectCreated: false,
      },
    })
  })

  it('does not globally invalidate for an unrelated lineage change', () => {
    const controls = buildG24FixtureControls()
    const projection = compileProjection(selectedFixture(), controls)
    controls.unrelated_lineage_version.version = 'unrelated_lineage_version:v2'
    expect(
      evaluateG24PendingReleaseUse({
        projection,
        authority: buildExactG24ReleaseAuthority(projection),
        controls,
        trustedAsOf: G24_FIXTURE_NOW,
        receiptId: 'release-check:unrelated',
      }),
    ).toEqual({ eligible: true, reason: 'eligible', receipt: null })
  })

  it('invalidates expired state before considering an otherwise exact authority', () => {
    const controls = buildG24FixtureControls()
    const projection = compileProjection(selectedFixture(), controls)
    const result = evaluateG24PendingReleaseUse({
      projection,
      authority: buildExactG24ReleaseAuthority(projection),
      controls,
      trustedAsOf: G24_FIXTURE_EXPIRY,
      receiptId: 'release-invalidation:expired',
    })
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('controlling_state_invalid')
    expect(result.receipt?.externalSideEffectCreated).toBe(false)
  })

  it('requires trusted reevaluation and new exact authority after rebuild', () => {
    const controlsV1 = buildG24FixtureControls()
    const selectorV1 = selectedFixture()
    const projectionV1 = compileProjection(selectorV1, controlsV1)
    const oldAuthority = buildExactG24ReleaseAuthority(projectionV1)

    const controlsV2 = cloneControls(controlsV1)
    controlsV2.independent_challenger_result_version.version =
      'independent_challenger_result_version:v2-resolved'
    const baseV2 = buildG24CrossingSelectorFixtures().lowExternalHighInternal
    const graphFingerprintV2 = fingerprintG24ControlGraph(
      baseV2.controlManifest.applicableControlKeys,
      controlsV2,
    )
    const selectorInputV2: G24SelectorInput = {
      ...baseV2,
      selectorResultVersion: 'selector:low-external-high-internal:v2',
      controls: controlsV2,
      controlManifest: {
        ...baseV2.controlManifest,
        manifestVersion: 'control-manifest:v2',
        graphFingerprint: graphFingerprintV2,
      },
      challengerResult: 'countercase_found',
      trustedEvaluation: {
        ...baseV2.trustedEvaluation,
        evaluationVersion: 'trusted-evaluation:v2',
        independentChallengerResultVersion:
          'independent_challenger_result_version:v2-resolved',
        controlManifestVersion: 'control-manifest:v2',
        controlGraphFingerprint: graphFingerprintV2,
      },
      candidates: baseV2.candidates.map(
        (candidate) => ({ ...candidate, trustedEvaluationVersion: 'trusted-evaluation:v2' }),
      ),
    }
    const selectorV2 = selectG24Intervention(selectorInputV2)
    const projectionV2 = compileProjection(selectorV2, controlsV2, 'release-projection:v2')

    expect(
      evaluateG24PendingReleaseUse({
        projection: projectionV2,
        authority: oldAuthority,
        controls: controlsV2,
        trustedAsOf: G24_FIXTURE_NOW,
        receiptId: 'release-check:rebuilt-old-authority',
      }),
    ).toMatchObject({ eligible: false, reason: 'release_authority_missing_or_mismatched' })

    expect(
      evaluateG24PendingReleaseUse({
        projection: projectionV2,
        authority: buildExactG24ReleaseAuthority(projectionV2, 'release-authority:v2'),
        controls: controlsV2,
        trustedAsOf: G24_FIXTURE_NOW,
        receiptId: 'release-check:rebuilt-new-authority',
      }),
    ).toEqual({ eligible: true, reason: 'eligible', receipt: null })
  })
})

describe('G24 engagement lifecycle', () => {
  it.each(G24_LIFECYCLE_TRANSITIONS)(
    'accepts the explicit $id edge from $from to $to with exact authority and a receipt',
    (transition) => {
      const snapshot: G24LifecycleSnapshot = {
        state: transition.from,
        version: transition.from === 'none' ? null : `${transition.from}:v1`,
        receipts: [],
      }
      const result = applyG24LifecycleTransition(snapshot, lifecycleRequest(transition))
      expect(result.accepted).toBe(true)
      expect(result.snapshot.state).toBe(transition.to)
      expect(result.snapshot.receipts).toHaveLength(1)
      expect(result.snapshot.receipts[0]).toMatchObject({
        actorClass: transition.actor,
        authority: transition.authority,
        precondition: transition.precondition,
        invalidation: transition.invalidation,
        receiptType: transition.receipt,
      })
    },
  )

  it('rejects implied edges and stale versions without changing state', () => {
    const snapshot: G24LifecycleSnapshot = {
      state: 'preparing',
      version: 'preparing:v1',
      receipts: [],
    }
    const pauseContinuing = G24_LIFECYCLE_TRANSITIONS.find(
      ({ id }) => id === 'pause_continuing',
    ) as G24LifecycleTransition
    expect(
      applyG24LifecycleTransition(
        snapshot,
        lifecycleRequest(pauseContinuing, {
          fromVersion: 'preparing:v1',
          afterVersion: 'paused:v1',
          idempotencyKey: 'bad-edge',
          receiptId: 'bad-edge-receipt',
        }),
      ),
    ).toMatchObject({ accepted: false, reason: 'transition_edge_not_allowed', snapshot })

    const accept = G24_LIFECYCLE_TRANSITIONS.find(
      ({ id }) => id === 'accept_intensive_proof',
    ) as G24LifecycleTransition
    expect(
      applyG24LifecycleTransition(
        snapshot,
        lifecycleRequest(accept, {
          fromVersion: 'preparing:stale',
          afterVersion: 'intensive:v1',
          idempotencyKey: 'stale-edge',
          receiptId: 'stale-edge-receipt',
        }),
      ),
    ).toMatchObject({ accepted: false, reason: 'from_version_mismatch', snapshot })
  })

  it.each(G24_LIFECYCLE_TRANSITIONS)(
    'rejects wrong actor, authority, and precondition evidence for $id',
    (transition) => {
      const snapshot: G24LifecycleSnapshot = {
        state: transition.from,
        version: transition.from === 'none' ? null : `${transition.from}:v1`,
        receipts: [],
      }
      const wrongActor = transition.actor === 'krish' ? 'named_leader_or_krish' : 'krish'
      const base = lifecycleRequest(transition)
      expect(
        applyG24LifecycleTransition(snapshot, {
          ...base,
          actorClass: wrongActor,
          actorRefs: wrongActor === 'krish' ? ['krish'] : ['leader:maya'],
        }),
      ).toMatchObject({ accepted: false, reason: 'actor_or_authority_invalid', snapshot })

      expect(
        applyG24LifecycleTransition(snapshot, {
          ...base,
          authorityVersionRef: '',
        }),
      ).toMatchObject({ accepted: false, reason: 'actor_or_authority_invalid', snapshot })

      expect(
        applyG24LifecycleTransition(snapshot, {
          ...base,
          preconditionEvidenceRefs: [],
        }),
      ).toMatchObject({ accepted: false, reason: 'precondition_unsatisfied', snapshot })
    },
  )

  it('rejects an unadvanced lifecycle version and duplicate receipt identity', () => {
    const accept = G24_LIFECYCLE_TRANSITIONS.find(
      ({ id }) => id === 'accept_intensive_proof',
    ) as G24LifecycleTransition
    const preparing: G24LifecycleSnapshot = {
      state: 'preparing',
      version: 'preparing:v1',
      receipts: [],
    }
    expect(
      applyG24LifecycleTransition(
        preparing,
        lifecycleRequest(accept, { afterVersion: 'preparing:v1' }),
      ),
    ).toMatchObject({ accepted: false, reason: 'after_version_must_advance', snapshot: preparing })

    const open = G24_LIFECYCLE_TRANSITIONS.find(
      ({ id }) => id === 'open_preparation',
    ) as G24LifecycleTransition
    const first = applyG24LifecycleTransition(
      { state: 'none', version: null, receipts: [] },
      lifecycleRequest(open, { receiptId: 'receipt:shared' }),
    )
    expect(
      applyG24LifecycleTransition(
        first.snapshot,
        lifecycleRequest(accept, {
          receiptId: 'receipt:shared',
          idempotencyKey: 'accept:different-key',
        }),
      ),
    ).toMatchObject({ accepted: false, reason: 'receipt_id_collision', snapshot: first.snapshot })
  })

  it('makes an idempotent retry return the recorded state without a duplicate receipt', () => {
    const initial: G24LifecycleSnapshot = { state: 'none', version: null, receipts: [] }
    const open = G24_LIFECYCLE_TRANSITIONS.find(
      ({ id }) => id === 'open_preparation',
    ) as G24LifecycleTransition
    const request = lifecycleRequest(open, {
      afterVersion: 'preparing:v1',
      idempotencyKey: 'open:one',
      receiptId: 'receipt:open:one',
    })
    const first = applyG24LifecycleTransition(initial, request)
    const retry = applyG24LifecycleTransition(first.snapshot, request)
    expect(retry).toMatchObject({ accepted: true, reason: 'idempotent_replay' })
    expect(retry.snapshot.receipts).toHaveLength(1)
  })

  it('rejects reuse of an idempotency key for a different transition request', () => {
    const initial: G24LifecycleSnapshot = { state: 'none', version: null, receipts: [] }
    const open = G24_LIFECYCLE_TRANSITIONS.find(
      ({ id }) => id === 'open_preparation',
    ) as G24LifecycleTransition
    const accept = G24_LIFECYCLE_TRANSITIONS.find(
      ({ id }) => id === 'accept_intensive_proof',
    ) as G24LifecycleTransition
    const first = applyG24LifecycleTransition(
      initial,
      lifecycleRequest(open, {
        afterVersion: 'preparing:v1',
        idempotencyKey: 'open:one',
        receiptId: 'receipt:open:one',
      }),
    )
    const collision = applyG24LifecycleTransition(
      first.snapshot,
      lifecycleRequest(accept, {
        idempotencyKey: 'open:one',
        receiptId: 'receipt:different',
      }),
    )
    expect(collision).toMatchObject({ accepted: false, reason: 'idempotency_key_collision' })
    expect(collision.snapshot).toEqual(first.snapshot)
  })
})

describe('G24 bounded enrichment execution', () => {
  it('keeps successful output proposed until trusted evaluation awards standing', () => {
    const selector = selectedFixture('highExternalLowInternal')
    const plan = createG24EnrichmentExecutionPlan(selector, {
      planVersion: 'enrichment-plan:v1',
      maximumWallClockMs: 2_000,
      maximumAttempts: 2,
    })
    const result = recordG24EnrichmentAttempt({
      plan,
      currentSelector: selector,
      priorReceipts: [],
      attempt: {
        receiptId: 'enrichment-receipt:v1',
        idempotencyKey: 'enrichment-attempt:one',
        elapsedMs: 500,
        outcome: 'succeeded',
        sourceRef: 'proposed-source:public-report:v1',
      },
    })
    expect(result.receipt).toMatchObject({
      status: 'proposed_evidence',
      sourceRef: 'proposed-source:public-report:v1',
      standingAwarded: false,
      canonicalEvidenceCreated: false,
      brainChanged: false,
      approvalCreated: false,
      deliveryCreated: false,
    })
  })

  it.each([
    ['failed', 500, 'failed_held'],
    ['succeeded', 2_001, 'slow_held'],
  ] as const)('holds a %s or over-time attempt with an append-only receipt', (outcome, elapsedMs, status) => {
    const selector = selectedFixture('highExternalLowInternal')
    const plan = createG24EnrichmentExecutionPlan(selector, {
      planVersion: 'enrichment-plan:v1',
      maximumWallClockMs: 2_000,
      maximumAttempts: 2,
    })
    expect(
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: selector,
        priorReceipts: [],
        attempt: {
          receiptId: `enrichment-receipt:${status}`,
          idempotencyKey: `enrichment-attempt:${status}`,
          elapsedMs,
          outcome,
          sourceRef: 'untrusted-output:v1',
        },
      }).receipt,
    ).toMatchObject({
      status,
      sourceRef: null,
      appendOnly: true,
      standingAwarded: false,
      canonicalEvidenceCreated: false,
      brainChanged: false,
    })
  })

  it('rejects a stale selector before accepting execution output', () => {
    const selector = selectedFixture('highExternalLowInternal')
    const plan = createG24EnrichmentExecutionPlan(selector, {
      planVersion: 'enrichment-plan:v1',
      maximumWallClockMs: 2_000,
      maximumAttempts: 2,
    })
    const changed = selectedFixture('highExternalLowInternal')
    changed.expectedMaterialEffect = 'A changed effect under the same nominal result version.'
    expect(
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: changed,
        priorReceipts: [],
        attempt: {
          receiptId: 'enrichment-receipt:stale',
          idempotencyKey: 'enrichment-attempt:stale',
          elapsedMs: 100,
          outcome: 'succeeded',
          sourceRef: 'must-not-enter:v1',
        },
      }).receipt,
    ).toMatchObject({
      status: 'stale_rejected',
      sourceRef: null,
      canonicalEvidenceCreated: false,
      brainChanged: false,
    })
  })

  it('replays an exact duplicate once and rejects an idempotency collision', () => {
    const selector = selectedFixture('highExternalLowInternal')
    const plan = createG24EnrichmentExecutionPlan(selector, {
      planVersion: 'enrichment-plan:v1',
      maximumWallClockMs: 2_000,
      maximumAttempts: 1,
    })
    const attempt = {
      receiptId: 'enrichment-receipt:v1',
      idempotencyKey: 'enrichment-attempt:one',
      elapsedMs: 500,
      outcome: 'succeeded' as const,
      sourceRef: 'proposed-source:v1',
    }
    const first = recordG24EnrichmentAttempt({
      plan,
      currentSelector: selector,
      priorReceipts: [],
      attempt,
    })
    const replay = recordG24EnrichmentAttempt({
      plan,
      currentSelector: selector,
      priorReceipts: first.receipts,
      attempt,
    })
    expect(replay.replayed).toBe(true)
    expect(replay.receipts).toHaveLength(1)
    expect(() =>
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: selector,
        priorReceipts: first.receipts,
        attempt: { ...attempt, receiptId: 'enrichment-receipt:collision' },
      }),
    ).toThrow('execution_idempotency_key_collision')
    expect(() =>
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: selector,
        priorReceipts: first.receipts,
        attempt: { ...attempt, elapsedMs: 501 },
      }),
    ).toThrow('execution_idempotency_key_collision')
    expect(() =>
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: selector,
        priorReceipts: first.receipts,
        attempt: {
          ...attempt,
          idempotencyKey: 'enrichment-attempt:different',
        },
      }),
    ).toThrow('execution_receipt_id_collision')
  })

  it.each([
    [{ receiptId: '', idempotencyKey: 'key', elapsedMs: 10, outcome: 'failed' }, 'empty receipt'],
    [{ receiptId: 'receipt', idempotencyKey: '', elapsedMs: 10, outcome: 'failed' }, 'empty key'],
    [
      { receiptId: 'receipt', idempotencyKey: 'key', elapsedMs: -1, outcome: 'failed' },
      'negative elapsed time',
    ],
    [
      { receiptId: 'receipt', idempotencyKey: 'key', elapsedMs: 10, outcome: 'unknown' },
      'unknown outcome',
    ],
  ] as const)('rejects a malformed execution envelope: $1', (attempt, _label) => {
    const selector = selectedFixture('highExternalLowInternal')
    const plan = createG24EnrichmentExecutionPlan(selector, {
      planVersion: 'enrichment-plan:v1',
      maximumWallClockMs: 2_000,
      maximumAttempts: 2,
    })
    expect(
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: selector,
        priorReceipts: [],
        attempt: attempt as never,
      }).receipt,
    ).toMatchObject({ status: 'malformed_rejected', sourceRef: null })
  })

  it('holds a claimed success that has no source reference', () => {
    const selector = selectedFixture('highExternalLowInternal')
    const plan = createG24EnrichmentExecutionPlan(selector, {
      planVersion: 'enrichment-plan:v1',
      maximumWallClockMs: 2_000,
      maximumAttempts: 2,
    })
    expect(
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: selector,
        priorReceipts: [],
        attempt: {
          receiptId: 'receipt:no-source',
          idempotencyKey: 'attempt:no-source',
          elapsedMs: 10,
          outcome: 'succeeded',
        },
      }).receipt,
    ).toMatchObject({ status: 'failed_held', sourceRef: null })
  })

  it('holds attempts beyond the exact attempt budget', () => {
    const selector = selectedFixture('highExternalLowInternal')
    const plan = createG24EnrichmentExecutionPlan(selector, {
      planVersion: 'enrichment-plan:v1',
      maximumWallClockMs: 2_000,
      maximumAttempts: 1,
    })
    const first = recordG24EnrichmentAttempt({
      plan,
      currentSelector: selector,
      priorReceipts: [],
      attempt: {
        receiptId: 'enrichment-receipt:first',
        idempotencyKey: 'enrichment-attempt:first',
        elapsedMs: 100,
        outcome: 'failed',
      },
    })
    expect(
      recordG24EnrichmentAttempt({
        plan,
        currentSelector: selector,
        priorReceipts: first.receipts,
        attempt: {
          receiptId: 'enrichment-receipt:second',
          idempotencyKey: 'enrichment-attempt:second',
          elapsedMs: 100,
          outcome: 'succeeded',
          sourceRef: 'must-not-enter:v1',
        },
      }).receipt,
    ).toMatchObject({ status: 'attempt_budget_held', sourceRef: null })
  })
})

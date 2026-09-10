import { describe, expect, it } from 'vitest'
import {
  G21_DIAGNOSTIC_RUN_ID,
  G21_DIAGNOSTIC_SCHEMA_VERSION,
  buildG21BlindDiagnosticInputs,
  validateG21DiagnosticRun,
  type G21DiagnosticRunOutput,
} from './g21DiagnosticCanary'

function validOutput(): G21DiagnosticRunOutput {
  const inputs = buildG21BlindDiagnosticInputs()
  return {
    schemaVersion: G21_DIAGNOSTIC_SCHEMA_VERSION,
    runId: G21_DIAGNOSTIC_RUN_ID,
    results: inputs.map((input) => ({
      profileId: input.profileId,
      diagnosticMode:
        input.externalDepth === 'none_or_unusable'
          ? 'intake_required'
          : input.externalDepth === 'sparse'
            ? 'gap_first'
            : input.externalDepth === 'useful'
              ? 'decision_pressure'
              : 'longitudinal_pressure',
      recommendationState:
        input.externalDepth === 'none_or_unusable' || input.externalDepth === 'sparse'
          ? 'abstain'
          : 'provisional_frame',
      decisionFrame: 'A bounded decision frame.',
      notices: [
        {
          noticeId: `DIAG-${input.profileId}`,
          standing: 'evidence_gap',
          claimScope: 'evidence_gap',
          text: 'The evidence does not answer the decision yet.',
          evidenceIds: [],
        },
      ],
      unresolved: ['The result that would change the route is not known.'],
      routeChangingQuestion: 'What result would change the route?',
      answerWouldChange: 'It would distinguish the available routes.',
      humanDecisionBoundary: 'The leader owns the consequential call.',
    })),
  }
}

describe('G21 blind diagnostic contract', () => {
  it('exports four oracle-free inputs under an explore-only responsibility gate', () => {
    const inputs = buildG21BlindDiagnosticInputs()
    expect(inputs).toHaveLength(4)
    expect(inputs.map((input) => input.externalDepth)).toEqual([
      'none_or_unusable',
      'sparse',
      'useful',
      'rich_longitudinal',
    ])
    for (const input of inputs) {
      expect(input.authority.responsibilityGate).toBe(1)
      expect(input.authority.mayRecommendConsequentialAction).toBe(false)
      expect(input).not.toHaveProperty('oracle')
    }
  })

  it('accepts one bounded result per frozen input', () => {
    const inputs = buildG21BlindDiagnosticInputs()
    expect(validateG21DiagnosticRun(inputs, validOutput())).toEqual([])
  })

  it('forces cold and sparse cases to abstain', () => {
    const inputs = buildG21BlindDiagnosticInputs()
    const output = validOutput()
    output.results[1].recommendationState = 'provisional_frame'
    expect(validateG21DiagnosticRun(inputs, output)).toContain(
      'RANGE-PUBLIC-01:weak_evidence_requires_abstention',
    )
  })

  it('supports a new frozen run without changing the evidence contract', () => {
    const inputs = buildG21BlindDiagnosticInputs('G21-PUBLIC-ROW-RUN-003')
    const output = validOutput()
    output.runId = 'G21-PUBLIC-ROW-RUN-003'
    expect(validateG21DiagnosticRun(inputs, output)).toEqual([])
  })

  it('turns the comprehension veto into a v2 surface contract', () => {
    const inputs = buildG21BlindDiagnosticInputs()
    const output = validOutput()
    output.results[2].decisionFrame = 'This frame asks for commercial causation.'
    output.results[3].routeChangingQuestion =
      'Which workloads deliver contribution margin after full capacity and security costs?'
    expect(validateG21DiagnosticRun(inputs, output)).toEqual(
      expect.arrayContaining([
        'RANGE-PUBLIC-02:decision_frame_contains_specialist_jargon',
        'RANGE-PUBLIC-03:route_changing_question_contains_specialist_jargon',
      ]),
    )
  })

  it('rejects unsourced claims, one-source inference and invented evidence ids', () => {
    const inputs = buildG21BlindDiagnosticInputs()
    const output = validOutput()
    output.results[2].notices = [
      {
        noticeId: 'DIAG-WPP-UNSOURCED',
        standing: 'public_fact',
        claimScope: 'company',
        text: 'An unsupported factual claim.',
        evidenceIds: [],
      },
      {
        noticeId: 'DIAG-WPP-INFERENCE',
        standing: 'bounded_inference',
        claimScope: 'company',
        text: 'A one-source inference.',
        evidenceIds: ['SRC-NOT-REAL'],
      },
    ]
    expect(validateG21DiagnosticRun(inputs, output)).toEqual(
      expect.arrayContaining([
        'RANGE-PUBLIC-02:DIAG-WPP-UNSOURCED:evidence_required',
        'RANGE-PUBLIC-02:DIAG-WPP-INFERENCE:bounded_inference_requires_two_sources',
        'RANGE-PUBLIC-02:DIAG-WPP-INFERENCE:unknown_SRC-NOT-REAL',
      ]),
    )
  })

  it('does not allow a cold start to imply discovered truth', () => {
    const inputs = buildG21BlindDiagnosticInputs()
    const output = validOutput()
    output.results[0].notices[0] = {
      noticeId: 'DIAG-COLD-INVENTION',
      standing: 'public_fact',
      claimScope: 'company',
      text: 'The leader has a delegation problem.',
      evidenceIds: [],
    }
    expect(validateG21DiagnosticRun(inputs, output)).toEqual(
      expect.arrayContaining([
        'RANGE-PUBLIC-00:DIAG-COLD-INVENTION:evidence_required',
        'RANGE-PUBLIC-00:cold_start_may_only_report_gaps',
      ]),
    )
  })
})

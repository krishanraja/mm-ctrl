/* eslint-disable @typescript-eslint/no-explicit-any -- adversarial parser tests deliberately construct invalid untyped payloads */
import { describe, expect, it } from 'vitest'
import { parseOperatorDecisionProjection } from './operatorDecisionProjection'
import { decisionBenchFixture } from './fixtureDecisionBenchAdapter'

const id = (suffix: number) => `14000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`

function projectionFixture(): Record<string, unknown> {
  const workspace = id(1)
  const subject = id(2)
  const decision = id(3)
  const evidence = [id(101), id(102), id(103), id(104)]
  const routes = [id(201), id(202), id(203)]
  const standard = id(401)
  const priorDecision = id(801)
  return {
    schema_version: 'ctrl.operator-decision-projection.v1',
    projection_mode: 'live',
    projection_id: id(6),
    environment_ref: 'cgkcplcamsijghalintq',
    generated_at: '2026-09-20T12:00:00Z',
    fresh_until: '2026-09-21T12:00:00Z',
    authority: {
      workspace_id: workspace,
      subject_id: subject,
      decision_id: decision,
      audience: 'delivery_team_private',
      purpose: 'operator_decision_preparation',
      owner_authority_event_id: id(4),
      operator_grant_id: id(5),
      valid_until: '2026-09-22T12:00:00Z',
    },
    leader: {
      subject_id: subject,
      display_name: 'Maya Chen',
      role: 'Founder and CEO',
      organisation: 'Aperture House',
      brain_name: "Maya's Brain",
      primary_aim: 'Rebuild marketing around an AI-native operating model without lowering the customer standard.',
      relationship_day: 11,
    },
    decision: {
      decision_id: decision,
      title: 'How far should we rebuild marketing around AI?',
      stakes: 'The operating model, quality standard and team design may all change.',
      status: 'testing',
      decision_by: '2026-10-01T12:00:00Z',
      provisional_view: 'Prove the quality system before changing the whole team.',
      owned_call_recorded: false,
      default_route_id: routes[1],
      recommended_route_id: routes[1],
      routes: routes.map((route, index) => ({
        route_id: route,
        tab_label: ['Rebuild now', 'Prove the system', 'Add tools gradually'][index],
        title: ['Rebuild the function now.', 'Prove the system on one campaign.', 'Add tools role by role.'][index],
        summary: 'A materially different path with explicit consequences.',
        upside: 'It creates a clear learning opportunity.',
        risk: 'It may produce activity without changing the quality system.',
        personal_fit: 'This reflects how Maya has described making consequential calls.',
        detail: 'The route makes ownership, evidence and the stop condition explicit.',
        evidence_for: [evidence[index]],
        evidence_against: [evidence[(index + 1) % evidence.length]],
        counter_case: 'The present measures may be more causal than the proposed structural change.',
        decision_question: 'What evidence would make this route worth the risk?',
        decision_effect: 'The answer determines whether the route advances or is held.',
      })),
    },
    current_read: {
      title: 'Prove the quality system before changing the whole team.',
      summary: 'The main risk is changing roles before Maya can transfer how she recognises good work.',
      standing: 'supported',
      evidence_refs: [evidence[0], evidence[1]],
      counter_case: 'Current incentives may be the stronger cause.',
      counter_evidence_refs: [evidence[2]],
      important_unknown: 'Whether another person can apply the quality standard without Maya rescuing the work.',
    },
    personal_portrait: {
      headline: 'Maya judges best through direct comparison.',
      patterns: [{
        pattern_id: id(501),
        name: 'Concrete comparison',
        statement: 'Maya becomes precise when she can compare real work rather than discuss abstractions.',
        standing: 'supported',
        evidence_refs: [evidence[0], evidence[3]],
      }],
      growth_frontier: 'Make the quality signal transferable before the final rescue.',
      growth_evidence_refs: [evidence[1]],
    },
    standards: [{
      standard_id: standard,
      kind: 'judgement',
      name: 'Distinctive without becoming formulaic',
      test: 'A named human must be able to explain why the work is strong before release.',
      standing: 'supported',
      evidence_refs: [evidence[0], evidence[1]],
    }],
    unknowns: [{
      unknown_id: id(601),
      question: 'Can the quality standard travel without Maya doing the final rescue?',
      why_it_matters: 'A larger rebuild depends on it.',
      smallest_test: 'Run one blind comparison on a consequential campaign.',
    }],
    evidence: [
      ['Leader reflection', 'leader_input', 'customer_private', 'Maya described the first quality signal she notices.'],
      ['Campaign review', 'work_sample', 'customer_private', 'The strongest work was rescued in the final review.'],
      ['Current scorecard', 'company_source', 'operator_private', 'The current measures reward volume and deadlines.'],
      ['Customer outcome', 'outcome_observation', 'customer_private', 'Customers remembered the differentiated campaign concept.'],
    ].map(([label, source_kind, origin_audience, projection_text], index) => ({
      evidence_id: evidence[index],
      source_id: id(110 + index),
      label,
      source_kind,
      observed_at: `2026-09-${String(10 + index).padStart(2, '0')}T09:00:00Z`,
      freshness: 'current',
      origin_audience,
      redaction_state: origin_audience === 'public' ? 'not_required' : 'applied',
      standing: 'supported',
      projection_text,
    })),
    corrections: [{
      correction_id: id(701),
      from: 'Maya keeps final work because she distrusts delegation.',
      to: 'Maya keeps final work because the quality signal has not yet become transferable.',
      status: 'accepted',
      evidence_refs: [evidence[0], evidence[1]],
    }],
    prior_decisions: [{
      prior_decision_id: priorDecision,
      title: 'Change the team measures',
      status: 'decided',
      owned_call: 'Replace output volume with one customer-result measure.',
      observed_result: 'Old behaviour returned when the old measures remained.',
      relevance: 'A new structure may fail if incentives do not change with it.',
      evidence_refs: [evidence[2]],
    }],
    questions: [
      {
        question_id: id(301), route_id: routes[0], kind: 'leader_can_answer',
        prompt: 'What would make you regret rebuilding this quickly?',
        why_it_matters: 'It defines the first reversible boundary.',
        decision_effect: 'The route must make this risk easy to stop.',
        answer_mode: 'single_choice', choices: ['Customer work gets worse', 'The quality signal still cannot travel'],
        evidence_refs: [evidence[0]], prior_decision_id: null,
      },
      {
        question_id: id(302), route_id: routes[1], kind: 'brain_can_find',
        prompt: 'Which campaign can prove the quality system?',
        why_it_matters: 'The decision needs consequential evidence, not a toy task.',
        decision_effect: 'The answer selects the first live comparison.',
        answer_mode: 'operator_research', choices: [], evidence_refs: [evidence[1], evidence[3]], prior_decision_id: null,
      },
      {
        question_id: id(303), route_id: routes[2], kind: 'prior_decision_match',
        prompt: 'What changes first if the old measures caused the old behaviour?',
        why_it_matters: 'A prior decision showed that tools alone did not change the work.',
        decision_effect: 'The route stays held until ownership and measures are named.',
        answer_mode: 'voice_or_text', choices: [], evidence_refs: [evidence[2]], prior_decision_id: priorDecision,
      },
    ],
    recommended_move: {
      title: 'Run one blind, consequential comparison.',
      reason: 'It tests whether the quality system can travel before the organisation is rebuilt.',
      method: 'Choose a live campaign, keep customer outcome and human judgement as gates, and define the stop condition.',
      decision_effect: 'The result determines whether to rebuild the function or change the system first.',
      evidence_refs: [evidence[0], evidence[1], evidence[2], evidence[3]],
    },
    claude_handoff: {
      desired_output: 'Develop three genuinely different operating-model routes and pressure-test each against the evidence.',
      forbidden_assumptions: ['Do not assume faster output is better.', 'Do not infer that a named person should be replaced.'],
      output_shape: ['Decision frame', 'Three routes', 'Evidence for and against', 'Stop conditions'],
      evidence_refs: [evidence[0], evidence[1], evidence[2], evidence[3]],
    },
    returned_work: {
      returned_work_id: id(902),
      received_at: '2026-09-20T11:00:00Z',
      text: 'A returned operating-model proposal that still needs human judgement.',
      provenance_label: 'Returned from Claude by Krish for private review.',
      audit: {
        verdict: 'useful_with_rework',
        findings: [{
          finding_id: id(903),
          kind: 'standard_conflict',
          title: 'The human quality owner is missing.',
          body: 'The proposal describes automation but does not name who judges the final work.',
          evidence_refs: [evidence[0]],
          standard_refs: [standard],
        }],
        sharpening_instruction: 'Name the quality owner and the exact customer proof before choosing a structure.',
      },
    },
    coverage: {
      state: 'sufficient',
      known: 'The current quality bottleneck and the strongest counter-case are evidenced.',
      unknown: 'Whether the standard can travel without final rescue remains unproved.',
      next_move: 'Run the blind comparison before the larger organisational call.',
    },
    review_signal: {
      review_packet_id: id(901),
      decision_id: decision,
      question: 'Can someone else apply the quality standard before Maya fixes the work?',
      headline: 'One judgement transfer needs a live test.',
      consequence: 'The answer changes whether the larger rebuild is earned.',
      ready_since: '2026-09-20T10:00:00Z',
    },
  }
}

function mutate(mutator: (value: Record<string, any>) => void) {
  const value = structuredClone(projectionFixture()) as Record<string, any>
  mutator(value)
  return parseOperatorDecisionProjection(value)
}

function expectFailure(result: ReturnType<typeof parseOperatorDecisionProjection>, fragment: string) {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.reasons.some((reason) => reason.includes(fragment))).toBe(true)
}

describe('operator decision projection', () => {
  it('accepts one complete live same-authority projection', () => {
    const result = parseOperatorDecisionProjection(projectionFixture())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.projection.decision.routes).toHaveLength(3)
      expect(result.projection.review_signal?.decision_id).toBe(result.projection.decision.decision_id)
    }
  })

  it('rejects the existing synthetic Decision Bench fixture', () => {
    expectFailure(parseOperatorDecisionProjection(decisionBenchFixture), 'schema_version')
  })

  it('accepts honest sparse coverage and no returned work or review signal', () => {
    const result = mutate((value) => {
      value.coverage.state = 'sparse'
      value.returned_work = null
      value.review_signal = null
    })
    expect(result.ok).toBe(true)
  })

  it.each([
    ['unknown top-level material', (value: any) => { value.raw_packet = { secret: true } }, 'Unrecognized key'],
    ['wrong environment', (value: any) => { value.environment_ref = 'bkyuxvschuwngtcdhsyg' }, 'Invalid literal'],
    ['authority subject substitution', (value: any) => { value.authority.subject_id = id(999) }, 'authority subject mismatch'],
    ['authority decision substitution', (value: any) => { value.authority.decision_id = id(999) }, 'authority decision mismatch'],
    ['inverted freshness', (value: any) => { value.fresh_until = '2026-09-19T12:00:00Z' }, 'freshness window is invalid'],
    ['expired authority', (value: any) => { value.authority.valid_until = '2026-09-20T13:00:00Z' }, 'authority expires before'],
    ['future evidence', (value: any) => { value.evidence[0].observed_at = '2026-09-21T12:00:00Z' }, 'evidence observed after'],
    ['duplicate evidence', (value: any) => { value.evidence[1].evidence_id = value.evidence[0].evidence_id }, 'duplicate evidence identity'],
    ['duplicate route', (value: any) => { value.decision.routes[1].route_id = value.decision.routes[0].route_id }, 'duplicate route identity'],
    ['missing default route', (value: any) => { value.decision.default_route_id = id(999) }, 'default route is missing'],
    ['missing recommended route', (value: any) => { value.decision.recommended_route_id = id(999) }, 'recommended route is missing'],
    ['duplicate question', (value: any) => { value.questions[1].question_id = value.questions[0].question_id }, 'duplicate question identity'],
    ['question for absent route', (value: any) => { value.questions[0].route_id = id(999) }, 'question route is missing'],
    ['route without a question', (value: any) => { value.questions[0].route_id = value.questions[1].route_id }, 'every route needs'],
    ['missing prior decision', (value: any) => { value.questions[2].prior_decision_id = id(999) }, 'prior decision is missing'],
    ['missing evidence reference', (value: any) => { value.recommended_move.evidence_refs = [id(999)] }, 'missing evidence reference'],
    ['review decision substitution', (value: any) => { value.review_signal.decision_id = id(999) }, 'review signal decision mismatch'],
    ['returned-work evidence substitution', (value: any) => { value.returned_work.audit.findings[0].evidence_refs = [id(999)] }, 'returned-work evidence is missing'],
    ['returned-work standard substitution', (value: any) => { value.returned_work.audit.findings[0].standard_refs = [id(999)] }, 'returned-work standard is missing'],
    ['one-choice question', (value: any) => { value.questions[0].choices = ['Only one'] }, 'at least two choices'],
    ['choices on research task', (value: any) => { value.questions[1].choices = ['A', 'B'] }, 'non-choice questions cannot'],
    ['prior ID on ordinary question', (value: any) => { value.questions[0].prior_decision_id = value.prior_decisions[0].prior_decision_id }, 'require exactly one prior decision'],
  ])('fails closed on %s', (_name, mutator, reason) => {
    expectFailure(mutate(mutator), reason)
  })

  it('never returns a partial projection on failure', () => {
    const result = mutate((value) => { value.evidence = [] })
    expect(result).toMatchObject({ ok: false, projection: null })
  })
})

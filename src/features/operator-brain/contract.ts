export type BrainAudience = 'customer_private' | 'operator_private'
export type RouteId = 'ROUTE-A' | 'ROUTE-B' | 'ROUTE-C'
export type DecisionView = 'decision' | 'test' | 'brief' | 'audit'
export type BenchState = 'sparse' | 'stale' | 'wrong'
export type QuestionKind = 'leader_can_answer' | 'brain_can_find' | 'prior_decision_match'
export type QuestionMode = 'answer' | 'find' | 'history'
export type SharpeningStanding = 'LEADER ANSWER' | 'EVIDENCE REQUEST PENDING' | 'PRIOR DECISION MATCH'

export interface BrainSource {
  id: string
  kind: string
  label: string
  observed_at: string
  audience: BrainAudience
  assertion: string
}

export interface DecisionRoute {
  id: RouteId
  name: string
  plain_summary: string
  upside: string
  risk: string
  evidence_for: string[]
  evidence_against: string[]
}

export interface PersonalPattern {
  id: string
  name: string
  statement: string
  standing: string
  source_refs: string[]
}

export interface PersonalStandard {
  id: string
  kind: string
  name: string
  test: string
  source_refs: string[]
}

export interface BrainUnknown {
  id: string
  question: string
  why_it_matters: string
  smallest_test: string
}

export interface DecisionQuestion {
  kind: QuestionKind
  question: string
  choices: string[]
  why_it_matters: string
  decision_effect: string
  source_refs?: string[]
  prior_decision_ref?: string
}

export interface DecisionBenchFixture {
  fixture_version: '4.0.0'
  fixture_status: 'synthetic_demo'
  as_of: string
  disclosure: string
  subject: {
    id: 'SYN-CUST-014'
    display_name: string
    role: string
    organisation: string
    proof_day: number
    proof_length_days: number
    brain_name: string
    primary_aim: string
  }
  decision: {
    id: 'DEC-MAYA-021'
    title: string
    stakes: string
    status: string
    decision_by: string
    provisional_view: string
    owned_call: boolean
    routes: DecisionRoute[]
  }
  current_read: {
    title: string
    plain_summary: string
    standing: string
    confidence: string
    source_refs: string[]
    counter_case: string
    counter_source_refs: string[]
    important_unknown: string
  }
  personal_portrait: {
    headline: string
    patterns: PersonalPattern[]
    growth_frontier: string
    growth_source_refs: string[]
  }
  standards: PersonalStandard[]
  unknowns: BrainUnknown[]
  sources: BrainSource[]
  corrections: Array<{
    id: string
    from: string
    to: string
    status: string
    source_refs: string[]
  }>
  prior_decisions: Array<{
    id: string
    title: string
    status: string
    decision: string
    observed_result: string
    relevance_to_current_decision: string
    source_refs: string[]
  }>
  decision_sharpening: {
    presentation_rule: string
    answering_rule: string
    default_route: RouteId
    question_classes: Array<{ kind: QuestionKind; purpose: string }>
    default_route_questions: DecisionQuestion[]
  }
  recommended_move: {
    title: string
    reason: string
    method: string
    decision_effect: string
    source_refs: string[]
  }
  claude_handoff: {
    desired_output: string
    forbidden_assumptions: string[]
    output_shape: string[]
  }
  returned_claude_example: {
    text: string
    provenance: string
    brain_audit: {
      verdict: string
      generic_reasoning: string[]
      missing_evidence: string[]
      standard_conflicts: string[]
      additive_material: string[]
      sharpening_instruction: string
    }
  }
  sparse_fallback: {
    known: string
    unknown: string
    next_move: string
  }
}

export interface RoutePresentation {
  id: RouteId
  tabLabel: string
  title: string
  summary: string
  personal: string
  detail: string
  support: string
  oppose: string
  counter: string
  question: string
  effect: string
}

export interface ChallengeQuestion {
  kind: string
  question: string
  why: string
  effect: string
  mode: QuestionMode
  choices: string[]
  source: string
}

export interface SharpeningInput {
  standing: SharpeningStanding
  question: string
  input: string
}

export interface AuditFinding {
  title: string
  body: string
  reference: string
  keep?: boolean
}

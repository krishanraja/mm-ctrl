import { z } from 'zod'

const uuid = z.string().uuid()
const instant = z.string().datetime({ offset: true })
const text = (maximum: number) => z.string().trim().min(1).max(maximum)
const refs = z.array(uuid).min(1).max(24)
const standing = z.enum(['supported', 'provisional', 'contested', 'unknown'])

const authoritySchema = z.object({
  workspace_id: uuid,
  subject_id: uuid,
  decision_id: uuid,
  audience: z.literal('delivery_team_private'),
  purpose: z.literal('operator_decision_preparation'),
  owner_authority_event_id: uuid,
  operator_grant_id: uuid,
  valid_until: instant,
}).strict()

const evidenceSchema = z.object({
  evidence_id: uuid,
  source_id: uuid,
  label: text(160),
  source_kind: z.enum([
    'leader_input',
    'meeting_transcript',
    'work_sample',
    'company_source',
    'public_research',
    'outcome_observation',
    'prior_decision',
  ]),
  observed_at: instant,
  freshness: z.enum(['current', 'ageing', 'stale', 'unknown']),
  origin_audience: z.enum(['customer_private', 'operator_private', 'public']),
  redaction_state: z.enum(['not_required', 'applied']),
  standing,
  projection_text: text(1200),
}).strict()

const routeSchema = z.object({
  route_id: uuid,
  tab_label: text(48),
  title: text(180),
  summary: text(480),
  upside: text(480),
  risk: text(480),
  personal_fit: text(320),
  detail: text(800),
  evidence_for: refs,
  evidence_against: refs,
  counter_case: text(800),
  decision_question: text(280),
  decision_effect: text(480),
}).strict()

const questionSchema = z.object({
  question_id: uuid,
  route_id: uuid,
  kind: z.enum(['leader_can_answer', 'brain_can_find', 'prior_decision_match']),
  prompt: text(320),
  why_it_matters: text(480),
  decision_effect: text(480),
  answer_mode: z.enum(['single_choice', 'multi_choice', 'free_text', 'voice_or_text', 'operator_research']),
  choices: z.array(text(120)).max(6),
  evidence_refs: refs,
  prior_decision_id: uuid.nullable(),
}).strict().superRefine((question, context) => {
  const choiceMode = question.answer_mode === 'single_choice' || question.answer_mode === 'multi_choice'
  if (choiceMode && question.choices.length < 2) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'choice questions require at least two choices' })
  }
  if (!choiceMode && question.choices.length > 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'non-choice questions cannot carry choices' })
  }
  if ((question.kind === 'prior_decision_match') !== (question.prior_decision_id !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'prior-decision questions require exactly one prior decision' })
  }
})

const priorDecisionSchema = z.object({
  prior_decision_id: uuid,
  title: text(180),
  status: z.enum(['decided', 'superseded', 'reopened']),
  owned_call: text(800),
  observed_result: text(1000),
  relevance: text(800),
  evidence_refs: refs,
}).strict()

const returnedWorkSchema = z.object({
  returned_work_id: uuid,
  received_at: instant,
  text: text(16_000),
  provenance_label: text(240),
  audit: z.object({
    verdict: z.enum(['not_ready', 'useful_with_rework', 'ready_for_human_polish']),
    findings: z.array(z.object({
      finding_id: uuid,
      kind: z.enum(['generic_reasoning', 'missing_evidence', 'standard_conflict', 'additive_material']),
      title: text(180),
      body: text(1200),
      evidence_refs: z.array(uuid).max(24),
      standard_refs: z.array(uuid).max(12),
    }).strict()).min(1).max(20),
    sharpening_instruction: text(1200),
  }).strict(),
}).strict()

export const operatorDecisionProjectionSchema = z.object({
  schema_version: z.literal('ctrl.operator-decision-projection.v1'),
  projection_mode: z.literal('live'),
  projection_id: uuid,
  environment_ref: z.literal('cgkcplcamsijghalintq'),
  generated_at: instant,
  fresh_until: instant,
  authority: authoritySchema,
  leader: z.object({
    subject_id: uuid,
    display_name: text(120),
    role: text(120),
    organisation: text(160),
    brain_name: text(120),
    primary_aim: text(1000),
    relationship_day: z.number().int().nonnegative().nullable(),
  }).strict(),
  decision: z.object({
    decision_id: uuid,
    title: text(280),
    stakes: text(1200),
    status: z.enum(['framing', 'active', 'testing', 'decided', 'paused']),
    decision_by: instant.nullable(),
    provisional_view: text(1600),
    owned_call_recorded: z.boolean(),
    default_route_id: uuid,
    recommended_route_id: uuid.nullable(),
    routes: z.array(routeSchema).length(3),
  }).strict(),
  current_read: z.object({
    title: text(180),
    summary: text(1200),
    standing,
    evidence_refs: refs,
    counter_case: text(1200),
    counter_evidence_refs: refs,
    important_unknown: text(800),
  }).strict(),
  personal_portrait: z.object({
    headline: text(280),
    patterns: z.array(z.object({
      pattern_id: uuid,
      name: text(120),
      statement: text(800),
      standing,
      evidence_refs: refs,
    }).strict()).min(1).max(12),
    growth_frontier: text(1000),
    growth_evidence_refs: refs,
  }).strict(),
  standards: z.array(z.object({
    standard_id: uuid,
    kind: text(80),
    name: text(160),
    test: text(1200),
    standing,
    evidence_refs: refs,
  }).strict()).min(1).max(16),
  unknowns: z.array(z.object({
    unknown_id: uuid,
    question: text(320),
    why_it_matters: text(800),
    smallest_test: text(800),
  }).strict()).min(1).max(16),
  evidence: z.array(evidenceSchema).min(2).max(80),
  corrections: z.array(z.object({
    correction_id: uuid,
    from: text(1000),
    to: text(1000),
    status: z.literal('accepted'),
    evidence_refs: refs,
  }).strict()).max(16),
  prior_decisions: z.array(priorDecisionSchema).max(12),
  questions: z.array(questionSchema).min(3).max(18),
  recommended_move: z.object({
    title: text(180),
    reason: text(1200),
    method: text(1600),
    decision_effect: text(800),
    evidence_refs: refs,
  }).strict(),
  claude_handoff: z.object({
    desired_output: text(1200),
    forbidden_assumptions: z.array(text(480)).min(1).max(16),
    output_shape: z.array(text(240)).min(1).max(16),
    evidence_refs: refs,
  }).strict(),
  returned_work: returnedWorkSchema.nullable(),
  coverage: z.object({
    state: z.enum(['sufficient', 'sparse']),
    known: text(800),
    unknown: text(800),
    next_move: text(800),
  }).strict(),
  review_signal: z.object({
    review_packet_id: uuid,
    decision_id: uuid,
    question: text(320),
    headline: text(320),
    consequence: text(800),
    ready_since: instant,
  }).strict().nullable(),
}).strict().superRefine((projection, context) => {
  const add = (message: string, path: Array<string | number> = []) => {
    context.addIssue({ code: z.ZodIssueCode.custom, message, path })
  }
  const authority = projection.authority
  if (authority.subject_id !== projection.leader.subject_id) add('authority subject mismatch', ['authority', 'subject_id'])
  if (authority.decision_id !== projection.decision.decision_id) add('authority decision mismatch', ['authority', 'decision_id'])
  if (Date.parse(projection.generated_at) >= Date.parse(projection.fresh_until)) add('projection freshness window is invalid', ['fresh_until'])
  if (Date.parse(authority.valid_until) < Date.parse(projection.fresh_until)) add('operator authority expires before the projection', ['authority', 'valid_until'])

  const evidenceIds = new Set<string>()
  for (const [index, evidence] of projection.evidence.entries()) {
    if (evidenceIds.has(evidence.evidence_id)) add('duplicate evidence identity', ['evidence', index, 'evidence_id'])
    evidenceIds.add(evidence.evidence_id)
    if (Date.parse(evidence.observed_at) > Date.parse(projection.generated_at)) add('evidence observed after projection generation', ['evidence', index, 'observed_at'])
  }

  const routeIds = new Set<string>()
  for (const [index, route] of projection.decision.routes.entries()) {
    if (routeIds.has(route.route_id)) add('duplicate route identity', ['decision', 'routes', index, 'route_id'])
    routeIds.add(route.route_id)
  }
  if (!routeIds.has(projection.decision.default_route_id)) add('default route is missing', ['decision', 'default_route_id'])
  if (projection.decision.recommended_route_id && !routeIds.has(projection.decision.recommended_route_id)) {
    add('recommended route is missing', ['decision', 'recommended_route_id'])
  }

  const priorDecisionIds = new Set(projection.prior_decisions.map((item) => item.prior_decision_id))
  const standardIds = new Set(projection.standards.map((item) => item.standard_id))
  const questionIds = new Set<string>()
  for (const [index, question] of projection.questions.entries()) {
    if (questionIds.has(question.question_id)) add('duplicate question identity', ['questions', index, 'question_id'])
    questionIds.add(question.question_id)
    if (!routeIds.has(question.route_id)) add('question route is missing', ['questions', index, 'route_id'])
    if (question.prior_decision_id && !priorDecisionIds.has(question.prior_decision_id)) {
      add('question prior decision is missing', ['questions', index, 'prior_decision_id'])
    }
  }
  for (const routeId of routeIds) {
    if (!projection.questions.some((question) => question.route_id === routeId)) add('every route needs a route-changing question', ['questions'])
  }

  const evidenceReferenceGroups: Array<[string, string[]]> = [
    ...projection.decision.routes.flatMap((route) => [
      [`route:${route.route_id}:for`, route.evidence_for] as [string, string[]],
      [`route:${route.route_id}:against`, route.evidence_against] as [string, string[]],
    ]),
    ['current_read', projection.current_read.evidence_refs],
    ['current_read_counter', projection.current_read.counter_evidence_refs],
    ...projection.personal_portrait.patterns.map((pattern) => [`pattern:${pattern.pattern_id}`, pattern.evidence_refs] as [string, string[]]),
    ['growth_frontier', projection.personal_portrait.growth_evidence_refs],
    ...projection.standards.map((standard) => [`standard:${standard.standard_id}`, standard.evidence_refs] as [string, string[]]),
    ...projection.corrections.map((correction) => [`correction:${correction.correction_id}`, correction.evidence_refs] as [string, string[]]),
    ...projection.prior_decisions.map((decision) => [`prior:${decision.prior_decision_id}`, decision.evidence_refs] as [string, string[]]),
    ...projection.questions.map((question) => [`question:${question.question_id}`, question.evidence_refs] as [string, string[]]),
    ['recommended_move', projection.recommended_move.evidence_refs],
    ['claude_handoff', projection.claude_handoff.evidence_refs],
  ]
  for (const [name, group] of evidenceReferenceGroups) {
    for (const reference of group) if (!evidenceIds.has(reference)) add(`missing evidence reference:${name}`, ['evidence'])
  }

  if (projection.review_signal && projection.review_signal.decision_id !== projection.decision.decision_id) {
    add('review signal decision mismatch', ['review_signal', 'decision_id'])
  }
  if (projection.returned_work) {
    for (const [index, finding] of projection.returned_work.audit.findings.entries()) {
      for (const reference of finding.evidence_refs) if (!evidenceIds.has(reference)) add('returned-work evidence is missing', ['returned_work', 'audit', 'findings', index, 'evidence_refs'])
      for (const reference of finding.standard_refs) if (!standardIds.has(reference)) add('returned-work standard is missing', ['returned_work', 'audit', 'findings', index, 'standard_refs'])
    }
  }
})

export type OperatorDecisionProjection = z.infer<typeof operatorDecisionProjectionSchema>

export type OperatorDecisionProjectionParseResult =
  | { ok: true; projection: OperatorDecisionProjection }
  | { ok: false; projection: null; reasons: string[] }

export function parseOperatorDecisionProjection(value: unknown): OperatorDecisionProjectionParseResult {
  const parsed = operatorDecisionProjectionSchema.safeParse(value)
  if (parsed.success) return { ok: true, projection: parsed.data }
  return {
    ok: false,
    projection: null,
    reasons: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'projection'}:${issue.message}`),
  }
}

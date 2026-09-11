import { z } from 'zod'
import fixtureText from '../../../project-documentation/ctrl-evolution/design/g20-decision-table-r4-fixture.json?raw'
import type { DecisionBenchFixture } from './contract'

const audienceSchema = z.enum(['customer_private', 'operator_private'])
const routeIdSchema = z.enum(['ROUTE-A', 'ROUTE-B', 'ROUTE-C'])
const questionKindSchema = z.enum(['leader_can_answer', 'brain_can_find', 'prior_decision_match'])
const refsSchema = z.array(z.string().min(1))

const sourceSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  label: z.string().min(1),
  observed_at: z.string().min(1),
  audience: audienceSchema,
  assertion: z.string().min(1),
})

const questionSchema = z.object({
  kind: questionKindSchema,
  question: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  why_it_matters: z.string().min(1),
  decision_effect: z.string().min(1),
  source_refs: refsSchema.optional(),
  prior_decision_ref: z.string().min(1).optional(),
})

const decisionBenchFixtureSchema: z.ZodType<DecisionBenchFixture> = z.object({
  fixture_version: z.literal('4.0.0'),
  fixture_status: z.literal('synthetic_demo'),
  as_of: z.string().min(1),
  disclosure: z.string().min(1),
  subject: z.object({
    id: z.literal('SYN-CUST-014'),
    display_name: z.string().min(1),
    role: z.string().min(1),
    organisation: z.string().min(1),
    proof_day: z.number().int().positive(),
    proof_length_days: z.number().int().positive(),
    brain_name: z.string().min(1),
    primary_aim: z.string().min(1),
  }),
  decision: z.object({
    id: z.literal('DEC-MAYA-021'),
    title: z.string().min(1),
    stakes: z.string().min(1),
    status: z.string().min(1),
    decision_by: z.string().min(1),
    provisional_view: z.string().min(1),
    owned_call: z.boolean(),
    routes: z.array(z.object({
      id: routeIdSchema,
      name: z.string().min(1),
      plain_summary: z.string().min(1),
      upside: z.string().min(1),
      risk: z.string().min(1),
      evidence_for: refsSchema,
      evidence_against: refsSchema,
    })).length(3),
  }),
  current_read: z.object({
    title: z.string().min(1),
    plain_summary: z.string().min(1),
    standing: z.string().min(1),
    confidence: z.string().min(1),
    source_refs: refsSchema,
    counter_case: z.string().min(1),
    counter_source_refs: refsSchema,
    important_unknown: z.string().min(1),
  }),
  personal_portrait: z.object({
    headline: z.string().min(1),
    patterns: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      statement: z.string().min(1),
      standing: z.string().min(1),
      source_refs: refsSchema,
    })).min(1),
    growth_frontier: z.string().min(1),
    growth_source_refs: refsSchema,
  }),
  standards: z.array(z.object({
    id: z.string().min(1),
    kind: z.string().min(1),
    name: z.string().min(1),
    test: z.string().min(1),
    source_refs: refsSchema,
  })).min(1),
  unknowns: z.array(z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    why_it_matters: z.string().min(1),
    smallest_test: z.string().min(1),
  })).min(1),
  sources: z.array(sourceSchema).min(1),
  corrections: z.array(z.object({
    id: z.string().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
    status: z.string().min(1),
    source_refs: refsSchema,
  })).min(1),
  prior_decisions: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    status: z.string().min(1),
    decision: z.string().min(1),
    observed_result: z.string().min(1),
    relevance_to_current_decision: z.string().min(1),
    source_refs: refsSchema,
  })).min(1),
  decision_sharpening: z.object({
    presentation_rule: z.string().min(1),
    answering_rule: z.string().min(1),
    default_route: routeIdSchema,
    question_classes: z.array(z.object({ kind: questionKindSchema, purpose: z.string().min(1) })).length(3),
    default_route_questions: z.array(questionSchema).length(3),
  }),
  recommended_move: z.object({
    title: z.string().min(1),
    reason: z.string().min(1),
    method: z.string().min(1),
    decision_effect: z.string().min(1),
    source_refs: refsSchema,
  }),
  claude_handoff: z.object({
    desired_output: z.string().min(1),
    forbidden_assumptions: z.array(z.string().min(1)).min(1),
    output_shape: z.array(z.string().min(1)).min(1),
  }),
  returned_claude_example: z.object({
    text: z.string().min(1),
    provenance: z.string().min(1),
    brain_audit: z.object({
      verdict: z.string().min(1),
      generic_reasoning: z.array(z.string().min(1)).min(1),
      missing_evidence: z.array(z.string().min(1)).min(1),
      standard_conflicts: z.array(z.string().min(1)).min(1),
      additive_material: z.array(z.string().min(1)).min(1),
      sharpening_instruction: z.string().min(1),
    }),
  }),
  sparse_fallback: z.object({
    known: z.string().min(1),
    unknown: z.string().min(1),
    next_move: z.string().min(1),
  }),
}).superRefine((fixture, context) => {
  const sourceIds = new Set(fixture.sources.map((source) => source.id))
  const allRefs = [
    ...fixture.decision.routes.flatMap((route) => [...route.evidence_for, ...route.evidence_against]),
    ...fixture.current_read.source_refs,
    ...fixture.current_read.counter_source_refs,
    ...fixture.personal_portrait.patterns.flatMap((pattern) => pattern.source_refs),
    ...fixture.standards.flatMap((standard) => standard.source_refs),
    ...fixture.recommended_move.source_refs,
  ].filter((reference) => reference.startsWith('SRC-'))

  for (const reference of allRefs) {
    if (!sourceIds.has(reference)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Missing source ${reference}` })
    }
  }

  const routeIds = new Set(fixture.decision.routes.map((route) => route.id))
  if (routeIds.size !== 3 || !routeIds.has(fixture.decision_sharpening.default_route)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Route identities or default route are invalid' })
  }

  if (!fixture.sources.some((source) => source.audience === 'operator_private')) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Operator-private evidence boundary is missing' })
  }
})

export function readDecisionBenchFixture(): DecisionBenchFixture {
  return decisionBenchFixtureSchema.parse(JSON.parse(fixtureText))
}

export const decisionBenchFixture = readDecisionBenchFixture()

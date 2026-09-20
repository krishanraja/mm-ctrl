import type {
  AuditFinding,
  ChallengeQuestion,
  DecisionBenchFixture,
  RouteId,
  RoutePresentation,
  SharpeningInput,
} from './contract'

export const routePresentations: Record<RouteId, RoutePresentation> = {
  'ROUTE-A': {
    id: 'ROUTE-A',
    tabLabel: 'Rebuild now',
    title: 'Rebuild the function this quarter.',
    summary: 'A small AI-native team replaces the current production model and learns through immediate responsibility.',
    personal: 'Fits your appetite to move.',
    detail: 'It risks automating output before your way of judging quality can travel.',
    support: '41% of recorded time sits in routine content work. Nine of twelve AI variants repeated the same category frame.',
    oppose: 'Judgement transfer has not survived unfamiliar work. The board expects staged commitments.',
    counter: 'The old structure may absorb any pilot. A clean break could be the only way to expose the real roles.',
    question: 'Is speed worth an unproved quality system?',
    effect: 'Choose this only if structural learning matters more than containing the first mistake.',
  },
  'ROUTE-B': {
    id: 'ROUTE-B',
    tabLabel: 'Prove the system first',
    title: 'Prove the new system on one important campaign.',
    summary: 'A separate AI-native route competes blind against the current process before roles are redesigned.',
    personal: 'Uses how you judge best.',
    detail: 'Concrete comparison makes your standards precise while protecting surprise and final accountability.',
    support: 'Customer recall, the work audit, your corrected delegation view and the broken scorecard all point here.',
    oppose: 'A pilot can become theatre if it keeps the current measures or has no authority to work differently.',
    counter: 'The volume incentives may be more causal than judgement transfer. The test must change both or it proves little.',
    question: 'What result would earn the larger rebuild?',
    effect: 'Name the customer proof, human judgement and kill condition before choosing people or tools.',
  },
  'ROUTE-C': {
    id: 'ROUTE-C',
    tabLabel: 'Add tools gradually',
    title: 'Keep the team and add tools role by role.',
    summary: 'Each person adopts AI inside the current job while the organisation learns with minimal disruption.',
    personal: 'Conflicts with your current diagnosis.',
    detail: 'You believe the weekly work and measures are wrong, not only that people lack access to tools.',
    support: 'It is the easiest story internally and creates the least immediate disruption.',
    oppose: 'The workshop produced 43 use cases but no shared priorities. Current measures reward volume and deadlines.',
    counter: 'Distributed adoption may surface unexpected high-agency builders without prematurely redesigning roles.',
    question: 'Can the old measures produce a new system?',
    effect: 'Choose this only if adoption evidence matters more than changing the work itself.',
  },
}

const challengeSets: Record<RouteId, ChallengeQuestion[]> = {
  'ROUTE-A': [
    {
      kind: 'YOU CAN ANSWER',
      question: 'What would make you regret rebuilding the team this quickly?',
      why: 'Pick the risk that matters most. The Brain will turn it into a limit for the first move.',
      effect: 'The first move must make this risk easy to stop or reverse.',
      mode: 'answer',
      choices: ['Customer work gets worse', 'The best people leave', 'Maya still fixes everything', 'Costs rise before we learn', 'Something else'],
      source: "Raised from the board note and Maya's final-accountability standard.",
    },
    {
      kind: 'THE BRAIN CAN CHECK',
      question: 'Before changing any role, what should the Brain check first?',
      why: 'You do not need to know this already. Pick one and the Brain can look through the work.',
      effect: 'The answer could change which roles stay, change or lead the rebuild.',
      mode: 'find',
      choices: ['Who improves customer results', 'Who spots weak ideas early', 'Which work AI already does well', 'Which measures cause the problem'],
      source: 'Raised from the work audit, campaign review and customer evidence.',
    },
    {
      kind: 'A SIMILAR DECISION',
      question: 'Last time the team changed but the measures did not. What changes first this time?',
      why: 'An earlier synthetic decision shows that new roles alone did not change the work.',
      effect: 'If the measures stay the same, a new team may repeat the old behaviour.',
      mode: 'history',
      choices: ['The measures', 'Who owns final quality', 'The work process', 'The customer goal', 'Something else'],
      source: 'Matched to synthetic decision DEC-MAYA-014.',
    },
  ],
  'ROUTE-B': [],
  'ROUTE-C': [
    {
      kind: 'YOU CAN ANSWER',
      question: 'What could gradual AI use teach you that the workshop did not?',
      why: 'Pick the one thing you need to learn before making a bigger change.',
      effect: 'Without one clear learning goal, gradual use may create activity without answering the decision.',
      mode: 'answer',
      choices: ['Which work matters', 'Who learns fastest', 'What customers value', 'Which roles should change', 'Something else'],
      source: "Raised from the team workshop and Maya's current view.",
    },
    {
      kind: 'THE BRAIN CAN CHECK',
      question: 'What should the Brain look for in the current team?',
      why: 'Pick the proof that would make gradual change worth considering.',
      effect: 'The answer could show whether the current team can build the new way of working.',
      mode: 'find',
      choices: ['Better customer results', 'Less final fixing by Maya', 'Stronger ideas', 'Safer, faster work'],
      source: 'Raised from the campaign review, customer evidence and scorecard gap.',
    },
    {
      kind: 'A SIMILAR DECISION',
      question: 'The team found 43 possible AI uses but chose none. Who chooses the first three this time?',
      why: 'This comes from a synthetic earlier workshop. It shows the old process did not set a priority.',
      effect: 'Without one clear owner, the team may create more ideas without changing the work.',
      mode: 'history',
      choices: ['Maya', 'One named leader', 'Customer evidence', 'A small team vote', 'Something else'],
      source: 'Matched to the synthetic team workshop and strategy draft.',
    },
  ],
}

const questionKindLabel = {
  leader_can_answer: 'YOU CAN ANSWER',
  brain_can_find: 'THE BRAIN CAN CHECK',
  prior_decision_match: 'A SIMILAR DECISION',
} as const

const questionMode = {
  leader_can_answer: 'answer',
  brain_can_find: 'find',
  prior_decision_match: 'history',
} as const

export function getChallengeSet(fixture: DecisionBenchFixture, routeId: RouteId): ChallengeQuestion[] {
  if (routeId !== fixture.decision_sharpening.default_route) return challengeSets[routeId]

  return fixture.decision_sharpening.default_route_questions.map((question) => ({
    kind: questionKindLabel[question.kind],
    question: question.question,
    why: question.why_it_matters,
    effect: question.decision_effect,
    mode: questionMode[question.kind],
    choices: question.choices,
    source: question.prior_decision_ref
      ? `Matched to synthetic decision ${question.prior_decision_ref}.`
      : `Raised from ${question.source_refs?.length ?? 0} linked synthetic sources.`,
  }))
}

function joinNumbered(lines: string[]): string {
  return lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
}

function joinBullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n')
}

function sourceAssertion(fixture: DecisionBenchFixture, id: string): string {
  const source = fixture.sources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Missing source ${id}`)
  return `${source.label}: ${source.assertion}`
}

export function buildClaudeBrief(
  fixture: DecisionBenchFixture,
  inputs: SharpeningInput[] = [],
  killCondition = 'Stop if the new route produces more material but still needs Maya to rescue the central idea.',
): string {
  const routes = fixture.decision.routes.map((route, index) => {
    const letter = String.fromCharCode(65 + index)
    return `${letter}. ${route.name}: ${route.plain_summary} Upside: ${route.upside} Risk: ${route.risk}`
  })
  const evidenceIds = ['SRC-203', 'SRC-205', 'SRC-207', 'SRC-208', 'SRC-211', 'SRC-209']
  const correction = fixture.corrections[0]
  const humanStandard = fixture.standards.find((standard) => standard.id === 'STD-205')
  const base = [
    `You are helping ${fixture.subject.display_name}, the synthetic ${fixture.subject.role.toLowerCase()} of ${fixture.subject.organisation}, think through a consequential operating-model decision. ${fixture.disclosure}`,
    '',
    'DECISION',
    `${fixture.decision.title} ${fixture.decision.stakes}`,
    '',
    "MAYA'S CURRENT VIEW",
    fixture.decision.provisional_view,
    '',
    'SUPPORTED BRAIN READ',
    `${fixture.current_read.plain_summary} Strongest counter-case: ${fixture.current_read.counter_case}`,
    '',
    'HOW MAYA JUDGES',
    joinNumbered([
      ...fixture.personal_portrait.patterns
        .filter((pattern) => pattern.id !== 'PAT-204')
        .map((pattern) => pattern.statement),
      `${correction.to} This replaced: ${correction.from}`,
      humanStandard?.test ?? 'A named human remains accountable for final consequential release.',
    ]),
    '',
    'THREE ROUTES',
    routes.join('\n'),
    '',
    'IMPORTANT SYNTHETIC EVIDENCE',
    joinBullets(evidenceIds.map((id) => sourceAssertion(fixture, id))),
    '',
    'UNKNOWNS',
    joinBullets(fixture.unknowns.map((unknown) => unknown.question)),
    '',
    'CURRENT TEST LIMIT',
    killCondition,
    '',
    'DO NOT ASSUME',
    joinBullets(fixture.claude_handoff.forbidden_assumptions),
    '',
    'YOUR TASK',
    fixture.claude_handoff.desired_output,
    joinBullets(fixture.claude_handoff.output_shape),
  ].join('\n')

  if (inputs.length === 0) return base

  const additions = inputs.map((input, index) => (
    `${index + 1}. ${input.standing}\nQuestion: ${input.question}\nInput: ${input.input}`
  )).join('\n\n')

  return `${base}\n\nNEW DECISION-SHARPENING INPUTS\n${additions}\n\nTreat leader answers as direct input, pending evidence tasks as unknown, and prior-decision matches as prompts for scrutiny rather than proof.`
}

export function getAuditFindings(fixture: DecisionBenchFixture): AuditFinding[] {
  const audit = fixture.returned_claude_example.brain_audit
  return [
    {
      title: 'This does not choose a real operating model.',
      body: audit.generic_reasoning[0],
      reference: `Conflicts with: ${fixture.standards[0].name}.`,
    },
    {
      title: 'Efficiency has replaced the actual goal.',
      body: audit.generic_reasoning[1],
      reference: 'Evidence: campaign review and two-week work audit.',
    },
    {
      title: 'The human owner is missing.',
      body: audit.standard_conflicts[2],
      reference: `Conflicts with: ${fixture.standards[4].name}.`,
    },
    {
      title: 'These measures repeat the problem.',
      body: audit.standard_conflicts[1],
      reference: 'Evidence: current marketing scorecard.',
    },
    {
      title: 'Keep this part.',
      body: audit.additive_material[0],
      reference: 'Supported by: synthetic board planning note.',
      keep: true,
    },
  ]
}

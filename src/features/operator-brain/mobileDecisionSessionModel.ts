import type { BrainSource, DecisionBenchFixture, RouteId, SharpeningInput } from './contract'
import { routePresentations } from './decisionBenchModel'

export type MobileDecisionDataState = 'ready' | 'sparse' | 'stale' | 'conflicted' | 'loading' | 'error'
export type MobileDecisionOutcome = 'holds' | 'narrows' | 'open'

export interface MobileDecisionChoice {
  label: string
  outcome: MobileDecisionOutcome
}

export interface MobileDecisionProjection {
  dataState: MobileDecisionDataState
  status: string
  decision: string
  currentView: string
  condition: string
  question: string
  choices: MobileDecisionChoice[]
  basisTitle: string
  basisSummary: string
  sourceCount: number
  asOf: string
  canAnswer: boolean
  evidence: BrainSource[]
  routes: Array<{ id: RouteId; label: string; summary: string; current: boolean }>
  counterCase: string
  sources: BrainSource[]
}

const defaultChoices: MobileDecisionChoice[] = [
  { label: 'A customer result we can verify', outcome: 'holds' },
  { label: "The team can match Maya's standard", outcome: 'narrows' },
  { label: 'Not known yet', outcome: 'open' },
]

const evidenceIds = ['SRC-205', 'SRC-208', 'SRC-210']

function parseState(value: string | null): MobileDecisionDataState {
  if (value === 'sparse' || value === 'stale' || value === 'conflicted' || value === 'loading' || value === 'error') return value
  return 'ready'
}

function compactDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

function sourceById(fixture: DecisionBenchFixture, id: string): BrainSource {
  const source = fixture.sources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Missing mobile decision source ${id}`)
  return source
}

export function readMobileDecisionState(search: string): MobileDecisionDataState {
  return parseState(new URLSearchParams(search).get('state'))
}

export function buildMobileDecisionProjection(
  fixture: DecisionBenchFixture,
  dataState: MobileDecisionDataState,
): MobileDecisionProjection {
  const linkedSourceIds = new Set([
    ...fixture.current_read.source_refs,
    ...fixture.current_read.counter_source_refs,
  ])

  const base = {
    decision: 'Should Aperture rebuild marketing around AI?',
    currentView: 'Prove the system with one customer result before rebuilding the whole function.',
    condition: "Holds if the pilot preserves Maya's quality standard without her final rescue.",
    question: 'What result would make this safe to scale?',
    choices: defaultChoices,
    canAnswer: true,
  }

  const stateCopy: Record<MobileDecisionDataState, Pick<MobileDecisionProjection, 'status' | 'currentView' | 'condition' | 'question' | 'choices' | 'canAnswer'>> = {
    ready: { status: 'Provisional', ...base },
    sparse: {
      status: 'Needs evidence',
      currentView: 'There is not enough evidence to recommend a rebuild yet.',
      condition: 'The Brain needs one customer result and one transferable quality signal.',
      question: 'Which proof can be established first?',
      choices: defaultChoices,
      canAnswer: true,
    },
    stale: {
      status: 'Stale',
      currentView: 'The previous recommendation is paused.',
      condition: `Evidence was last checked ${compactDate(fixture.as_of)}. Refresh it before the decision moves.`,
      question: 'Which evidence should be refreshed first?',
      choices: [
        { label: 'The latest customer result', outcome: 'holds' },
        { label: "Maya's most recent final rewrite", outcome: 'narrows' },
        { label: 'The current team measures', outcome: 'open' },
      ],
      canAnswer: true,
    },
    conflicted: {
      status: 'Evidence disagrees',
      currentView: 'Do not rebuild the whole function yet.',
      condition: 'Speed improved, but the strongest quality evidence still points in two directions.',
      question: 'Which conflict matters most to resolve?',
      choices: [
        { label: 'Customer value versus output volume', outcome: 'holds' },
        { label: "Team quality versus Maya's rescue", outcome: 'narrows' },
        { label: 'Not clear yet', outcome: 'open' },
      ],
      canAnswer: true,
    },
    loading: {
      status: 'Updating',
      currentView: base.currentView,
      condition: 'New evidence is being checked. The previous view stays visible until that finishes.',
      question: 'Checking what changed',
      choices: [],
      canAnswer: false,
    },
    error: {
      status: 'Update failed',
      currentView: base.currentView,
      condition: 'The previous view is preserved. No answer or decision has been lost.',
      question: 'Try the update again when the connection returns.',
      choices: [],
      canAnswer: false,
    },
  }

  const selected = stateCopy[dataState]
  const basisCopy: Record<MobileDecisionDataState, { title: string; summary: string }> = {
    ready: {
      title: 'The system is promising. Its quality still depends on Maya.',
      summary: 'Evidence, routes and the strongest case against the recommendation.',
    },
    sparse: {
      title: 'There is not enough evidence to recommend a rebuild.',
      summary: 'The sources below explain the gap. They do not yet establish the missing customer result or transferable quality signal.',
    },
    stale: {
      title: 'The recommendation is paused until its evidence is refreshed.',
      summary: `The sources below were last checked ${compactDate(fixture.as_of)}. They remain history, not a current recommendation.`,
    },
    conflicted: {
      title: 'The evidence does not support one confident route yet.',
      summary: 'Speed improved, but the quality evidence disagrees. The routes remain options until that conflict is resolved.',
    },
    loading: {
      title: 'New evidence is being checked.',
      summary: 'The previous view remains visible below. It has not been promoted or replaced while the update is running.',
    },
    error: {
      title: 'The update failed. The previous view is preserved.',
      summary: 'No new recommendation has been made and no answer or decision has been lost.',
    },
  }

  return {
    dataState,
    status: selected.status,
    decision: base.decision,
    currentView: selected.currentView,
    condition: selected.condition,
    question: selected.question,
    choices: selected.choices,
    basisTitle: basisCopy[dataState].title,
    basisSummary: basisCopy[dataState].summary,
    sourceCount: linkedSourceIds.size,
    asOf: compactDate(fixture.as_of),
    canAnswer: selected.canAnswer,
    evidence: evidenceIds.map((id) => sourceById(fixture, id)),
    routes: fixture.decision.routes.map((route) => ({
      id: route.id,
      label: routePresentations[route.id].tabLabel,
      summary: route.plain_summary,
      current: dataState === 'ready' && route.id === fixture.decision_sharpening.default_route,
    })),
    counterCase: fixture.current_read.counter_case,
    sources: fixture.sources.filter((source) => linkedSourceIds.has(source.id)),
  }
}

export function mobileAnswerInput(question: string, answer: string): SharpeningInput {
  return {
    standing: 'LEADER ANSWER',
    question,
    input: answer,
  }
}

export function mobileOutcomeCopy(dataState: MobileDecisionDataState, outcome: MobileDecisionOutcome): { title: string; explanation: string } {
  if (dataState === 'sparse') {
    return {
      title: 'Evidence target set',
      explanation: 'This identifies what to establish next. It does not supply the missing evidence or remove the provisional standing.',
    }
  }
  if (dataState === 'stale') {
    return {
      title: 'Refresh target set',
      explanation: 'The recommendation remains paused until this evidence is refreshed and checked.',
    }
  }
  if (dataState === 'conflicted') {
    return {
      title: 'Conflict to resolve',
      explanation: 'The recommendation remains qualified until this disagreement is resolved with evidence.',
    }
  }
  if (outcome === 'holds') {
    return {
      title: 'Recommendation holds',
      explanation: 'A verified customer result supplies the proof the current view needs.',
    }
  }
  if (outcome === 'narrows') {
    return {
      title: 'Recommendation narrows',
      explanation: "The pilot must now prove the team can meet Maya's standard without her final rewrite.",
    }
  }
  return {
    title: 'Still provisional',
    explanation: 'Define the proof before changing people or tools.',
  }
}

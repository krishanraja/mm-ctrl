import type { OperatorPendingQueue } from '@/features/standard-review/operatorPendingQueue'

const common = {
  schema: 'ctrl.standard-change.operator-pending-review.v1',
  decision_authority_granted: false,
  active_standard_mutated: false,
  notification_sent: false,
} as const

const copy = {
  ready: {
    question: 'Should strong proposals move when the customer proof and three agreed quality checks are present?',
    headline: 'Maya’s team may no longer need her final rewrite.',
    consequence: 'Routine proposals can move without waiting for her. High-stakes proposals still come to her.',
  },
  long: {
    question: 'Should strong customer-facing proposals move without Maya’s final rewrite when the named buyer proof, the comparison against the existing route and all three agreed quality checks are already present?',
    headline: 'Maya may be protecting quality by correcting work too late instead of teaching the team to recognise the proof she uses before a proposal reaches her.',
    consequence: 'If Maya agrees, routine proposals can move without waiting for her once the named buyer proof, the route comparison and all three quality checks are visible. High-stakes, novel or brand-defining proposals still come to her.',
  },
} as const

export type OperatorReviewFixtureState = 'ready' | 'long' | 'empty' | 'unavailable'

export function readOperatorReviewFixture(): OperatorPendingQueue {
  const requested = new URLSearchParams(window.location.search).get('review')
  const state: OperatorReviewFixtureState = requested === 'ready' || requested === 'long' || requested === 'empty' || requested === 'unavailable'
    ? requested
    : 'unavailable'

  if (state === 'empty' || state === 'unavailable') {
    return {
      ...common,
      available: false,
      reason: 'not_available',
      ready_count: 0,
      next: null,
    }
  }

  return {
    ...common,
    available: true,
    ready_count: 1,
    next: {
      review_packet_id: '6913dca4-e613-4fa3-8c63-0b7a03c03132',
      ...copy[state],
      ready_since: '2026-09-20T09:00:00.000Z',
    },
    selection: {
      method: 'oldest_ready_first',
      materiality_inferred: false,
    },
  }
}

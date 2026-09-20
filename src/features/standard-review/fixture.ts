export const standardReviewPreparedFixture = {
  action: 'prepare' as const,
  result: {
    review_packet_id: '11111111-1111-4111-8111-111111111111',
    review_packet_sha256: 'a'.repeat(64),
    planned_standard_sha256: 'b'.repeat(64),
    state: 'ready' as const,
    active_standard_mutated: false as const,
    deploy_authorized: false as const,
    release_authorized: false as const,
    packet: {
      schema: 'ctrl.standard-change.owner-review.v1' as const,
      presentation: {
        schema: 'ctrl.standard-change.owner-review.presentation.v1' as const,
        question: 'Should this be your proposal rule?',
        headline: 'Two strong proposals waited for a review that changed nothing.',
        current_rule: 'Review every customer-facing proposal.',
        proposed_rule: 'Review proposals above £250,000 or changes to the company promise.',
        consequence: 'Routine proposals move once the result, evidence and owner are named.',
        risk_if_wrong: 'A lower-value proposal could still carry material brand risk.',
        validation: 'Inspect the next five proposals and every exception.',
        alternative_explanations: ['The team may be applying the current rule inconsistently.'],
        evidence: [
          {
            source_id: 'review-1',
            label: 'Renewal proposal review',
            statement: 'A £90,000 renewal proposal waited 36 hours and needed no substantive change.',
            occurred_at: '2026-09-17T09:00:00+00:00',
            relationship: 'supports' as const,
          },
          {
            source_id: 'review-2',
            label: 'Expansion proposal review',
            statement: 'A £120,000 expansion proposal waited a day and needed no substantive change.',
            occurred_at: '2026-09-18T09:00:00+00:00',
            relationship: 'supports' as const,
          },
        ],
      },
      consequences: {
        new_active_standard_version: true as const,
        reversible_while_current_head: true as const,
        deploy_authorized: false as const,
        release_authorized: false as const,
      },
    },
  },
}

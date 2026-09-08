import { describe, expect, it } from 'vitest'
import { decisionBenchFixture, readDecisionBenchFixture } from './fixtureDecisionBenchAdapter'

describe('Decision Bench fixture adapter', () => {
  it('accepts only the locked synthetic route identity', () => {
    const fixture = readDecisionBenchFixture()
    expect(fixture.fixture_status).toBe('synthetic_demo')
    expect(fixture.customer.id).toBe('SYN-CUST-014')
    expect(fixture.intervention.id).toBe('INT-014')
  })

  it('keeps exact evidence and typed relationships addressable', () => {
    expect(decisionBenchFixture.sources.find((source) => source.id === 'SRC-105')?.assertion).toBe(
      "I don't need the team to imitate me. I need them to notice what I notice before I have to fix it.",
    )
    expect(decisionBenchFixture.relationships.find((relationship) => relationship.id === 'REL-101')?.type).toBe('supports')
  })
})

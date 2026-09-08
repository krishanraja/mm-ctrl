import fixtureText from '../../../project-documentation/ctrl-evolution/design/g14-private-brain-builder-fixture.json?raw'
import type { DecisionBenchFixture } from './contract'

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not a record`)
  }
}

export function readDecisionBenchFixture(): DecisionBenchFixture {
  const parsed: unknown = JSON.parse(fixtureText)
  assertRecord(parsed, 'Decision Bench fixture')
  assertRecord(parsed.customer, 'Decision Bench customer')
  assertRecord(parsed.intervention, 'Decision Bench intervention')

  if (parsed.fixture_status !== 'synthetic_demo') {
    throw new Error('Decision Bench route accepts synthetic fixtures only')
  }
  if (parsed.customer.id !== 'SYN-CUST-014' || parsed.intervention.id !== 'INT-014') {
    throw new Error('Decision Bench fixture identity does not match the locked route')
  }
  if (!Array.isArray(parsed.sources) || !Array.isArray(parsed.brain_items) || !Array.isArray(parsed.relationships)) {
    throw new Error('Decision Bench fixture is missing its evidence graph')
  }

  return parsed as unknown as DecisionBenchFixture
}

export const decisionBenchFixture = readDecisionBenchFixture()

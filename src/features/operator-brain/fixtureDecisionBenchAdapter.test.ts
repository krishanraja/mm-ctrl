import { describe, expect, it } from 'vitest'
import { buildClaudeBrief, getChallengeSet } from './decisionBenchModel'
import { decisionBenchFixture, readDecisionBenchFixture } from './fixtureDecisionBenchAdapter'

describe('Decision Table R4 fixture adapter', () => {
  it('accepts only the locked synthetic identity and R4 contract', () => {
    const fixture = readDecisionBenchFixture()
    expect(fixture.fixture_version).toBe('4.0.0')
    expect(fixture.fixture_status).toBe('synthetic_demo')
    expect(fixture.subject.id).toBe('SYN-CUST-014')
    expect(fixture.decision.id).toBe('DEC-MAYA-021')
    expect(fixture.decision.routes.map((route) => route.id)).toEqual(['ROUTE-A', 'ROUTE-B', 'ROUTE-C'])
    expect(fixture.decision_sharpening.default_route).toBe('ROUTE-B')
  })

  it('keeps all referenced evidence addressable and audience-typed', () => {
    const sourceIds = new Set(decisionBenchFixture.sources.map((source) => source.id))
    const routeRefs = decisionBenchFixture.decision.routes.flatMap((route) => [
      ...route.evidence_for,
      ...route.evidence_against,
    ])

    expect(routeRefs.every((reference) => sourceIds.has(reference))).toBe(true)
    expect(decisionBenchFixture.sources.find((source) => source.id === 'SRC-204')?.audience).toBe('operator_private')
    expect(decisionBenchFixture.sources.filter((source) => source.audience === 'operator_private')).toHaveLength(1)
  })

  it('builds the complete handoff without opaque references', () => {
    const brief = buildClaudeBrief(decisionBenchFixture, [{
      standing: 'LEADER ANSWER',
      question: 'Before work goes out, what do you usually fix first?',
      input: 'The proof',
    }])

    expect(brief).toContain('DECISION')
    expect(brief).toContain("MAYA'S CURRENT VIEW")
    expect(brief).toContain('HOW MAYA JUDGES')
    expect(brief).toContain('IMPORTANT SYNTHETIC EVIDENCE')
    expect(brief).toContain('NEW DECISION-SHARPENING INPUTS')
    expect(brief).toContain('LEADER ANSWER')
    expect(brief).not.toMatch(/CX-MAYA|capsule|reference [A-Z]{2}-/i)
  })

  it('keeps the deeper layer to one contextual question at a time', () => {
    const questions = getChallengeSet(decisionBenchFixture, 'ROUTE-B')
    expect(questions).toHaveLength(3)
    expect(questions[0].question).toBe('Before work goes out, what do you usually fix first?')
    expect(questions[1].mode).toBe('find')
    expect(questions[2].mode).toBe('history')
  })
})

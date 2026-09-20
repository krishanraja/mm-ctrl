import { describe, expect, it } from 'vitest'
import { COUNCIL_JUDGES, buildTheoryPack } from './rangeCouncilContract'
import { G21_COUNCIL_CRITERIA, validateG21CouncilCriteria } from './g21CouncilCriteria'

describe('G21 council criteria', () => {
  it('assigns one versioned criterion and at least one hard veto rule to every judge', () => {
    expect(validateG21CouncilCriteria()).toEqual([])
    expect(G21_COUNCIL_CRITERIA.map((criterion) => criterion.judge)).toEqual(COUNCIL_JUDGES)
    for (const criterion of G21_COUNCIL_CRITERIA) {
      expect(criterion.criterionVersion).toContain('g21-v1')
      expect(criterion.hardVetoRules.length).toBeGreaterThan(0)
    }
  })

  it('routes no more than eight optional theory cards to each first-pass judge', () => {
    for (const criterion of G21_COUNCIL_CRITERIA) {
      const pack = buildTheoryPack(criterion.theoryTriggers)
      expect(pack.optional.length).toBeLessThanOrEqual(8)
      expect(pack.splitRequired).toBe(false)
    }
  })
})

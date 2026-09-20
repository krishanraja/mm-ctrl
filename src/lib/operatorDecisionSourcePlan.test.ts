import { describe, expect, it } from 'vitest'
import {
  assessOperatorDecisionSources,
  operatorDecisionSourcePlan,
  type ProjectionSourceSlice,
} from './operatorDecisionSourcePlan'

describe('operator decision source plan', () => {
  it('keeps the complete projection closed on the live isolated catalogue', () => {
    const result = assessOperatorDecisionSources()

    expect(result.ready).toBe(false)
    expect(result.blockers).toHaveLength(8)
    expect(result.blockers.some((item) => item.includes('decision:target_missing'))).toBe(true)
    expect(result.blockers.some((item) => item.includes('priorDecisions:derived_blocked'))).toBe(true)
    expect(result.blockers.some((item) => item.includes('claudeHandoff:derived_blocked'))).toBe(true)
  })

  it('names every forbidden authority shortcut', () => {
    const result = assessOperatorDecisionSources()

    expect(result.prohibitedShortcuts).toContain(
      'decision:public.decision_cases inferred into a workspace from user_id',
    )
    expect(result.prohibitedShortcuts).toContain('leader:auth user metadata')
    expect(result.prohibitedShortcuts).toContain('reviewSignal:same workspace treated as same decision')
    expect(result.prohibitedShortcuts).toContain('claudeHandoff:thin prompt')
  })

  it('does not mistake partial canonical material for a ready projection', () => {
    const result = assessOperatorDecisionSources({
      evidence: operatorDecisionSourcePlan.evidence,
      portraitAndStandards: operatorDecisionSourcePlan.portraitAndStandards,
    })

    expect(result.ready).toBe(false)
    expect(result.blockers[0]).toContain('evidence:canonical_partial')
    expect(result.blockers[1]).toContain('portraitAndStandards:canonical_partial')
  })

  it('admits a projection only when every required slice is canonical', () => {
    const complete = Object.fromEntries(
      Object.entries(operatorDecisionSourcePlan).map(([name, slice]) => [
        name,
        slice.state === 'optional_absent'
          ? slice
          : ({ ...slice, state: 'canonical_available', requiredNext: [] } satisfies ProjectionSourceSlice),
      ]),
    )

    expect(assessOperatorDecisionSources(complete).ready).toBe(true)
  })

  it('preserves optional absence without inventing returned work', () => {
    const result = assessOperatorDecisionSources({ returnedWork: operatorDecisionSourcePlan.returnedWork })

    expect(result.ready).toBe(true)
    expect(result.blockers).toEqual([])
  })
})

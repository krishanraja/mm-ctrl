import { describe, expect, it } from 'vitest'
import { decisionBenchFixture } from './fixtureDecisionBenchAdapter'
import {
  buildMobileDecisionProjection,
  mobileAnswerInput,
  mobileOutcomeCopy,
  readMobileDecisionState,
} from './mobileDecisionSessionModel'

describe('mobile decision session projection', () => {
  it('keeps one ready-state question and derives its evidence count', () => {
    const projection = buildMobileDecisionProjection(decisionBenchFixture, 'ready')

    expect(projection.decision).toBe('Should Aperture rebuild marketing around AI?')
    expect(projection.question).toBe('What result would make this safe to scale?')
    expect(projection.choices).toHaveLength(3)
    expect(projection.sourceCount).toBe(7)
    expect(projection.sources).toHaveLength(7)
    expect(projection.routes.filter((route) => route.current).map((route) => route.id)).toEqual(['ROUTE-B'])
  })

  it('suppresses false certainty for sparse, stale, conflicted, loading and error states', () => {
    const projections = ['sparse', 'stale', 'conflicted', 'loading', 'error'].map((state) => (
      buildMobileDecisionProjection(decisionBenchFixture, state as 'sparse' | 'stale' | 'conflicted' | 'loading' | 'error')
    ))

    expect(projections.map((projection) => projection.status)).toEqual([
      'Needs evidence',
      'Stale',
      'Evidence disagrees',
      'Updating',
      'Update failed',
    ])
    expect(projections[0].currentView).toContain('not enough evidence')
    expect(projections[1].currentView).toContain('paused')
    expect(projections[1].basisTitle).toContain('paused')
    expect(projections.slice(0, 3).every((projection) => projection.routes.every((route) => !route.current))).toBe(true)
    expect(projections[2].condition).toContain('two directions')
    expect(projections[3].canAnswer).toBe(false)
    expect(projections[4].condition).toContain('No answer or decision has been lost')
  })

  it('treats unknown query states as ready', () => {
    expect(readMobileDecisionState('?state=stale')).toBe('stale')
    expect(readMobileDecisionState('?state=wrong')).toBe('ready')
    expect(readMobileDecisionState('')).toBe('ready')
  })

  it('keeps an answer separate from the human call', () => {
    expect(mobileAnswerInput('What result?', 'Customer proof')).toEqual({
      standing: 'LEADER ANSWER',
      question: 'What result?',
      input: 'Customer proof',
    })
    expect(mobileOutcomeCopy('ready', 'holds').title).toBe('Recommendation holds')
    expect(mobileOutcomeCopy('ready', 'narrows').title).toBe('Recommendation narrows')
    expect(mobileOutcomeCopy('ready', 'open').title).toBe('Still provisional')
    expect(mobileOutcomeCopy('sparse', 'holds').title).toBe('Evidence target set')
    expect(mobileOutcomeCopy('stale', 'holds').title).toBe('Refresh target set')
    expect(mobileOutcomeCopy('conflicted', 'holds').title).toBe('Conflict to resolve')
  })
})

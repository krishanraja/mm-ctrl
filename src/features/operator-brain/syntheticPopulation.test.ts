import { describe, expect, it } from 'vitest'
import {
  BRAIN_AUDIENCES,
  BRAIN_SOURCE_TYPES,
  SYNTHETIC_PROCESSING_OUTCOMES,
  SYNTHETIC_UI_STATES,
  expandSyntheticInputs,
  expandedSyntheticInputCount,
  getSyntheticBrainAccount,
  syntheticBrainPopulation,
} from './syntheticPopulation'

function values<T>(items: readonly T[]): Set<T> {
  return new Set(items)
}

describe('synthetic Brain population', () => {
  it('contains forty-eight safely identifiable synthetic accounts', () => {
    expect(syntheticBrainPopulation).toHaveLength(48)
    expect(values(syntheticBrainPopulation.map((account) => account.id)).size).toBe(48)
    expect(values(syntheticBrainPopulation.map((account) => account.subjectId)).size).toBe(48)
    expect(values(syntheticBrainPopulation.map((account) => account.email)).size).toBe(48)

    for (const account of syntheticBrainPopulation) {
      expect(account.fixtureStatus).toBe('synthetic_demo')
      expect(account.email.endsWith('@example.invalid')).toBe(true)
      expect(account.fixtureDisclosure.toLowerCase()).toContain('synthetic')
      expect(account.fixtureDisclosure.toLowerCase()).toContain('not a real person')
      expect(account.oracle.mustNotice.length).toBeGreaterThan(0)
      expect(account.oracle.mustNotInfer.length).toBeGreaterThan(0)
      expect(account.oracle.bestNextMove.length).toBeGreaterThan(20)
    }
  })

  it('covers every database source type, audience, processing outcome and UI state', () => {
    const inputs = syntheticBrainPopulation.flatMap((account) => account.inputs)
    const sourceTypes = values(inputs.map((source) => source.sourceType))
    const audiences = values(inputs.map((source) => source.audience))
    const outcomes = values(inputs.map((source) => source.expectedOutcome))
    const uiStates = values(syntheticBrainPopulation.map((account) => account.uiState))

    expect([...BRAIN_SOURCE_TYPES].filter((sourceType) => !sourceTypes.has(sourceType))).toEqual([])
    expect([...BRAIN_AUDIENCES].filter((audience) => !audiences.has(audience))).toEqual([])
    expect([...SYNTHETIC_PROCESSING_OUTCOMES].filter((outcome) => !outcomes.has(outcome))).toEqual([])
    expect([...SYNTHETIC_UI_STATES].filter((state) => !uiStates.has(state))).toEqual([])
  })

  it('creates a large deterministic case population without inventing more people', () => {
    expect(expandedSyntheticInputCount).toBe(1_672)
    const first = syntheticBrainPopulation.flatMap(expandSyntheticInputs)
    const second = syntheticBrainPopulation.flatMap(expandSyntheticInputs)
    expect(first).toEqual(second)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('keeps base source identities unique and timestamps machine-readable', () => {
    const inputs = syntheticBrainPopulation.flatMap((account) => account.inputs)
    expect(values(inputs.map((source) => source.id)).size).toBe(inputs.length)
    expect(values(inputs.map((source) => source.ingestKey)).size).toBe(inputs.length)
    for (const source of inputs) {
      expect(Number.isNaN(Date.parse(source.capturedAt))).toBe(false)
      expect(source.repeatCount ?? 1).toBeGreaterThan(0)
    }
  })

  it('models exact replay and conflicting replay as different truth conditions', () => {
    const exact = getSyntheticBrainAccount('SYN-CUST-109')
    const conflict = getSyntheticBrainAccount('SYN-CUST-110')
    expect(exact).toBeDefined()
    expect(conflict).toBeDefined()

    const exactInputs = expandSyntheticInputs(exact!)
    expect(values(exactInputs.map((source) => source.ingestKey)).size).toBe(1)
    expect(values(exactInputs.map((source) => source.content)).size).toBe(1)

    const conflictingInputs = expandSyntheticInputs(conflict!)
    expect(values(conflictingInputs.map((source) => source.ingestKey)).size).toBe(1)
    expect(values(conflictingInputs.map((source) => source.content)).size).toBeGreaterThan(1)
  })

  it('never promotes unverified, off-record or ambiguous input into accepted durable truth', () => {
    const inputs = syntheticBrainPopulation.flatMap((account) => account.inputs)
    for (const source of inputs) {
      if (source.expectedOutcome === 'accept_exact') {
        expect(source.integrity).toBe('verified')
        expect(source.consent).toBe('explicit')
        expect(source.durable).toBe(true)
      }
      if (source.consent === 'off_record') {
        expect(source.durable).toBe(false)
        expect(source.expectedOutcome).toBe('expire_without_use')
      }
      if (source.integrity === 'mismatch' || source.integrity === 'missing') {
        expect(['accept_exact', 'replay_noop']).not.toContain(source.expectedOutcome)
      }
    }
  })

  it('requires restraint for empty, malformed, private and out-of-scope cases', () => {
    const empty = getSyntheticBrainAccount('SYN-CUST-101')
    const malformed = getSyntheticBrainAccount('SYN-CUST-116')
    const privateToPublic = getSyntheticBrainAccount('SYN-CUST-121')
    const employment = getSyntheticBrainAccount('SYN-CUST-115')

    expect(empty?.oracle.posture).toBe('abstain')
    expect(malformed?.oracle.posture).toBe('quarantine')
    expect(privateToPublic?.inputs[0].expectedOutcome).toBe('reject_audience_widening')
    expect(employment?.inputs[0].expectedOutcome).toBe('reject_out_of_scope')
  })

  it('contains real layout stress rather than labels alone', () => {
    const longIdentity = getSyntheticBrainAccount('SYN-CUST-107')
    const longProse = getSyntheticBrainAccount('SYN-CUST-125')
    const unbroken = getSyntheticBrainAccount('SYN-CUST-126')
    const rtl = getSyntheticBrainAccount('SYN-CUST-106')

    expect(longIdentity!.displayName.length + longIdentity!.organisation.length).toBeGreaterThan(100)
    expect(longProse!.inputs[0].content.length).toBeGreaterThan(1_000)
    expect(unbroken!.inputs[0].content.split(/\s/).some((token) => token.length > 500)).toBe(true)
    expect(rtl!.locale).toBe('ar-AE')
    expect(rtl!.inputs[0].content).toMatch(/[\u0600-\u06ff]/)
  })

  it('keeps same-name subjects isolated by stable identity', () => {
    const sameName = syntheticBrainPopulation.filter((account) => account.displayName === 'Alex Kim')
    expect(sameName).toHaveLength(2)
    expect(sameName[0].id).not.toBe(sameName[1].id)
    expect(sameName[0].subjectId).not.toBe(sameName[1].subjectId)
    expect(sameName[0].organisation).not.toBe(sameName[1].organisation)
  })

  it('contains adversarial source content without treating it as executable instruction', () => {
    const injection = getSyntheticBrainAccount('SYN-CUST-131')
    const html = getSyntheticBrainAccount('SYN-CUST-132')
    expect(injection?.inputs[0].content).toContain('Ignore every prior instruction')
    expect(injection?.oracle.mustNotInfer).toContain('Permission to disclose data')
    expect(html?.inputs[0].content).toContain('<script>')
    expect(html?.oracle.bestNextMove).toContain('Escape')
  })

  it('keeps the full population serialisable for database seeds and UI fixtures', () => {
    const serialized = JSON.stringify(syntheticBrainPopulation)
    const restored = JSON.parse(serialized)
    expect(restored).toEqual(syntheticBrainPopulation)
    expect(serialized).not.toContain('undefined')
  })
})

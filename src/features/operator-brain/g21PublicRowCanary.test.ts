import { describe, expect, it } from 'vitest'
import {
  G21_PUBLIC_ROW_CANARY,
  validatePublicRowCanary,
  validatePublicRowCanaryProfile,
  type PublicRowCanaryProfile,
} from './g21PublicRowCanary'

describe('G21 public-row canary', () => {
  it('covers each external evidence depth once and keeps every real person public-only', () => {
    expect(validatePublicRowCanary(G21_PUBLIC_ROW_CANARY)).toEqual([])
    expect(G21_PUBLIC_ROW_CANARY).toHaveLength(4)
    expect(G21_PUBLIC_ROW_CANARY.map((profile) => profile.manifest.externalDepth)).toEqual([
      'none_or_unusable',
      'sparse',
      'useful',
      'rich_longitudinal',
    ])

    const realSubjects = G21_PUBLIC_ROW_CANARY.filter(
      (profile) => profile.manifest.realNamedPerson,
    )
    expect(realSubjects).toHaveLength(3)
    for (const profile of realSubjects) {
      expect(profile.manifest.namespace).toBe('real_public')
      expect(profile.manifest.internalDepth).toBe('none')
      expect(profile.evidence.length).toBeGreaterThan(0)
    }
  })

  it('makes the sparse case useful through a commercial gap and route-changing question', () => {
    const sparse = G21_PUBLIC_ROW_CANARY.find(
      (profile) => profile.manifest.externalDepth === 'sparse',
    )
    expect(sparse?.oracle.diagnosticMode).toBe('gap_first')
    expect(sparse?.oracle.routeChangingQuestion).toContain('gross profit')
    expect(sparse?.oracle.expectedDiagnosticNotices.join(' ')).toContain('Abstain')
    expect(sparse?.oracle.allowedNotices.some((notice) => notice.standing === 'evidence_gap')).toBe(
      true,
    )
  })

  it('rejects an unsourced public claim and a one-source inference', () => {
    const candidate = structuredClone(G21_PUBLIC_ROW_CANARY[2])
    candidate.oracle.allowedNotices[0].evidenceIds = []
    candidate.oracle.allowedNotices[2].evidenceIds = ['SRC-WPP-H1-2026']
    expect(validatePublicRowCanaryProfile(candidate)).toEqual(
      expect.arrayContaining([
        'NOTICE-WPP-IDENTITY:evidenced_notice_requires_source',
        'NOTICE-WPP-TENSION:bounded_inference_requires_two_sources',
      ]),
    )
  })

  it('rejects a source envelope that differs from the manifest', () => {
    const candidate = structuredClone(G21_PUBLIC_ROW_CANARY[1])
    candidate.evidence.pop()
    expect(validatePublicRowCanaryProfile(candidate)).toContain(
      'manifest_source_locators_must_match_frozen_envelope',
    )
  })

  it('rejects impossible dates and sources apparently published after retrieval', () => {
    const impossible = structuredClone(G21_PUBLIC_ROW_CANARY[2])
    impossible.evidence[0].publishedOn = '2026-02-30'
    expect(validatePublicRowCanaryProfile(impossible)).toContain(
      'SRC-WPP-APPOINTMENT:published_on_invalid',
    )

    const future = structuredClone(G21_PUBLIC_ROW_CANARY[2])
    future.evidence[0].publishedOn = '2026-09-11'
    expect(validatePublicRowCanaryProfile(future)).toContain(
      'SRC-WPP-APPOINTMENT:published_after_retrieval',
    )
  })

  it('rejects simulated depth when the coverage does not earn it', () => {
    const candidate = structuredClone(G21_PUBLIC_ROW_CANARY[3]) as PublicRowCanaryProfile
    candidate.coverage.longitudinalContinuity = false
    expect(validatePublicRowCanaryProfile(candidate)).toContain(
      'coverage_does_not_match_evidence_depth',
    )
  })

  it('keeps the cold start fictional, empty and explicitly non-diagnostic', () => {
    const coldStart = G21_PUBLIC_ROW_CANARY[0]
    expect(coldStart.manifest.namespace).toBe('synthetic_fixture')
    expect(coldStart.evidence).toEqual([])
    expect(coldStart.oracle.diagnosticMode).toBe('intake_required')
    expect(coldStart.oracle.forbiddenClaims).toContain(
      'Generic advice presented as if it came from a Brain.',
    )
  })
})

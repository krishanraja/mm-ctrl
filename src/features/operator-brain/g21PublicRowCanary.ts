import {
  EXTERNAL_EVIDENCE_DEPTHS,
  validateProfileManifest,
  type ExternalEvidenceDepth,
  type RangeProfileManifest,
} from './rangeCouncilContract'

export const PUBLIC_SOURCE_TYPES = [
  'official_company_page',
  'official_company_report',
  'official_investor_release',
  'regulatory_filing',
] as const

export const PUBLIC_CLAIM_STANDINGS = [
  'public_fact',
  'public_statement',
  'bounded_inference',
  'evidence_gap',
] as const

export const PUBLIC_DIAGNOSTIC_MODES = [
  'intake_required',
  'gap_first',
  'decision_pressure',
  'longitudinal_pressure',
] as const

export type PublicSourceType = (typeof PUBLIC_SOURCE_TYPES)[number]
export type PublicClaimStanding = (typeof PUBLIC_CLAIM_STANDINGS)[number]
export type PublicDiagnosticMode = (typeof PUBLIC_DIAGNOSTIC_MODES)[number]

export interface PublicEvidenceSource {
  sourceId: string
  title: string
  url: string
  publisher: string
  sourceType: PublicSourceType
  layer: 'narrative' | 'revealed'
  subjectScope: 'person' | 'company' | 'person_and_company'
  publishedOn?: string
  retrievedOn: string
  summary: string
  limitations: string[]
}

export interface PublicEvidenceCoverage {
  currentIdentity: boolean
  currentBusinessContext: boolean
  currentDecisionTension: boolean
  currentOutcomeEvidence: boolean
  currentCountercase: boolean
  longitudinalContinuity: boolean
}

export interface PublicCanaryNotice {
  noticeId: string
  standing: PublicClaimStanding
  text: string
  evidenceIds: string[]
}

export interface PublicCanaryOracle {
  diagnosticMode: PublicDiagnosticMode
  decisionFocus: string
  allowedNotices: PublicCanaryNotice[]
  unresolved: string[]
  routeChangingQuestion: string
  answerWouldChange: string
  expectedDiagnosticNotices: string[]
  forbiddenClaims: string[]
}

export interface PublicRowCanaryProfile {
  manifest: RangeProfileManifest
  evidence: PublicEvidenceSource[]
  coverage: PublicEvidenceCoverage
  oracle: PublicCanaryOracle
}

const SOURCE_ID_PATTERN = /^SRC-[A-Z0-9-]+$/
const NOTICE_ID_PATTERN = /^NOTICE-[A-Z0-9-]+$/

const EXPECTED_MODE_BY_DEPTH: Record<ExternalEvidenceDepth, PublicDiagnosticMode> = {
  none_or_unusable: 'intake_required',
  sparse: 'gap_first',
  useful: 'decision_pressure',
  rich_longitudinal: 'longitudinal_pressure',
}

const EXPECTED_COVERAGE_BY_DEPTH: Record<ExternalEvidenceDepth, PublicEvidenceCoverage> = {
  none_or_unusable: {
    currentIdentity: false,
    currentBusinessContext: false,
    currentDecisionTension: false,
    currentOutcomeEvidence: false,
    currentCountercase: false,
    longitudinalContinuity: false,
  },
  sparse: {
    currentIdentity: true,
    currentBusinessContext: true,
    currentDecisionTension: false,
    currentOutcomeEvidence: false,
    currentCountercase: false,
    longitudinalContinuity: false,
  },
  useful: {
    currentIdentity: true,
    currentBusinessContext: true,
    currentDecisionTension: true,
    currentOutcomeEvidence: true,
    currentCountercase: true,
    longitudinalContinuity: false,
  },
  rich_longitudinal: {
    currentIdentity: true,
    currentBusinessContext: true,
    currentDecisionTension: true,
    currentOutcomeEvidence: true,
    currentCountercase: true,
    longitudinalContinuity: true,
  },
}

function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value))
}

function hasExactCoverage(
  actual: PublicEvidenceCoverage,
  expected: PublicEvidenceCoverage,
): boolean {
  return Object.entries(expected).every(
    ([key, value]) => actual[key as keyof PublicEvidenceCoverage] === value,
  )
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

export function validatePublicRowCanaryProfile(profile: PublicRowCanaryProfile): string[] {
  const errors = validateProfileManifest(profile.manifest)
  const { manifest, evidence, coverage, oracle } = profile
  const sourceIds = evidence.map((source) => source.sourceId)
  const sourceUrls = evidence.map((source) => source.url)
  const noticeIds = oracle.allowedNotices.map((notice) => notice.noticeId)

  if (manifest.internalDepth !== 'none') errors.push('public_row_requires_zero_internal_evidence')
  if (oracle.diagnosticMode !== EXPECTED_MODE_BY_DEPTH[manifest.externalDepth]) {
    errors.push('diagnostic_mode_does_not_match_evidence_depth')
  }
  if (!hasExactCoverage(coverage, EXPECTED_COVERAGE_BY_DEPTH[manifest.externalDepth])) {
    errors.push('coverage_does_not_match_evidence_depth')
  }

  if (manifest.externalDepth === 'none_or_unusable') {
    if (manifest.namespace !== 'synthetic_fixture') errors.push('empty_canary_must_be_fictional')
    if (evidence.length > 0) errors.push('empty_canary_cannot_have_evidence')
  } else if (manifest.namespace !== 'real_public' || !manifest.realNamedPerson) {
    errors.push('researched_public_canary_requires_real_public_subject')
  }

  if (!sameStringSet(manifest.publicSourceLocators, sourceUrls)) {
    errors.push('manifest_source_locators_must_match_frozen_envelope')
  }
  if (new Set(sourceIds).size !== sourceIds.length) errors.push('source_ids_must_be_unique')
  if (new Set(sourceUrls).size !== sourceUrls.length) errors.push('source_urls_must_be_unique')
  if (new Set(noticeIds).size !== noticeIds.length) errors.push('notice_ids_must_be_unique')

  for (const source of evidence) {
    if (!SOURCE_ID_PATTERN.test(source.sourceId)) errors.push(`${source.sourceId}:source_id_invalid`)
    if (!source.title.trim()) errors.push(`${source.sourceId}:title_required`)
    if (!source.publisher.trim()) errors.push(`${source.sourceId}:publisher_required`)
    if (!source.url.startsWith('https://')) errors.push(`${source.sourceId}:https_url_required`)
    if (!validIsoDate(source.retrievedOn)) errors.push(`${source.sourceId}:retrieved_on_invalid`)
    if (source.publishedOn && !validIsoDate(source.publishedOn)) {
      errors.push(`${source.sourceId}:published_on_invalid`)
    }
    if (source.publishedOn && source.publishedOn > source.retrievedOn) {
      errors.push(`${source.sourceId}:published_after_retrieval`)
    }
    if (!source.summary.trim()) errors.push(`${source.sourceId}:summary_required`)
    if (source.limitations.length === 0) errors.push(`${source.sourceId}:limitation_required`)
    if (source.limitations.some((limitation) => !limitation.trim())) {
      errors.push(`${source.sourceId}:empty_limitation`)
    }
  }

  for (const notice of oracle.allowedNotices) {
    if (!NOTICE_ID_PATTERN.test(notice.noticeId)) errors.push(`${notice.noticeId}:notice_id_invalid`)
    if (!notice.text.trim()) errors.push(`${notice.noticeId}:notice_text_required`)
    if (notice.standing !== 'evidence_gap' && notice.evidenceIds.length === 0) {
      errors.push(`${notice.noticeId}:evidenced_notice_requires_source`)
    }
    if (notice.standing === 'bounded_inference' && notice.evidenceIds.length < 2) {
      errors.push(`${notice.noticeId}:bounded_inference_requires_two_sources`)
    }
    for (const evidenceId of notice.evidenceIds) {
      if (!sourceIds.includes(evidenceId)) errors.push(`${notice.noticeId}:unknown_${evidenceId}`)
    }
  }

  if (!oracle.decisionFocus.trim()) errors.push('decision_focus_required')
  if (oracle.allowedNotices.length === 0) errors.push('allowed_notice_required')
  if (oracle.unresolved.length === 0) errors.push('unresolved_question_required')
  if (!oracle.routeChangingQuestion.trim()) errors.push('route_changing_question_required')
  if (!oracle.answerWouldChange.trim()) errors.push('answer_effect_required')
  if (oracle.expectedDiagnosticNotices.length === 0) errors.push('expected_diagnostic_notice_required')
  if (oracle.forbiddenClaims.length === 0) errors.push('forbidden_claim_required')

  return errors
}

export function validatePublicRowCanary(profiles: PublicRowCanaryProfile[]): string[] {
  const errors: string[] = []
  const profileIds = profiles.map((profile) => profile.manifest.profileId)
  const depths = profiles.map((profile) => profile.manifest.externalDepth)

  if (profiles.length !== EXTERNAL_EVIDENCE_DEPTHS.length) errors.push('public_row_requires_four_profiles')
  if (new Set(profileIds).size !== profileIds.length) errors.push('profile_ids_must_be_unique')
  for (const depth of EXTERNAL_EVIDENCE_DEPTHS) {
    if (depths.filter((candidate) => candidate === depth).length !== 1) {
      errors.push(`public_row_requires_one_${depth}`)
    }
  }
  for (const profile of profiles) {
    errors.push(
      ...validatePublicRowCanaryProfile(profile).map(
        (error) => `${profile.manifest.profileId}:${error}`,
      ),
    )
  }
  return errors
}

const emptyCoverage = EXPECTED_COVERAGE_BY_DEPTH.none_or_unusable

export const G21_PUBLIC_ROW_CANARY: PublicRowCanaryProfile[] = [
  {
    manifest: {
      profileId: 'RANGE-PUBLIC-00',
      displayLabel: 'Cold-start leader, wholly fictional',
      namespace: 'synthetic_fixture',
      externalDepth: 'none_or_unusable',
      internalDepth: 'none',
      realNamedPerson: false,
      publicSourceLocators: [],
      syntheticDisclosure: 'Wholly fictional empty-state identity with no public or private evidence.',
    },
    evidence: [],
    coverage: { ...emptyCoverage },
    oracle: {
      diagnosticMode: 'intake_required',
      decisionFocus: 'No consequential decision or usable evidence has been supplied.',
      allowedNotices: [
        {
          noticeId: 'NOTICE-COLD-START-GAP',
          standing: 'evidence_gap',
          text: 'There is not enough evidence to diagnose a person, business or decision.',
          evidenceIds: [],
        },
      ],
      unresolved: [
        'The exact decision, deadline, stakes, alternatives, constraints and available evidence are unknown.',
      ],
      routeChangingQuestion:
        'What decision must be made, by when, and what becomes materially harder if it waits?',
      answerWouldChange:
        'It establishes whether CTRL should research, structure an intake or refuse a premature diagnostic.',
      expectedDiagnosticNotices: [
        'State plainly that no diagnostic is earned.',
        'Ask for one real decision and its deadline before asking for personal history.',
      ],
      forbiddenClaims: [
        'Any claim about the fictional leader, their company, motives, standards or likely decision.',
        'Generic advice presented as if it came from a Brain.',
      ],
    },
  },
  {
    manifest: {
      profileId: 'RANGE-PUBLIC-01',
      displayLabel: 'Silke Anderson at Cloud7 Marketing',
      namespace: 'real_public',
      externalDepth: 'sparse',
      internalDepth: 'none',
      realNamedPerson: true,
      publicSourceLocators: [
        'https://www.cloud7marketing.co.uk/team',
        'https://www.cloud7marketing.co.uk/',
        'https://find-and-update.company-information.service.gov.uk/company/15140339',
      ],
    },
    evidence: [
      {
        sourceId: 'SRC-CLOUD7-TEAM',
        title: 'Meet the Team',
        url: 'https://www.cloud7marketing.co.uk/team',
        publisher: 'Cloud7 Marketing and AI',
        sourceType: 'official_company_page',
        layer: 'narrative',
        subjectScope: 'person_and_company',
        retrievedOn: '2026-09-10',
        summary:
          'The company presents Silke Anderson as founder and CEO and describes a UK consultancy offering fractional marketing leadership, practical AI training and delivery support.',
        limitations: [
          'First-party positioning does not establish demand, economics, delivery capacity or outcomes.',
        ],
      },
      {
        sourceId: 'SRC-CLOUD7-HOME',
        title: 'Cloud7 Marketing and AI',
        url: 'https://www.cloud7marketing.co.uk/',
        publisher: 'Cloud7 Marketing and AI',
        sourceType: 'official_company_page',
        layer: 'narrative',
        subjectScope: 'company',
        retrievedOn: '2026-09-10',
        summary:
          'The company markets AI literacy training, fractional CMO support and marketing services to UK small and mid-sized businesses.',
        limitations: [
          'Service descriptions and testimonials are self-published and do not reveal offer-level revenue, profit or repeat work.',
        ],
      },
      {
        sourceId: 'SRC-CLOUD7-COMPANIES-HOUSE',
        title: 'CLOUD7 MARKETING LTD overview',
        url: 'https://find-and-update.company-information.service.gov.uk/company/15140339',
        publisher: 'Companies House',
        sourceType: 'regulatory_filing',
        layer: 'revealed',
        subjectScope: 'company',
        retrievedOn: '2026-09-10',
        summary:
          'The public register lists Cloud7 Marketing Ltd as an active private company incorporated on 15 September 2023 across consultancy, advertising, technology-service and education classifications.',
        limitations: [
          'Companies House warns that it does not verify filed information, and the overview does not establish commercial performance.',
        ],
      },
    ],
    coverage: { ...EXPECTED_COVERAGE_BY_DEPTH.sparse },
    oracle: {
      diagnosticMode: 'gap_first',
      decisionFocus:
        'Which of the publicly marketed offers, fractional leadership or AI literacy training, could support a repeatable growth engine without weakening bespoke delivery?',
      allowedNotices: [
        {
          noticeId: 'NOTICE-CLOUD7-IDENTITY',
          standing: 'public_statement',
          text: 'Cloud7 publicly presents Silke Anderson as its founder and CEO.',
          evidenceIds: ['SRC-CLOUD7-TEAM'],
        },
        {
          noticeId: 'NOTICE-CLOUD7-OFFER-MIX',
          standing: 'public_statement',
          text: 'The business markets both fractional marketing leadership and practical AI literacy training to UK smaller businesses.',
          evidenceIds: ['SRC-CLOUD7-TEAM', 'SRC-CLOUD7-HOME'],
        },
        {
          noticeId: 'NOTICE-CLOUD7-EVIDENCE-GAP',
          standing: 'evidence_gap',
          text: 'Public evidence does not show which offer produces the strongest gross profit, repeat work or founder-adjusted capacity.',
          evidenceIds: [],
        },
      ],
      unresolved: [
        'Offer-level revenue, gross profit, delivery time, repeat purchase, referral rate and founder dependency are not publicly established.',
      ],
      routeChangingQuestion:
        'Across the last twelve months, which offer produced the most gross profit and repeat work after delivery time is included?',
      answerWouldChange:
        'It would distinguish a scalable offer from a visible offer before recommending productisation, hiring or positioning changes.',
      expectedDiagnosticNotices: [
        'Separate what the business says it offers from evidence of what is commercially working.',
        'Ask for one offer-level economic comparison rather than diagnosing the founder.',
        'Abstain from recommending which offer to scale until that comparison exists.',
      ],
      forbiddenClaims: [
        'Silke Anderson personally prefers either offer or has a particular risk tolerance, taste or management weakness.',
        'Cloud7 is profitable, should productise AI training or should stop bespoke consulting.',
        'Testimonials prove repeatable commercial outcomes.',
      ],
    },
  },
  {
    manifest: {
      profileId: 'RANGE-PUBLIC-02',
      displayLabel: 'Cindy Rose at WPP',
      namespace: 'real_public',
      externalDepth: 'useful',
      internalDepth: 'none',
      realNamedPerson: true,
      publicSourceLocators: [
        'https://www.wpp.com/en/news/2025/07/chief-executive-officer-appointment',
        'https://www.wpp.com/en/news/2026/02/strategy-update-and-2025-preliminary-results',
        'https://www.wpp.com/en/news/2026-interim-results',
        'https://www.wpp.com/en/insights/our-trust-principles',
      ],
    },
    evidence: [
      {
        sourceId: 'SRC-WPP-APPOINTMENT',
        title: 'Chief Executive Officer Appointment',
        url: 'https://www.wpp.com/en/news/2025/07/chief-executive-officer-appointment',
        publisher: 'WPP',
        sourceType: 'official_investor_release',
        layer: 'revealed',
        subjectScope: 'person_and_company',
        publishedOn: '2025-07-10',
        retrievedOn: '2026-09-10',
        summary: 'WPP appointed Cindy Rose as chief executive officer effective 1 September 2025.',
        limitations: ['An appointment announcement establishes role and stated rationale, not later performance.'],
      },
      {
        sourceId: 'SRC-WPP-ELEVATE28',
        title: 'Strategy Update and 2025 Preliminary Results',
        url: 'https://www.wpp.com/en/news/2026/02/strategy-update-and-2025-preliminary-results',
        publisher: 'WPP',
        sourceType: 'official_investor_release',
        layer: 'narrative',
        subjectScope: 'company',
        publishedOn: '2026-02-26',
        retrievedOn: '2026-09-10',
        summary:
          'WPP announced Elevate28, a shift from a holding company to four integrated operating units connected by WPP Open, with a target of GBP 500 million in gross annualised cost savings by 2028.',
        limitations: ['The strategy and targets are forward-looking and do not prove causation or delivery.'],
      },
      {
        sourceId: 'SRC-WPP-H1-2026',
        title: '2026 Interim Results',
        url: 'https://www.wpp.com/en/news/2026-interim-results',
        publisher: 'WPP',
        sourceType: 'official_investor_release',
        layer: 'revealed',
        subjectScope: 'company',
        publishedOn: '2026-08-06',
        retrievedOn: '2026-09-10',
        summary:
          'WPP reported H1 revenue less pass-through costs down 4.7 percent like for like, an improving second-half trajectory expectation, major wins and retentions, GBP 100 million of planned in-year savings and continued work toward the GBP 500 million 2028 target.',
        limitations: [
          'The release does not isolate how much incremental revenue, margin or retention was caused by integration or WPP Open.',
        ],
      },
      {
        sourceId: 'SRC-WPP-TRUST',
        title: 'Our WPP trust principles',
        url: 'https://www.wpp.com/en/insights/our-trust-principles',
        publisher: 'WPP',
        sourceType: 'official_company_page',
        layer: 'narrative',
        subjectScope: 'person_and_company',
        publishedOn: '2026-06-22',
        retrievedOn: '2026-09-10',
        summary:
          'Cindy Rose publicly framed growth and trust as central to WPP and described client demand for marketing transformation and measurable enterprise growth.',
        limitations: ['A leadership statement establishes the public thesis, not whether clients experience it.'],
      },
    ],
    coverage: { ...EXPECTED_COVERAGE_BY_DEPTH.useful },
    oracle: {
      diagnosticMode: 'decision_pressure',
      decisionFocus:
        'Whether WPP should keep concentrating its turnaround on one integrated AI-enabled operating model before more restructuring capital is committed.',
      allowedNotices: [
        {
          noticeId: 'NOTICE-WPP-IDENTITY',
          standing: 'public_fact',
          text: 'Cindy Rose has served as WPP chief executive officer since 1 September 2025.',
          evidenceIds: ['SRC-WPP-APPOINTMENT'],
        },
        {
          noticeId: 'NOTICE-WPP-STRATEGY',
          standing: 'public_statement',
          text: 'Elevate28 ties structural integration, WPP Open, growth investment and GBP 500 million of gross annualised cost savings into one turnaround plan.',
          evidenceIds: ['SRC-WPP-ELEVATE28'],
        },
        {
          noticeId: 'NOTICE-WPP-TENSION',
          standing: 'bounded_inference',
          text: 'The latest public evidence supports progress on reorganisation, savings and client activity, but does not yet prove that the integrated AI model is restoring organic growth.',
          evidenceIds: ['SRC-WPP-ELEVATE28', 'SRC-WPP-H1-2026', 'SRC-WPP-TRUST'],
        },
      ],
      unresolved: [
        'Incremental contracted revenue and contribution margin attributable to the integrated model are not disclosed.',
        'Public results do not isolate WPP Open adoption, client-level impact or the counterfactual under the previous structure.',
      ],
      routeChangingQuestion:
        'How much new revenue and profit came from work WPP could not have won under the old agency structure?',
      answerWouldChange:
        'It would test whether integration is becoming a growth mechanism or remains a restructuring and cost programme.',
      expectedDiagnosticNotices: [
        'Name the conflict between visible execution progress and still-negative organic performance.',
        'Ask for the incremental economics of integration before treating wins and retentions as causal proof.',
        'Keep the public strategy, reported outcomes and causal inference visibly separate.',
      ],
      forbiddenClaims: [
        'WPP Open caused the reported wins, retentions or sequential improvement.',
        'Cindy Rose privately believes a specific reorganisation, staffing action or investment should happen.',
        'WPP employees have adopted the new model or share leadership confidence.',
        'The cost savings will restore growth or shareholder value.',
      ],
    },
  },
  {
    manifest: {
      profileId: 'RANGE-PUBLIC-03',
      displayLabel: 'Satya Nadella at Microsoft',
      namespace: 'real_public',
      externalDepth: 'rich_longitudinal',
      internalDepth: 'none',
      realNamedPerson: true,
      publicSourceLocators: [
        'https://www.microsoft.com/investor/reports/ar15/index.html',
        'https://www.microsoft.com/investor/reports/ar25/index.html',
        'https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm',
        'https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4',
        'https://www.microsoft.com/en-us/trust-center/security/secure-future-initiative/sfi-progress-report-july-2026',
      ],
    },
    evidence: [
      {
        sourceId: 'SRC-MSFT-2015',
        title: 'Microsoft 2015 Annual Report',
        url: 'https://www.microsoft.com/investor/reports/ar15/index.html',
        publisher: 'Microsoft',
        sourceType: 'official_company_report',
        layer: 'narrative',
        subjectScope: 'person_and_company',
        publishedOn: '2015-10-19',
        retrievedOn: '2026-09-10',
        summary:
          'The shareholder letter described a mobile-first, cloud-first platform strategy, organisational change and a growth-mindset culture under Satya Nadella.',
        limitations: ['This is historical leadership framing and cannot establish current priorities by itself.'],
      },
      {
        sourceId: 'SRC-MSFT-2025',
        title: 'Microsoft 2025 Annual Report',
        url: 'https://www.microsoft.com/investor/reports/ar25/index.html',
        publisher: 'Microsoft',
        sourceType: 'official_company_report',
        layer: 'narrative',
        subjectScope: 'person_and_company',
        retrievedOn: '2026-09-10',
        summary:
          'The shareholder letter described AI as a platform shift affecting every layer of the technology stack and framed the operating challenge as delivering current platforms while building the next generation.',
        limitations: ['The letter is management framing and predates the latest fiscal-year results.'],
      },
      {
        sourceId: 'SRC-MSFT-2026-10K',
        title: 'Microsoft 2026 Form 10-K',
        url: 'https://www.sec.gov/Archives/edgar/data/789019/000119312526323660/msft-20260630.htm',
        publisher: 'United States Securities and Exchange Commission',
        sourceType: 'regulatory_filing',
        layer: 'revealed',
        subjectScope: 'person_and_company',
        publishedOn: '2026-07-29',
        retrievedOn: '2026-09-10',
        summary:
          'The filing identifies Satya Nadella as chairman and chief executive officer. It reports fiscal 2026 revenue up 18 percent and a lower Microsoft Cloud gross-margin percentage as AI infrastructure investment and usage increased.',
        limitations: [
          'Company-level results do not disclose the full return by workload, customer, product or unit of constrained AI capacity.',
        ],
      },
      {
        sourceId: 'SRC-MSFT-FY26-Q4',
        title: 'Microsoft Fiscal Year 2026 Fourth Quarter Earnings Conference Call',
        url: 'https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4',
        publisher: 'Microsoft Investor Relations',
        sourceType: 'official_investor_release',
        layer: 'revealed',
        subjectScope: 'company',
        publishedOn: '2026-07-29',
        retrievedOn: '2026-09-10',
        summary:
          'Microsoft reported USD 41 billion of quarterly capital expenditure, USD 678 billion of commercial remaining performance obligations and continued capacity expansion while describing workload efficiency and customer return as operating priorities.',
        limitations: [
          'Management commentary and aggregate commitments do not prove the realised return or durability of every AI workload.',
        ],
      },
      {
        sourceId: 'SRC-MSFT-SFI-2026',
        title: 'July 2026 Secure Future Initiative progress report',
        url: 'https://www.microsoft.com/en-us/trust-center/security/secure-future-initiative/sfi-progress-report-july-2026',
        publisher: 'Microsoft Trust Center',
        sourceType: 'official_company_report',
        layer: 'revealed',
        subjectScope: 'company',
        publishedOn: '2026-07-10',
        retrievedOn: '2026-09-10',
        summary:
          'Microsoft reported progress against security objectives and described security as a continuous discipline embedded across governance, engineering and AI-accelerated defence.',
        limitations: [
          'A company progress report is not independent assurance that every security objective or product risk is resolved.',
        ],
      },
    ],
    coverage: { ...EXPECTED_COVERAGE_BY_DEPTH.rich_longitudinal },
    oracle: {
      diagnosticMode: 'longitudinal_pressure',
      decisionFocus:
        'How Microsoft should allocate scarce AI capacity and capital across infrastructure and first-party products without mistaking contracted demand for durable returns or weakening security.',
      allowedNotices: [
        {
          noticeId: 'NOTICE-MSFT-IDENTITY',
          standing: 'public_fact',
          text: 'Satya Nadella is Microsoft chairman and chief executive officer.',
          evidenceIds: ['SRC-MSFT-2026-10K'],
        },
        {
          noticeId: 'NOTICE-MSFT-LONGITUDINAL-SHIFT',
          standing: 'bounded_inference',
          text: 'Microsoft public strategy has moved from a mobile-first, cloud-first platform transition to an AI platform transition while retaining the need to operate the current business and build the next one at the same time.',
          evidenceIds: ['SRC-MSFT-2015', 'SRC-MSFT-2025'],
        },
        {
          noticeId: 'NOTICE-MSFT-CAPITAL-TENSION',
          standing: 'bounded_inference',
          text: 'Current public evidence shows strong demand and growth alongside exceptional capital intensity, margin pressure and a security obligation that makes capacity allocation a quality-of-return decision, not only a growth decision.',
          evidenceIds: ['SRC-MSFT-2026-10K', 'SRC-MSFT-FY26-Q4', 'SRC-MSFT-SFI-2026'],
        },
      ],
      unresolved: [
        'Realised return by AI workload, customer cohort and unit of constrained capacity is not publicly disclosed.',
        'Public evidence does not reveal the internal hurdle that trades short-term revenue against strategic learning, product position and security readiness.',
      ],
      routeChangingQuestion:
        'When AI capacity is scarce, which customer uses should get it first, and what return and security proof earns that priority?',
      answerWouldChange:
        'It would reveal whether capacity is being allocated by contracted demand, lifetime value, strategic learning, security readiness or a deliberate combination.',
      expectedDiagnosticNotices: [
        'Use the eleven-year public arc to distinguish a durable platform-building pattern from a recent AI slogan.',
        'Pressure-test demand against realised return, margin and security rather than treating backlog or capacity growth as proof.',
        'Ask for the actual allocation hurdle without claiming to know Satya Nadella private judgement.',
      ],
      forbiddenClaims: [
        'Satya Nadella personally prefers a specific workload, partner, model provider or capital allocation rule.',
        'Commercial remaining performance obligations guarantee returns on AI infrastructure.',
        'The Secure Future Initiative proves Microsoft products or infrastructure are secure.',
        'Headcount changes were caused by AI or reveal a private workforce strategy.',
        'Historical public language proves a stable private personality, taste or management style.',
      ],
    },
  },
]

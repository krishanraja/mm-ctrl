import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  DatabaseZap,
  FileWarning,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
} from 'lucide-react'
import {
  expandedSyntheticInputCount,
  getSyntheticBrainAccount,
  syntheticBrainPopulation,
  type SyntheticBrainAccount,
} from './syntheticPopulation'
import './SyntheticPopulationLabPage.css'

const LAB_ROOT = '/operator/lab/synthetic-population'

function humanise(value: string): string {
  return value.split('_').join(' ')
}

function initials(account: SyntheticBrainAccount): string {
  return account.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function accountHref(account: SyntheticBrainAccount): string {
  return `${LAB_ROOT}/${account.id}`
}

function AccountRail({ selected, query }: { selected: SyntheticBrainAccount; query: string }) {
  const normalised = query.trim().toLowerCase()
  const accounts = normalised.length === 0
    ? syntheticBrainPopulation
    : syntheticBrainPopulation.filter((account) =>
      [account.displayName, account.organisation, account.role, account.id, account.decisionFamily, account.uiState]
        .some((value) => value.toLowerCase().includes(normalised)),
    )

  return (
    <nav className="spl-rail-list" aria-label="Synthetic accounts">
      {accounts.map((account) => (
        <Link
          className={account.id === selected.id ? 'is-active' : ''}
          to={accountHref(account)}
          key={account.id}
          aria-current={account.id === selected.id ? 'page' : undefined}
        >
          <span className="spl-avatar" aria-hidden="true">{initials(account)}</span>
          <span className="spl-account-copy">
            <strong>{account.displayName}</strong>
            <small>{account.organisation}</small>
          </span>
          <span className={`spl-state is-${account.uiState}`}>{account.uiState}</span>
        </Link>
      ))}
      {accounts.length === 0 && <p className="spl-no-results">No fixture matches that search.</p>}
    </nav>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="spl-metric"><strong>{value}</strong><span>{label}</span></div>
}

function SourceCard({ account, sourceIndex }: { account: SyntheticBrainAccount; sourceIndex: number }) {
  const source = account.inputs[sourceIndex]
  if (!source) return null

  return (
    <article className="spl-source-card">
      <header>
        <div><span>{source.id}</span><strong>{humanise(source.sourceType)}</strong></div>
        <span className={`spl-outcome is-${source.expectedOutcome}`}>{humanise(source.expectedOutcome)}</span>
      </header>
      <div className="spl-source-meta">
        <span>{source.format}</span>
        <span>{humanise(source.audience)}</span>
        <span>{source.consent} consent</span>
        <span>{source.integrity}</span>
        <span>{source.durable ? 'durable' : 'not durable'}</span>
        {source.repeatCount && <span>{source.repeatCount.toLocaleString()} events</span>}
      </div>
      <details>
        <summary>Inspect source content</summary>
        <p dir="auto">{source.content}</p>
      </details>
      <footer>
        <time dateTime={source.capturedAt}>{source.capturedAt}</time>
        <code>{source.ingestKey}</code>
      </footer>
    </article>
  )
}

function EmptySources() {
  return (
    <div className="spl-empty-source">
      <DatabaseZap aria-hidden="true" />
      <strong>No evidence exists.</strong>
      <p>The correct diagnostic response is restraint, not a fabricated portrait.</p>
    </div>
  )
}

function DiagnosticOracle({ account }: { account: SyntheticBrainAccount }) {
  return (
    <section className="spl-oracle" aria-label="Diagnostic oracle">
      <header className="spl-panel-head">
        <div><BrainCircuit aria-hidden="true" /><span>Diagnostic oracle</span></div>
        <strong>{account.oracle.posture}</strong>
      </header>
      <div className="spl-oracle-block is-notice">
        <span>Must notice</span>
        <ul>{account.oracle.mustNotice.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="spl-oracle-block is-prohibited">
        <span>Must not infer</span>
        <ul>{account.oracle.mustNotInfer.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="spl-next-move">
        <span>Smallest defensible next move</span>
        <p>{account.oracle.bestNextMove}</p>
      </div>
    </section>
  )
}

export default function SyntheticPopulationLabPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const account = getSyntheticBrainAccount(accountId ?? '') ?? syntheticBrainPopulation[0]
  const [query, setQuery] = useState('')
  const index = syntheticBrainPopulation.findIndex((candidate) => candidate.id === account.id)
  const expandedForAccount = useMemo(
    () => account.inputs.reduce((total, source) => total + (source.repeatCount ?? 1), 0),
    [account],
  )
  const previous = syntheticBrainPopulation[(index - 1 + syntheticBrainPopulation.length) % syntheticBrainPopulation.length]
  const next = syntheticBrainPopulation[(index + 1) % syntheticBrainPopulation.length]

  useEffect(() => {
    const previousTitle = document.title
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const robots = existingRobots ?? document.createElement('meta')
    const previousRobots = existingRobots?.content
    if (!existingRobots) {
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = 'noindex,nofollow,noarchive'
    document.title = `${account.displayName} | Synthetic Brain lab`

    return () => {
      document.title = previousTitle
      if (existingRobots) robots.content = previousRobots ?? ''
      else robots.remove()
    }
  }, [account.displayName])

  return (
    <div className="synthetic-population-lab" data-testid="synthetic-population-lab">
      <header className="spl-topbar">
        <img src="/mindmaker-favicon.png" alt="Mindmaker" />
        <div><strong>Synthetic Brain lab</strong><span>Internal quality instrument</span></div>
        <div className="spl-top-metrics">
          <span><b>{syntheticBrainPopulation.length}</b> people</span>
          <span><b>{expandedSyntheticInputCount.toLocaleString()}</b> events</span>
          <span><ShieldCheck aria-hidden="true" /> no database writes</span>
        </div>
      </header>

      <aside className="spl-rail">
        <label className="spl-search">
          <Search aria-hidden="true" />
          <span className="spl-visually-hidden">Search synthetic accounts</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or cases" />
        </label>
        <AccountRail selected={account} query={query} />
      </aside>

      <main className="spl-main">
        <div className="spl-mobile-select">
          <label htmlFor="spl-account-select">Synthetic case</label>
          <select
            id="spl-account-select"
            value={account.id}
            onChange={(event) => navigate(`${LAB_ROOT}/${event.target.value}`)}
          >
            {syntheticBrainPopulation.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{candidate.displayName} · {candidate.uiState}</option>
            ))}
          </select>
        </div>

        <section className="spl-identity">
          <div className="spl-identity-main">
            <span className="spl-avatar is-large" aria-hidden="true">{initials(account)}</span>
            <div>
              <span>{account.id} · synthetic demo</span>
              <h1>{account.displayName}</h1>
              <p>{account.role} · {account.organisation}</p>
            </div>
          </div>
          <div className="spl-case-nav">
            <Link to={accountHref(previous)} aria-label={`Previous case: ${previous.displayName}`}><ArrowLeft /></Link>
            <span>{index + 1} / {syntheticBrainPopulation.length}</span>
            <Link to={accountHref(next)} aria-label={`Next case: ${next.displayName}`}><ArrowRight /></Link>
          </div>
        </section>

        <section className="spl-summary-grid">
          <div className="spl-focus-card">
            <span>Decision family</span>
            <strong>{humanise(account.decisionFamily)}</strong>
            <p>{account.fixtureDisclosure}</p>
          </div>
          <div className="spl-metrics-card">
            <Metric label="proof day" value={account.proofDay} />
            <Metric label="base sources" value={account.inputs.length} />
            <Metric label="expanded events" value={expandedForAccount.toLocaleString()} />
            <Metric label="UI state" value={account.uiState} />
          </div>
          <div className="spl-context-card">
            <div><span>Locale</span><strong>{account.locale}</strong></div>
            <div><span>Time zone</span><strong>{account.timeZone}</strong></div>
            <div><span>Stable subject</span><code>{account.subjectId}</code></div>
          </div>
        </section>

        <div className="spl-workspace">
          <section className="spl-sources" aria-label="Source processing cases">
            <header className="spl-panel-head">
              <div><Filter aria-hidden="true" /><span>Input and processing path</span></div>
              <strong>{account.inputs.length === 0 ? 'empty' : `${account.inputs.length} source${account.inputs.length === 1 ? '' : 's'}`}</strong>
            </header>
            <div className="spl-source-scroll">
              {account.inputs.length === 0
                ? <EmptySources />
                : account.inputs.map((source, sourceIndex) => <SourceCard account={account} sourceIndex={sourceIndex} key={source.id} />)}
            </div>
          </section>

          <DiagnosticOracle account={account} />

          <section className="spl-stress" aria-label="Interface and safety stress">
            <header className="spl-panel-head">
              <div><FileWarning aria-hidden="true" /><span>Failure pressure</span></div>
              <strong>{account.uiState}</strong>
            </header>
            <div className="spl-stress-list">
              {account.uiStress.map((stress) => <span key={stress}>{humanise(stress)}</span>)}
            </div>
            <div className="spl-boundary">
              <LockKeyhole aria-hidden="true" />
              <div><strong>Test oracle, not customer truth</strong><p>No model output has passed merely because this screen renders.</p></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BrainCircuit,
  Eye,
  FileText,
  GitCompareArrows,
  Mic,
  Plus,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { decisionBenchFixture as fixture } from './fixtureDecisionBenchAdapter'
import type { BenchPanel, BenchState, BrainItem, BrainSource } from './contract'
import './DecisionBenchPage.css'

const comparisonRows = [
  {
    label: 'Meaning',
    current: ['Other people cannot yet see the quality loss Maya sees.', 'BI-105 · supported synthesis'],
    history: ['Maya fundamentally distrusts delegation.', 'BI-109 · discarded interpretation'],
  },
  {
    label: 'Evidence',
    current: ['3 linked sources', 'SRC-101 · 102 · 105'],
    history: ['Weakened by her correction', 'SRC-105'],
  },
  {
    label: 'What changed',
    current: ['She wants the team to notice before she fixes.', 'Voice reflection · 7 September'],
    history: ['Control was mistaken for the cause.', 'Kept only as history'],
  },
  {
    label: 'Session',
    current: ['Test two directions that fail differently.', 'Current next move'],
    history: ['Do not coach her to delegate more.', 'Cannot guide the session'],
  },
] as const

const meaningCopy = {
  current: {
    label: 'Why this guides the session',
    text: 'Maya will hand work over. She steps back in when the team misses the quality problems she sees early.',
  },
  history: {
    label: 'Why this cannot guide the session',
    text: 'Maya corrected the idea that reluctance to delegate is the cause. The explanation remains visible as history.',
  },
} as const

const fallbackStates: Record<BenchState, { label: string; title: string; body: string }> = {
  sparse: {
    label: 'Sparse record',
    title: 'One useful signal. One open question.',
    body: 'Maya becomes more precise when reacting to real work. Bring one concrete contrast to the next conversation.',
  },
  quiet: {
    label: 'No new interruption',
    title: 'The current route still holds.',
    body: 'No recorded change needs Krish’s attention. The current session plan remains visible.',
  },
  loading: {
    label: 'Reading the latest evidence',
    title: 'Current meaning remains visible.',
    body: 'The new source is still being checked. No current Brain meaning has changed.',
  },
  stale: {
    label: 'Evidence needs rechecking',
    title: 'The latest source could not be refreshed.',
    body: 'This view uses evidence verified on 5 September. Recheck it before treating the route as current.',
  },
  error: {
    label: 'Evidence unavailable',
    title: 'The new evidence could not be processed.',
    body: 'Nothing in Maya’s Brain has changed. Retry the source or add a short operator note.',
  },
  rejected: {
    label: 'Current read rejected',
    title: 'The evidence remains as history.',
    body: 'This interpretation no longer guides the session. A different reading needs support before it replaces it.',
  },
}

const nodeIds = ['BI-105', 'BI-102', 'BI-109', 'BI-101', 'BI-110'] as const
const sourceIds = ['SRC-105', 'SRC-102', 'SRC-101'] as const
type DialogKind = 'source' | 'prepare' | 'ask' | 'customer' | 'local' | null
type MeaningMode = keyof typeof meaningCopy

function findItem(id: string): BrainItem {
  const item = fixture.brain_items.find((candidate) => candidate.id === id)
  if (!item) throw new Error(`Missing Brain item ${id}`)
  return item
}

function findSource(id: string): BrainSource {
  const source = fixture.sources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Missing source ${id}`)
  return source
}

function nodeRelationship(id: string) {
  if (id === 'BI-105') {
    const relationship = fixture.relationships.find((candidate) => candidate.id === 'REL-101')!
    return { label: `${relationship.type} · ${relationship.id}`, meaning: 'Interchangeable work supports the current read.' }
  }
  if (id === 'BI-102') {
    const relationship = fixture.relationships.find((candidate) => candidate.id === 'REL-101')!
    return { label: `${relationship.type} · ${relationship.id}`, meaning: 'This anti-standard supports the current synthesis.' }
  }
  if (id === 'BI-109') return { label: 'history · BI-109', meaning: 'It cannot guide the current session.' }
  const relationshipId = id === 'BI-101' ? 'REL-104' : 'REL-105'
  const relationship = fixture.relationships.find((candidate) => candidate.id === relationshipId)!
  return { label: `${relationship.type} · ${relationship.id}`, meaning: relationship.meaning }
}

function PanelHeader({ title, meta }: { title: string; meta: string }) {
  return <div className="db-panel-head"><strong>{title}</strong><span>{meta}</span></div>
}

function ComparePanel({ active }: { active: boolean }) {
  const [selected, setSelected] = useState<MeaningMode>('current')

  return (
    <section className={`db-panel db-compare ${active ? 'is-mobile-active' : ''}`} data-mobile-panel="compare" aria-label="Compare interpretations">
      <PanelHeader title="Compare the explanation" meta="Current and history" />
      <div className="db-comparison">
        <div className="db-table-corner">Test</div>
        <div className="db-column-head"><i />Guiding now</div>
        <div className="db-column-head is-history"><i />History</div>
        {comparisonRows.map((row) => (
          <div className="db-comparison-row" key={row.label}>
            <div className="db-row-head">{row.label}</div>
            <button
              className={`db-cell is-current ${selected === 'current' ? 'is-selected' : ''}`}
              onClick={() => setSelected('current')}
              type="button"
            >
              <strong>{row.current[0]}</strong><small>{row.current[1]}</small>
            </button>
            <button
              className={`db-cell is-history ${selected === 'history' ? 'is-selected' : ''}`}
              onClick={() => setSelected('history')}
              type="button"
            >
              <strong>{row.history[0]}</strong><small>{row.history[1]}</small>
            </button>
          </div>
        ))}
      </div>
      <div className={`db-selection ${selected === 'history' ? 'is-history' : ''}`} aria-live="polite">
        <span>{meaningCopy[selected].label}</span>
        <p>{meaningCopy[selected].text}</p>
      </div>
    </section>
  )
}

function BrainRoute() {
  const [selectedId, setSelectedId] = useState<(typeof nodeIds)[number]>('BI-105')
  const item = findItem(selectedId)
  const relationship = nodeRelationship(selectedId)

  return (
    <div className="db-brain-lens">
      <div className="db-brain-field" aria-label="Local Living Brain route">
        <svg viewBox="0 0 396 260" preserveAspectRatio="none" aria-hidden="true">
          <line className="is-active" x1="214" y1="125" x2="75" y2="60" />
          <line x1="214" y1="125" x2="76" y2="190" />
          <line x1="214" y1="125" x2="300" y2="55" />
          <line className="is-active" x1="214" y1="125" x2="302" y2="190" />
        </svg>
        {nodeIds.map((id, index) => {
          const node = findItem(id)
          const tone = id === 'BI-109' ? 'history' : id === 'BI-101' ? 'blue' : id === 'BI-110' ? 'boundary' : ''
          return (
            <button
              key={id}
              type="button"
              className={`db-brain-node db-node-${index + 1} ${tone} ${selectedId === id ? 'is-focus' : ''}`}
              onClick={() => setSelectedId(id)}
              aria-label={node.title}
            >
              <i /><span>{node.title}</span>
            </button>
          )
        })}
      </div>
      <div className="db-lens-readout" aria-live="polite">
        <span className="db-label">Selected Brain item</span>
        <h3>{item.title}</h3>
        <p>{item.statement}</p>
        <div className="db-relationship">
          <small>{relationship.label}</small>
          <strong>{relationship.meaning}</strong>
        </div>
      </div>
    </div>
  )
}

function EvidencePanel({ active, openSource }: { active: boolean; openSource: (source: BrainSource) => void }) {
  return (
    <section className={`db-panel db-evidence ${active ? 'is-mobile-active' : ''}`} data-mobile-panel="evidence" aria-label="Evidence and Living Brain">
      <PanelHeader title="Evidence behind the current read" meta="Exact sources · typed links" />
      <div className="db-change-trace" aria-label="Evidence changed the interpretation">
        <div className="is-source"><small>New evidence</small><strong>SRC-105</strong></div><b>›</b>
        <div><small>Moved to history</small><strong>BI-109</strong></div><b>›</b>
        <div className="is-current"><small>Guiding now</small><strong>BI-105 v2</strong></div>
      </div>
      <div className="db-source-list">
        {sourceIds.map((id) => {
          const source = findSource(id)
          const preview = id === 'SRC-105'
            ? '“I need them to notice what I notice...”'
            : id === 'SRC-102'
              ? '“Polished, but it could have belonged to anyone.”'
              : '“Nearly there, not more options I have to rescue.”'
          const date = id === 'SRC-105' ? '7 Sep' : id === 'SRC-102' ? '3 Sep' : '29 Aug'
          return (
            <button className="db-source-row" type="button" key={id} onClick={() => openSource(source)}>
              <span className="db-source-id">{id}</span>
              <span><strong>{source.label.replace('Maya ', '')}</strong><em>{preview}</em></span>
              <time>{date}</time>
            </button>
          )
        })}
      </div>
      <BrainRoute />
    </section>
  )
}

function ActionPanel({ active, openDialog }: { active: boolean; openDialog: (dialog: DialogKind) => void }) {
  return (
    <section className={`db-panel db-action ${active ? 'is-mobile-active' : ''}`} data-mobile-panel="action" aria-label="Prepare next move">
      <PanelHeader title="Next session" meta="Operator private" />
      <div className="db-action-body">
        <section className="is-next"><span className="db-label">Prepare</span><h3>Two launch directions that fail differently.</h3><p>Ask which is closer, then what would still stop Maya shipping it.</p></section>
        <section><span className="db-label">Why</span><h3>Comparison makes her standard visible.</h3><p>Abstract questions produced principles she later contradicted.</p></section>
        <section className="is-open"><span className="db-label">Still unknown</span><h3>The first warning sign.</h3><p>The Brain knows what Maya rejects, but not the earliest detail she notices.</p></section>
        <section><span className="db-label">Decision boundary</span><h3>Three sources support this route.</h3><p>The Brain has no rule that authorises the final decision.</p></section>
      </div>
      <div className="db-action-foot">
        <button className="db-primary" type="button" onClick={() => openDialog('prepare')}>Prepare next move</button>
        <button className="db-text-button" type="button" onClick={() => openDialog('ask')}>Ask privately</button>
        <div>Private working view · does not change the Brain</div>
      </div>
    </section>
  )
}

function BenchDialog({ kind, source, onClose }: { kind: DialogKind; source: BrainSource | null; onClose: () => void }) {
  const [asked, setAsked] = useState(false)

  useEffect(() => setAsked(false), [kind])

  const title = kind === 'source' ? (source?.label ?? 'Source')
    : kind === 'prepare' ? 'Prepare next move'
      : kind === 'ask' ? 'Ask privately'
        : kind === 'customer' ? 'Customer projection'
          : 'Local proof'

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="db-dialog" data-testid={kind ? `${kind}-dialog` : undefined}>
        <div className="db-dialog-head">
          <strong>{title}</strong>
          <button type="button" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="db-dialog-body">
          {kind === 'source' && source && (
            <>
              <DialogTitle className="db-visually-hidden">{source.label}</DialogTitle>
              <DialogDescription className="db-label">{source.id} · {source.kind.split('_').join(' ')} · {source.observed_at}</DialogDescription>
              <blockquote>“{source.assertion}”</blockquote>
              <div className="db-dialog-meta">Customer private · exact fixture assertion</div>
            </>
          )}
          {kind === 'prepare' && (
            <>
              <DialogDescription className="db-label">Tomorrow · 10:30 · operator private</DialogDescription>
              <DialogTitle>Bring two directions. Ask one question.</DialogTitle>
              <blockquote>{fixture.intervention.exact_opening}</blockquote>
              <div className="db-prep-grid">
                <div><strong>Listen for</strong><ul>{fixture.intervention.listen_for.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><strong>If the session moves elsewhere</strong><p>{fixture.deepen_route.fallback}</p><strong>Material</strong><p>{fixture.intervention.material_to_bring.label}.</p></div>
              </div>
            </>
          )}
          {kind === 'ask' && (
            <>
              <DialogDescription className="db-label">Private working view · does not change the Brain</DialogDescription>
              <DialogTitle>What changed in the room?</DialogTitle>
              <p>Ask about the current evidence. The response stays private and has no durable effect.</p>
              <div className="db-ask-row"><input aria-label="Private question" defaultValue={fixture.private_ask.demo_query} /><button className="db-primary" type="button" aria-label="Ask" onClick={() => setAsked(true)}><ArrowRight /></button></div>
              {asked && <div className="db-ask-answer"><strong>Keep the two issues separate.</strong><p>{fixture.private_ask.demo_response.answer} {fixture.private_ask.demo_response.next_question}</p><div className="db-dialog-meta">Session guidance · operator private · 3 sources · no durable effect</div></div>}
            </>
          )}
          {kind === 'customer' && (
            <>
              <DialogDescription className="db-label">Preview only · customer private</DialogDescription>
              <DialogTitle className="db-visually-hidden">Customer projection</DialogTitle>
              <div className="db-projection"><h3>{fixture.customer_preview.headline}</h3><p>{fixture.customer_preview.body}</p><div className="db-privacy-row"><div><small>Included</small><strong>Customer-visible sources</strong></div><div><small>Excluded</small><strong>Krish’s private note</strong></div></div></div>
            </>
          )}
          {kind === 'local' && (
            <>
              <DialogTitle>No customer data will be changed.</DialogTitle>
              <DialogDescription>This rendered proof can inspect the synthetic fixture. Evidence capture and persistence are outside its authority.</DialogDescription>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DecisionBenchPage() {
  const [panel, setPanel] = useState<BenchPanel>('compare')
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [source, setSource] = useState<BrainSource | null>(null)
  const stateCandidate = new URLSearchParams(window.location.search).get('state')
  const state = stateCandidate && stateCandidate in fallbackStates ? stateCandidate as BenchState : null

  const openSource = (nextSource: BrainSource) => {
    setSource(nextSource)
    setDialog('source')
  }

  const panelButton = (target: BenchPanel, label: string, icon: ReactNode) => (
    <button
      type="button"
      className={panel === target ? 'is-active' : ''}
      onClick={() => { setPanel(target); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      aria-label={label}
    >{icon}<span>{label}</span></button>
  )

  return (
    <div className="decision-bench" data-testid="decision-bench">
      <header className="db-topbar">
        <div className="db-brand" aria-label="CTRL"><BrainCircuit /></div>
        <div className="db-identity"><div className="db-avatar">MC</div><div><strong>{fixture.customer.display_name}</strong><span>{fixture.customer.role} · {fixture.customer.organisation}</span></div></div>
        <div className="db-top-actions">
          <button className="db-quiet-button" type="button" onClick={() => setDialog('local')}><Plus />Add evidence</button>
          <button className="db-icon-button db-customer-mobile" type="button" aria-label="Preview customer view" onClick={() => setDialog('customer')}><Eye /></button>
          <button className="db-icon-button" type="button" aria-label="Ask privately" onClick={() => setDialog('ask')}><Mic /></button>
        </div>
      </header>

      <aside className="db-rail" aria-label="Decision Bench">
        {panelButton('compare', 'Compare', <GitCompareArrows />)}
        {panelButton('evidence', 'Evidence', <FileText />)}
        {panelButton('action', 'Prepare next move', <ArrowRight />)}
        <button type="button" aria-label="Preview customer view" onClick={() => setDialog('customer')}><Eye /></button>
        <div className="db-rail-spacer" />
        <div className="db-day"><strong>{fixture.customer.proof_day}/{fixture.customer.proof_length_days}</strong><span>proof day</span></div>
      </aside>

      <main className="db-stage">
        <header className="db-decision-head">
          <div>
            <span className="db-label">Decision focus</span>
            <h1>How can Maya make her quality standard usable by the team?</h1>
            <div className="db-read-line"><span>Current read: <strong>the team misses early quality signals.</strong></span><span>Open question: what is the first warning sign?</span></div>
          </div>
          <div className="db-head-meta"><div><small>Next session</small><strong>Tomorrow · 10:30</strong></div><div><small>Current basis</small><strong>3 linked sources</strong></div></div>
        </header>

        <div className="db-grid">
          <ComparePanel active={panel === 'compare'} />
          <EvidencePanel active={panel === 'evidence'} openSource={openSource} />
          <ActionPanel active={panel === 'action'} openDialog={setDialog} />
        </div>

        <footer className="db-status"><span>Current meaning · BI-105 v2</span><span>Changed by SRC-105</span><span>Customer projection excludes operator notes</span><span>Synthetic customer · local proof</span></footer>

        {state && (
          <section className="db-state-cover" data-testid={`state-${state}`}>
            <div><span className="db-label">{fallbackStates[state].label}</span><h2>{fallbackStates[state].title}</h2><p>{fallbackStates[state].body}</p><a className="db-primary" href={window.location.pathname}>Return to current view</a></div>
          </section>
        )}
      </main>

      <nav className="db-mobile-nav" aria-label="Decision Bench sections">
        {panelButton('compare', 'Compare', <GitCompareArrows />)}
        {panelButton('evidence', 'Evidence', <FileText />)}
        {panelButton('action', 'Next move', <ArrowRight />)}
      </nav>

      <BenchDialog kind={dialog} source={source} onClose={() => setDialog(null)} />
    </div>
  )
}

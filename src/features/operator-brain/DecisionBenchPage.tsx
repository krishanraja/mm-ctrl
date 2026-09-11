import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, History, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { buildClaudeBrief, getAuditFindings, getChallengeSet, routePresentations } from './decisionBenchModel'
import { decisionBenchFixture as fixture } from './fixtureDecisionBenchAdapter'
import type {
  AuditFinding,
  BenchState,
  BrainSource,
  DecisionView,
  RouteId,
  SharpeningInput,
  SharpeningStanding,
} from './contract'
import './DecisionBenchPage.css'

type ModalKind = 'challenge' | 'sources' | 'capture' | null

const sourceGroups: Record<string, string[]> = {
  comparison: ['SRC-204', 'SRC-210'],
  surprise: ['SRC-206', 'SRC-208'],
  unknown: ['SRC-201', 'SRC-210'],
  all: fixture.sources.map((source) => source.id),
}

const testSteps = [
  ['01', 'Customer value', 'Which route helps buyers act?'],
  ['02', 'Judgement transfer', 'Can someone else apply your standard?'],
  ['03', 'Role design', 'What disappears and what becomes human?'],
  ['04', 'Incentives', 'What behaviour does the pilot reward?'],
] as const

function readBenchState(): BenchState | null {
  const state = new URLSearchParams(window.location.search).get('state')
  return state === 'sparse' || state === 'stale' || state === 'wrong' ? state : null
}

function readStartingView(): DecisionView {
  const view = new URLSearchParams(window.location.search).get('view')
  return view === 'test' || view === 'brief' || view === 'audit' ? view : 'decision'
}

function sourceById(id: string): BrainSource {
  const source = fixture.sources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Missing source ${id}`)
  return source
}

function standingFor(mode: 'answer' | 'find' | 'history'): SharpeningStanding {
  if (mode === 'find') return 'EVIDENCE REQUEST PENDING'
  if (mode === 'history') return 'PRIOR DECISION MATCH'
  return 'LEADER ANSWER'
}

function MainButton({ children, onClick, disabled = false }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return <button className="dt-primary" type="button" onClick={onClick} disabled={disabled}>{children}</button>
}

function BackButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="dt-back" type="button" onClick={onClick}><ArrowLeft aria-hidden="true" />{children}</button>
}

function DecisionViewPanel({
  benchState,
  routeId,
  onRouteChange,
  onViewChange,
  onOpenChallenge,
  onOpenSources,
  notify,
}: {
  benchState: BenchState | null
  routeId: RouteId
  onRouteChange: (routeId: RouteId) => void
  onViewChange: (view: DecisionView) => void
  onOpenChallenge: () => void
  onOpenSources: (group: string) => void
  notify: (message: string) => void
}) {
  const [counterOpen, setCounterOpen] = useState(false)
  const route = routePresentations[routeId]
  const sparse = benchState === 'sparse'
  const brainRead = sparse
    ? `${fixture.sparse_fallback.known} ${fixture.sparse_fallback.unknown}`
    : 'The bigger risk is rebuilding the team before someone else can apply your quality standard.'
  const counter = benchState === 'stale'
    ? 'The latest evidence is stale. This read cannot steer the decision until it is checked.'
    : `The counter-case: ${fixture.current_read.counter_case}`

  return (
    <main className="dt-main dt-decision-view">
      <section className="dt-decision-head" aria-labelledby="decision-title">
        <div>
          <h1 id="decision-title">How far should you rebuild marketing around AI?</h1>
          <p className="dt-stakes">Twelve months · synthetic £1.2m operating budget · eight roles affected</p>
        </div>
        <div className="dt-brain-read">
          <span>What your Brain sees</span>
          <p>{brainRead}</p>
          <small>{counter}</small>
        </div>
      </section>

      <section className={`dt-recognitions ${sparse ? 'is-sparse' : ''}`} aria-label="Current Brain recognitions">
        <article className="dt-recognition">
          <span className="dt-mark">1</span>
          <div><small>Your pattern</small><strong>You judge best through real comparison.</strong></div>
          <button type="button" onClick={() => onOpenSources('comparison')}>2 sources</button>
        </article>
        {!sparse ? (
          <article className="dt-recognition">
            <span className="dt-mark">2</span>
            <div><small>Your standard</small><strong>Make quality clear without killing surprise.</strong></div>
            <button type="button" onClick={() => onOpenSources('surprise')}>2 sources</button>
          </article>
        ) : null}
        <article className="dt-recognition">
          <span className="dt-mark">?</span>
          <div><small>Still unknown</small><strong>{sparse ? fixture.sparse_fallback.next_move : 'Can your standard travel without your final rescue?'}</strong></div>
          <button type="button" onClick={onOpenChallenge} aria-label="Ask three useful questions about this decision">Ask me more</button>
        </article>
      </section>

      <div className="dt-current-view">
        <span>You</span>
        <p>{fixture.decision.provisional_view}</p>
      </div>

      <section className="dt-route-table" aria-label="Three operating routes">
        <div className="dt-route-tabs" role="tablist" aria-label="Operating routes">
          {fixture.decision.routes.map((candidate, index) => {
            const active = candidate.id === routeId
            return (
              <button
                key={candidate.id}
                className={active ? 'is-active' : ''}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  onRouteChange(candidate.id)
                  setCounterOpen(false)
                }}
              >
                <small>{active && candidate.id === fixture.decision_sharpening.default_route ? 'Current best route' : `Route ${index + 1}`}</small>
                <strong>{routePresentations[candidate.id].tabLabel}</strong>
              </button>
            )
          })}
        </div>

        <div className="dt-route-body">
          <div className="dt-route-main">
            <span className="dt-label">The causal bet</span>
            <h2>{route.title}</h2>
            <p>{route.summary}</p>
            <div className="dt-route-impact"><strong>{route.personal}</strong><span>{route.detail}</span></div>
          </div>
          <div className="dt-route-proof">
            <span className="dt-label">Why this route moves</span>
            <div className="dt-proof-line is-support"><b>Supports</b><span>{route.support}</span></div>
            <div className="dt-proof-line is-pullback"><b>Pulls back</b><span>{route.oppose}</span></div>
            <div className="dt-counter">
              <button type="button" onClick={() => setCounterOpen((open) => !open)} aria-expanded={counterOpen}>
                {counterOpen ? 'Hide the counter-case' : 'Show the strongest counter-case'}
              </button>
              {counterOpen ? <p>{route.counter}</p> : null}
            </div>
          </div>
          <div className="dt-route-action">
            <div>
              <span className="dt-label">What only you decide</span>
              <h3>{route.question}</h3>
              <p>{route.effect}</p>
            </div>
            <div>
              <MainButton onClick={() => onViewChange('test')}>Design the test <ArrowRight aria-hidden="true" /></MainButton>
              <button className="dt-text-action" type="button" onClick={() => notify('The three synthetic routes stay fixed in this proof.')}>I see another route</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function TestView({ killCondition, setKillCondition, onBack, onBuildBrief }: {
  killCondition: string
  setKillCondition: (value: string) => void
  onBack: () => void
  onBuildBrief: () => void
}) {
  return (
    <main className="dt-main dt-secondary-view">
      <BackButton onClick={onBack}>Back to the decision</BackButton>
      <section className="dt-section-title">
        <div><h1>One campaign can answer four questions.</h1><span>Current best route · prove the system first</span></div>
        <p>Run the new operating model separately. Compare it blind with the current process. You keep the final call.</p>
      </section>
      <section className="dt-test-grid">
        <div className="dt-test-main">
          <span className="dt-label">What the test must reveal</span>
          <div className="dt-test-steps">
            {testSteps.map(([number, title, detail]) => (
              <article key={number}><b>{number}</b><strong>{title}</strong><span>{detail}</span></article>
            ))}
          </div>
          <label className="dt-condition">
            <span>Your kill condition</span>
            <textarea value={killCondition} onChange={(event) => setKillCondition(event.target.value)} />
          </label>
        </div>
        <aside className="dt-test-side">
          <span className="dt-label">Brain recommendation</span>
          <h2>{fixture.recommended_move.title}</h2>
          <p>{fixture.recommended_move.reason}</p>
          <MainButton onClick={onBuildBrief}>Build the Claude brief <ArrowRight aria-hidden="true" /></MainButton>
          <small>You can change the test. The Brain cannot make the final organisational call.</small>
        </aside>
      </section>
    </main>
  )
}

function BriefView({ brief, wrongCustomer, onBack, onAudit, notify }: {
  brief: string
  wrongCustomer: boolean
  onBack: () => void
  onAudit: () => void
  notify: (message: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLPreElement>(null)

  async function copyBrief() {
    if (wrongCustomer) return
    try {
      await navigator.clipboard.writeText(brief)
      setCopied(true)
      notify('Complete brief copied')
    } catch {
      const selection = window.getSelection()
      const range = document.createRange()
      if (previewRef.current && selection) {
        range.selectNodeContents(previewRef.current)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      notify('Copy was blocked. The full brief is selected.')
    }
  }

  return (
    <main className="dt-main dt-secondary-view">
      <BackButton onClick={onBack}>Back to the test</BackButton>
      <section className="dt-section-title">
        <div><h1>Claude gets the full decision.</h1><span>Prepared from Maya's Brain</span></div>
        <p>The brief carries your view, evidence, standards, unknowns and the exact work you want back.</p>
      </section>
      <section className="dt-brief-shell">
        <div className="dt-brief-summary">
          <span className="dt-label">Included in the brief</span>
          <div className="dt-brief-facts">
            <div><small>Decision</small><strong>Three routes and their causal bets</strong></div>
            <div><small>Maya's judgement</small><strong>Patterns, standards and one corrected belief</strong></div>
            <div><small>Evidence boundary</small><strong>Twelve synthetic sources and explicit unknowns</strong></div>
            <div><small>Output</small><strong>Two pilots, one recommendation, counter-case and kill conditions</strong></div>
          </div>
          <p className="dt-copy-note">{wrongCustomer ? 'This brief belongs to a different selected customer. Nothing can be copied.' : 'Copies the complete private synthetic brief. Nothing is sent automatically.'}</p>
          <div className="dt-copy-actions">
            <MainButton onClick={copyBrief} disabled={wrongCustomer}>
              {wrongCustomer ? 'Return to Maya before copying' : copied ? <>Brief copied <Check aria-hidden="true" /></> : <>Copy complete brief <ArrowRight aria-hidden="true" /></>}
            </MainButton>
            {copied ? <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">Open Claude ↗</a> : null}
          </div>
          <div className="dt-return-box">
            <textarea
              aria-label="Claude plan to assess"
              placeholder="Paste Claude's plan back here"
              onPaste={(event) => {
                if (event.clipboardData.getData('text')) {
                  event.preventDefault()
                  onAudit()
                }
              }}
            />
            <button type="button" onClick={onAudit}>Use the synthetic return</button>
          </div>
        </div>
        <div className="dt-brief-preview">
          <span className="dt-label">Full brief · inspectable</span>
          <pre ref={previewRef} id="brief-text">{brief}</pre>
        </div>
      </section>
    </main>
  )
}

function AuditText({ onSelect }: { onSelect: (index: number) => void }) {
  return (
    <p>
      Aperture House should embrace an <button type="button" onClick={() => onSelect(0)}>AI-first marketing transformation</button>. Start by training the team on leading AI tools, <button type="button" onClick={() => onSelect(1)}>automate content creation</button> and use a <button type="button" onClick={() => onSelect(2)}>human-in-the-loop process</button> to maintain quality. Track <button type="button" onClick={() => onSelect(3)}>engagement and output</button> to prove success, then <button className="is-keep" type="button" onClick={() => onSelect(4)}>scale the programme in stages</button>.
    </p>
  )
}

function AuditView({ onBack, onRepair, notify }: { onBack: () => void; onRepair: () => void; notify: (message: string) => void }) {
  const findings = useMemo(() => getAuditFindings(fixture), [])
  const [activeIndex, setActiveIndex] = useState(0)
  const finding: AuditFinding = findings[activeIndex]

  return (
    <main className="dt-main dt-secondary-view">
      <BackButton onClick={onBack}>Back to the brief</BackButton>
      <section className="dt-section-title">
        <div><h1>Do not use this plan yet.</h1><span>Claude proposal · not Brain truth</span></div>
        <p>Your Brain found four material failures and one useful direction. You decide whether the criticism is fair.</p>
      </section>
      <section className="dt-audit">
        <article className="dt-plan">
          <span className="dt-label">Returned plan · select an underline</span>
          <AuditText onSelect={setActiveIndex} />
        </article>
        <aside className="dt-findings">
          <span className="dt-label">Maya's Brain · applied judgement</span>
          <h2 className={finding.keep ? 'is-keep' : ''}>{finding.title}</h2>
          <p>{finding.body}</p>
          <div className="dt-finding-ref">{finding.reference}</div>
          <div className="dt-audit-nav" aria-label="Assessment findings">
            {findings.map((_, index) => (
              <button key={index} className={index === activeIndex ? 'is-active' : ''} type="button" aria-label={`Finding ${index + 1}`} onClick={() => setActiveIndex(index)}>{index + 1}</button>
            ))}
          </div>
          <div className="dt-audit-actions">
            <MainButton onClick={onRepair}>Build the sharper request <ArrowRight aria-hidden="true" /></MainButton>
            <button type="button" onClick={() => notify('Your correction stays separate until it is reviewed.')}>The Brain missed something</button>
          </div>
        </aside>
      </section>
    </main>
  )
}

function SourcesDialog({ open, sources, onClose }: { open: boolean; sources: BrainSource[]; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="dt-dialog dt-sources-dialog">
        <DialogTitle>Why the Brain thinks this</DialogTitle>
        <DialogDescription>Each claim keeps its source and privacy boundary.</DialogDescription>
        <div className="dt-source-list">
          {sources.map((source) => (
            <article key={source.id}>
              <small>{source.label} · synthetic · {source.audience.replace('_', ' ')}</small>
              <p>{source.assertion}</p>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CaptureDialog({ open, onClose, notify }: { open: boolean; onClose: () => void; notify: (message: string) => void }) {
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="dt-dialog dt-capture-dialog">
        <DialogTitle>Add evidence for Maya</DialogTitle>
        <DialogDescription>This proof keeps the note only until you close the page.</DialogDescription>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Paste or type here" />
        <MainButton onClick={() => {
          if (!note.trim()) {
            notify('Add a note first')
            return
          }
          setSaved(true)
          notify('Kept with this decision')
        }}>Keep with this decision <ArrowRight aria-hidden="true" /></MainButton>
        {saved ? <p className="dt-saved">Kept with this decision as an unreviewed synthetic note.</p> : null}
      </DialogContent>
    </Dialog>
  )
}

function ChallengeDialog({
  open,
  routeId,
  onClose,
  onKeep,
  notify,
}: {
  open: boolean
  routeId: RouteId
  onClose: () => void
  onKeep: (input: SharpeningInput) => void
  notify: (message: string) => void
}) {
  const questions = useMemo(() => getChallengeSet(fixture, routeId), [routeId])
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const question = questions[index]

  useEffect(() => {
    if (!open) return
    setIndex(0)
    setChoice('')
    setNoteOpen(false)
    setNote('')
  }, [open, routeId])

  function next() {
    if (index >= questions.length - 1) {
      onClose()
      return
    }
    setIndex((current) => current + 1)
    setChoice('')
    setNoteOpen(false)
    setNote('')
  }

  function keep() {
    if (!choice) return
    onKeep({
      standing: standingFor(question.mode),
      question: question.question,
      input: note.trim() ? `${choice}\nOptional note: ${note.trim()}` : choice,
    })
    notify(question.mode === 'find' ? 'The Brain will check this' : 'Answer kept')
    next()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="dt-dialog dt-challenge-dialog" data-testid="challenge-dialog">
        <DialogTitle>One question</DialogTitle>
        <DialogDescription className="dt-challenge-meta"><span>{question.kind}</span><span>{index + 1} of {questions.length}</span></DialogDescription>
        <h3>{question.question}</h3>
        <p className="dt-challenge-why">{question.why}</p>
        <div className="dt-challenge-choices" role="group" aria-label="Answer choices">
          {question.choices.map((candidate) => (
            <button
              key={candidate}
              className={choice === candidate ? 'is-selected' : ''}
              type="button"
              aria-pressed={choice === candidate}
              onClick={() => {
                setChoice(candidate)
                if (candidate === 'Something else') setNoteOpen(true)
              }}
            >{candidate}</button>
          ))}
        </div>
        <div className="dt-challenge-effect"><small>What the answer changes</small><p>{question.effect}</p></div>
        <button className="dt-note-toggle" type="button" aria-expanded={noteOpen} onClick={() => setNoteOpen((shown) => !shown)}>{noteOpen ? 'Hide note' : 'Add a note'}</button>
        {noteOpen ? <textarea aria-label="Optional note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add anything the choices miss" /> : null}
        <div className="dt-challenge-actions">
          <MainButton onClick={keep} disabled={!choice}>{question.mode === 'find' ? <><Search aria-hidden="true" />Find this for me</> : <><Check aria-hidden="true" />Keep answer</>}</MainButton>
          <button type="button" onClick={next}>{index === questions.length - 1 ? 'Close' : 'Next question'}</button>
        </div>
        <p className="dt-question-source"><History aria-hidden="true" />{question.source}</p>
      </DialogContent>
    </Dialog>
  )
}

export default function DecisionBenchPage() {
  const [view, setView] = useState<DecisionView>(readStartingView)
  const [routeId, setRouteId] = useState<RouteId>(fixture.decision_sharpening.default_route)
  const [modal, setModal] = useState<ModalKind>(() => new URLSearchParams(window.location.search).get('view') === 'challenge' ? 'challenge' : null)
  const [sourceGroup, setSourceGroup] = useState('all')
  const [inputs, setInputs] = useState<SharpeningInput[]>([])
  const [killCondition, setKillCondition] = useState('Stop if the new route produces more material but still needs Maya to rescue the central idea.')
  const [toast, setToast] = useState('')
  const benchState = readBenchState()
  const brief = useMemo(() => buildClaudeBrief(fixture, inputs, killCondition), [inputs, killCondition])
  const shownSources = (sourceGroups[sourceGroup] ?? sourceGroups.all).map(sourceById)

  useEffect(() => {
    const previousTitle = document.title
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const robots = existingRobots ?? document.createElement('meta')
    const previousRobots = existingRobots?.content
    if (!existingRobots) {
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    document.title = 'Decision Table · synthetic operator proof'
    robots.content = 'noindex,nofollow'
    return () => {
      document.title = previousTitle
      if (existingRobots && previousRobots !== undefined) robots.content = previousRobots
      else robots.remove()
    }
  }, [])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  function openSources(group: string) {
    setSourceGroup(group)
    setModal('sources')
  }

  return (
    <div className="dt-shell">
      <header className="dt-header">
        <div className="dt-identity">
          <img src="/mindmaker-favicon.png" alt="Mindmake" />
          <span className="dt-avatar" aria-hidden="true">MC</span>
          <div><strong>{fixture.subject.display_name}</strong><small>{fixture.subject.role} · {fixture.subject.organisation} · synthetic</small></div>
        </div>
        <nav aria-label="Decision controls">
          <button type="button" onClick={() => openSources('all')}>Sources</button>
          <button type="button" onClick={() => setModal('capture')}>Add evidence</button>
        </nav>
      </header>

      {view === 'decision' ? (
        <DecisionViewPanel
          benchState={benchState}
          routeId={routeId}
          onRouteChange={setRouteId}
          onViewChange={setView}
          onOpenChallenge={() => setModal('challenge')}
          onOpenSources={openSources}
          notify={notify}
        />
      ) : null}
      {view === 'test' ? <TestView killCondition={killCondition} setKillCondition={setKillCondition} onBack={() => setView('decision')} onBuildBrief={() => setView('brief')} /> : null}
      {view === 'brief' ? <BriefView brief={brief} wrongCustomer={benchState === 'wrong'} onBack={() => setView('test')} onAudit={() => setView('audit')} notify={notify} /> : null}
      {view === 'audit' ? <AuditView onBack={() => setView('brief')} onRepair={() => { setView('brief'); notify('The sharper instruction is already in the complete brief') }} notify={notify} /> : null}

      <ChallengeDialog open={modal === 'challenge'} routeId={routeId} onClose={() => setModal(null)} onKeep={(input) => setInputs((current) => [...current, input])} notify={notify} />
      <SourcesDialog open={modal === 'sources'} sources={shownSources} onClose={() => setModal(null)} />
      <CaptureDialog open={modal === 'capture'} onClose={() => setModal(null)} notify={notify} />
      <div className={`dt-toast ${toast ? 'is-visible' : ''}`} role="status">{toast}</div>
    </div>
  )
}

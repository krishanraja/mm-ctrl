import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { DecisionCandidateProjection } from './decisionCandidateProjectionGateway'
import type { DecisionCandidateReviewInput } from './decisionCandidateReviewGateway'
import './DecisionCandidateMoment.css'

type View = 'loading' | 'candidate' | 'correcting' | 'confirmed' | 'corrected' | 'rejected' | 'error'

export type DecisionCandidateMomentProps = {
  candidateId: string
  load: (candidateId: string, includeBasis: boolean) => Promise<DecisionCandidateProjection>
  review: (input: DecisionCandidateReviewInput) => Promise<unknown>
  now?: () => string
  makeRequestId?: () => string
}

function defaultRequestId(): string {
  return `candidate-review:${crypto.randomUUID()}`
}

function sourceLabel(projection: DecisionCandidateProjection): string {
  const type = projection.basis?.sourceType.replace(/_/g, ' ') ?? 'source'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function DecisionCandidateMoment({
  candidateId,
  load,
  review,
  now = () => new Date().toISOString(),
  makeRequestId = defaultRequestId,
}: DecisionCandidateMomentProps) {
  const [view, setView] = useState<View>('loading')
  const [projection, setProjection] = useState<DecisionCandidateProjection | null>(null)
  const [basisOpen, setBasisOpen] = useState(false)
  const [correction, setCorrection] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const requestIds = useRef<Record<'confirmed' | 'corrected' | 'rejected', string> | null>(null)

  if (!requestIds.current) {
    requestIds.current = {
      confirmed: makeRequestId(),
      corrected: makeRequestId(),
      rejected: makeRequestId(),
    }
  }

  async function loadMinimum() {
    setView('loading')
    setMessage('')
    try {
      const next = await load(candidateId, false)
      setProjection(next)
      setCorrection(next.candidate.claim)
      setView(next.candidate.standing === 'proposed' ? 'candidate' : next.candidate.standing)
    } catch {
      setView('error')
      setMessage('This could not be loaded. Nothing changed.')
    }
  }

  useEffect(() => {
    void loadMinimum()
    // The injected loader is an application boundary and is stable for one mounted moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId])

  async function inspectBasis() {
    if (basisOpen) {
      setBasisOpen(false)
      return
    }
    try {
      const next = await load(candidateId, true)
      setProjection(next)
      setBasisOpen(true)
    } catch {
      setMessage('The source could not be opened. The proposal is still unchanged.')
    }
  }

  async function decide(disposition: 'confirmed' | 'corrected' | 'rejected') {
    if (!projection || !requestIds.current || saving) return
    setSaving(true)
    setMessage('')
    try {
      await review({
        candidateId,
        disposition,
        ...(disposition === 'corrected' ? { answer: correction } : {}),
        reviewedAt: now(),
        idempotencyKey: requestIds.current[disposition],
      })
      setView(disposition)
      if ('vibrate' in navigator) navigator.vibrate(8)
    } catch {
      setMessage('That did not save. Try again when you are ready.')
    } finally {
      setSaving(false)
    }
  }

  if (view === 'loading') {
    return <section className="dcm" aria-live="polite"><div className="dcm-loading">Loading the current read</div></section>
  }

  if (view === 'error' || !projection) {
    return (
      <section className="dcm" aria-live="polite">
        <p className="dcm-message">{message}</p>
        <button className="dcm-full" type="button" onClick={() => void loadMinimum()}>Try again</button>
      </section>
    )
  }

  if (view === 'confirmed' || view === 'corrected' || view === 'rejected') {
    const copy = view === 'confirmed'
      ? ['Understood', 'This is now recorded as your answer.']
      : view === 'corrected'
        ? ['Corrected', 'Your wording replaced CTRL’s proposal as the answer.']
        : ['Noted', 'CTRL will not use that proposal as your answer.']
    return (
      <section className="dcm dcm-done" aria-live="polite" data-testid="decision-candidate-complete">
        <Check aria-hidden="true" />
        <span>{copy[0]}</span>
        <h2>{view === 'corrected' ? correction : projection.candidate.claim}</h2>
        <p>{copy[1]}</p>
      </section>
    )
  }

  return (
    <section className="dcm" aria-labelledby="dcm-title" data-testid="decision-candidate-moment">
      <div className="dcm-kicker">CTRL’s current read</div>
      <h2 id="dcm-title">{projection.candidate.claim}</h2>
      <p className="dcm-question">Does that sound right?</p>

      {view === 'correcting' ? (
        <div className="dcm-correction">
          <label htmlFor="dcm-correction">Say what is true instead</label>
          <textarea
            id="dcm-correction"
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
            maxLength={8_000}
            autoFocus
          />
          <div className="dcm-correction-actions">
            <button type="button" disabled={saving} onClick={() => setView('candidate')}>Back</button>
            <button type="button" className="is-primary" disabled={saving || !correction.trim()} onClick={() => void decide('corrected')}>Use my wording</button>
          </div>
        </div>
      ) : (
        <div className="dcm-actions">
          <button type="button" className="is-primary" disabled={saving} onClick={() => void decide('confirmed')}>Yes</button>
          <button type="button" disabled={saving} onClick={() => setView('correcting')}>Change it</button>
          <button type="button" disabled={saving} aria-label="No, this is not right" onClick={() => void decide('rejected')}><X aria-hidden="true" />No</button>
        </div>
      )}

      {saving ? <div className="dcm-saving" role="status">Saving your answer</div> : null}
      {message ? <p className="dcm-message" role="status">{message}</p> : null}

      <button className="dcm-basis-toggle" type="button" disabled={saving} onClick={() => void inspectBasis()} aria-expanded={basisOpen}>
        {basisOpen ? 'Hide why' : 'Why CTRL thinks this'}
      </button>
      {basisOpen && projection.basis ? (
        <div className="dcm-basis">
          <span>{sourceLabel(projection)} · {new Date(projection.basis.capturedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <p>{projection.basis.sourceText}</p>
        </div>
      ) : null}
    </section>
  )
}

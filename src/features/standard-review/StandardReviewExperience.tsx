import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BrandLockup } from '@/components/landing/BrandLockup'
import type { StandardReviewEvidence, StandardReviewViewModel } from './contract'
import {
  StandardReviewGateway,
  StandardReviewGatewayError,
  type StandardReviewDecisionResult,
} from './gateway'
import './StandardReviewExperience.css'

type RetryAction =
  | { kind: 'prepare' }
  | { kind: 'decision'; review: StandardReviewViewModel; decision: 'approved' | 'rejected' }
  | { kind: 'reversal'; review: StandardReviewViewModel; result: StandardReviewDecisionResult }

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'ready'; review: StandardReviewViewModel }
  | { kind: 'saving'; review: StandardReviewViewModel; decision: 'approved' | 'rejected' }
  | { kind: 'approved'; review: StandardReviewViewModel; result: StandardReviewDecisionResult }
  | { kind: 'rejected'; review: StandardReviewViewModel }
  | { kind: 'reverse-confirm'; review: StandardReviewViewModel; result: StandardReviewDecisionResult }
  | { kind: 'reversing'; review: StandardReviewViewModel; result: StandardReviewDecisionResult }
  | { kind: 'reversed'; review: StandardReviewViewModel }
  | { kind: 'stale'; message: string }
  | { kind: 'error'; message: string; retry: RetryAction }

interface StandardReviewExperienceProps {
  gateway: StandardReviewGateway
  checkId: string
  expectedResultSha256: string
  subjectName?: string
  organisation?: string
  proofLabel?: string
  createRequestId?: (action: 'decision' | 'reversal') => string
  onDone?: () => void
  onRequestLatest?: () => void
}

function defaultRequestId(action: 'decision' | 'reversal') {
  return `standard_review_${action}_${crypto.randomUUID().replace(/-/g, '')}`
}

function vibrate() {
  try {
    navigator.vibrate?.(10)
  } catch {
    // Haptics are optional. The visible state remains the source of truth.
  }
}

function readableDate(source: StandardReviewEvidence) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(new Date(source.occurred_at))
}

function ResultCard({
  title,
  copy,
  tone = 'positive',
  icon = '✓',
  children,
}: {
  title: string
  copy: string
  tone?: 'positive' | 'stale' | 'error'
  icon?: string
  children?: ReactNode
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [title])

  return (
    <article className={`sr-state-card ${tone}`} role="status">
      <div className="sr-state-icon" aria-hidden="true">{icon}</div>
      <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
      <p>{copy}</p>
      {children}
    </article>
  )
}

function ExperienceShell({
  subjectName,
  organisation,
  children,
}: {
  subjectName: string
  organisation: string
  children: ReactNode
}) {
  return (
    <div className="standard-review-experience">
      <header className="sr-topbar">
        <div className="sr-identity">
          <BrandLockup className="sr-brand" />
          <div className="sr-person">
            <strong>{subjectName}</strong>
            <span>{organisation}</span>
          </div>
        </div>
      </header>
      <main className="sr-main">
        <div className="sr-shell">{children}</div>
      </main>
    </div>
  )
}

export function StandardReviewExperience({
  gateway,
  checkId,
  expectedResultSha256,
  subjectName = 'Your Brain',
  organisation = 'Private standard review',
  proofLabel,
  createRequestId = defaultRequestId,
  onDone,
  onRequestLatest,
}: StandardReviewExperienceProps) {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const decisionRequestId = useRef<string | undefined>(undefined)
  const reversalRequestId = useRef<string | undefined>(undefined)
  const detailsTriggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const review = await gateway.prepare(checkId, expectedResultSha256)
      setState({ kind: 'ready', review })
    } catch (error) {
      if (error instanceof StandardReviewGatewayError && error.code === 'state_conflict') {
        setState({ kind: 'stale', message: error.message })
        return
      }
      setState({
        kind: 'error',
        message: error instanceof StandardReviewGatewayError
          ? error.message
          : 'This change is not ready for a trustworthy review.',
        retry: { kind: 'prepare' },
      })
    }
  }, [checkId, expectedResultSha256, gateway])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (review: StandardReviewViewModel, decision: 'approved' | 'rejected') => {
    decisionRequestId.current ??= createRequestId('decision')
    setState({ kind: 'saving', review, decision })
    try {
      const result = await gateway.decide(review, decision, decisionRequestId.current)
      vibrate()
      setState(decision === 'approved'
        ? { kind: 'approved', review, result }
        : { kind: 'rejected', review })
    } catch (error) {
      if (error instanceof StandardReviewGatewayError && error.code === 'state_conflict') {
        setState({ kind: 'stale', message: error.message })
        return
      }
      setState({
        kind: 'error',
        message: 'Your rule has not changed.',
        retry: { kind: 'decision', review, decision },
      })
    }
  }

  const reverse = async (review: StandardReviewViewModel, result: StandardReviewDecisionResult) => {
    if (!result.applicationId || !result.applicationHash || !result.activeStandardSha256) {
      setState({ kind: 'error', message: 'The previous rule cannot be restored from this receipt.', retry: { kind: 'prepare' } })
      return
    }
    reversalRequestId.current ??= createRequestId('reversal')
    setState({ kind: 'reversing', review, result })
    try {
      await gateway.reverse(
        result.applicationId,
        result.applicationHash,
        result.activeStandardSha256,
        reversalRequestId.current,
        'Owner restored the previous current rule from its review receipt.',
      )
      vibrate()
      setState({ kind: 'reversed', review })
    } catch (error) {
      if (error instanceof StandardReviewGatewayError && error.code === 'state_conflict') {
        setState({ kind: 'stale', message: error.message })
        return
      }
      setState({
        kind: 'error',
        message: 'The previous rule has not been restored.',
        retry: { kind: 'reversal', review, result },
      })
    }
  }

  const retry = (action: RetryAction) => {
    if (action.kind === 'prepare') void load()
    if (action.kind === 'decision') void decide(action.review, action.decision)
    if (action.kind === 'reversal') void reverse(action.review, action.result)
  }

  const done = () => {
    if (onDone) onDone()
    else void load()
  }

  let content: ReactNode
  if (state.kind === 'loading') {
    content = (
      <section className="sr-loading-card" aria-label="Loading the latest rule">
        <div className="sr-loading-label sr-meta-label">Checking the latest rule</div>
        <div className="sr-skeleton wide" />
        <div className="sr-skeleton" />
        <div className="sr-skeleton mid" />
        <div className="sr-skeleton short" />
      </section>
    )
  } else if (state.kind === 'stale') {
    content = (
      <section className="sr-decision">
        <ResultCard title="This rule changed while you were reviewing it" copy="Nothing changed from this screen." tone="stale" icon="↻">
          <div className="sr-actions">
            <button className="sr-primary" type="button" onClick={() => onRequestLatest ? onRequestLatest() : void load()}>
              Review the latest rule
            </button>
          </div>
        </ResultCard>
      </section>
    )
  } else if (state.kind === 'error') {
    content = (
      <section className="sr-decision">
        <ResultCard title="We could not finish this review" copy={state.message} tone="error" icon="!">
          <div className="sr-actions">
            <button className="sr-primary" type="button" onClick={() => retry(state.retry)}>Try again</button>
          </div>
        </ResultCard>
      </section>
    )
  } else {
    const review = state.review
    if (state.kind === 'ready' || state.kind === 'saving') {
      content = (
        <section className="sr-decision" aria-labelledby={titleId}>
          <h1 className="sr-question" id={titleId}>{review.question}</h1>
          <article className="sr-rule-card">
            <div className="sr-evidence-notches" aria-hidden="true"><span /><span /></div>
            <div className="sr-rule-label sr-meta-label">Proposed rule</div>
            <p className="sr-rule-text">{review.proposed_rule}</p>
            <p className="sr-rule-note">{review.consequence}</p>
          </article>
          <div className="sr-evidence-line">
            <span className="sr-evidence-count">{review.evidence.length} recent examples</span>
            <button ref={detailsTriggerRef} className="sr-text-button" type="button" onClick={() => setDetailsOpen(true)}>See why</button>
          </div>
          <p className="sr-owner-line">Only you can change this. The old version stays in your history. You can put it back until this rule changes again.</p>
          <div className="sr-actions">
            <button className="sr-primary" type="button" disabled={state.kind === 'saving'} onClick={() => void decide(review, 'approved')}>
              {state.kind === 'saving' && state.decision === 'approved' ? 'Saving your choice' : 'Make this my rule'}
            </button>
            <button className="sr-secondary" type="button" disabled={state.kind === 'saving'} onClick={() => void decide(review, 'rejected')}>
              {state.kind === 'saving' && state.decision === 'rejected' ? 'Saving your choice' : 'Keep my current rule'}
            </button>
          </div>
        </section>
      )
    } else if (state.kind === 'approved') {
      content = (
        <section className="sr-decision">
          <ResultCard title="Rule updated" copy={review.consequence}>
            <div className="sr-actions">
              <button className="sr-primary" type="button" onClick={done}>Done</button>
              {state.result.reversibleWhileCurrent ? (
                <button className="sr-secondary" type="button" onClick={() => setState({ kind: 'reverse-confirm', review, result: state.result })}>Put the old rule back</button>
              ) : null}
            </div>
          </ResultCard>
        </section>
      )
    } else if (state.kind === 'rejected') {
      content = (
        <section className="sr-decision">
          <ResultCard title="Current rule kept" copy={review.current_rule}>
            <div className="sr-actions"><button className="sr-primary" type="button" onClick={done}>Done</button></div>
          </ResultCard>
        </section>
      )
    } else if (state.kind === 'reverse-confirm') {
      content = (
        <section className="sr-decision">
          <ResultCard title="Put the previous rule back?" copy={review.current_rule} tone="stale" icon="↶">
            <p>Both versions stay in your history.</p>
            <div className="sr-actions">
              <button className="sr-primary" type="button" onClick={() => void reverse(review, state.result)}>Restore the previous rule</button>
              <button className="sr-secondary" type="button" onClick={() => setState({ kind: 'approved', review, result: state.result })}>Cancel</button>
            </div>
          </ResultCard>
        </section>
      )
    } else if (state.kind === 'reversing') {
      content = <section className="sr-decision"><ResultCard title="Putting the old rule back" copy="Both versions stay in your history." tone="stale" icon="↶" /></section>
    } else {
      content = (
        <section className="sr-decision">
          <ResultCard title="Previous rule restored" copy={review.current_rule} icon="↶">
            <div className="sr-actions"><button className="sr-primary" type="button" onClick={done}>Done</button></div>
          </ResultCard>
        </section>
      )
    }

    content = (
      <>
        {content}
        <p className="sr-boundary">{proofLabel ?? 'This changes only your private Brain standard. It does not publish or deploy anything.'}</p>
        <DialogPrimitive.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="sr-overlay" />
            <DialogPrimitive.Content
              className="sr-sheet"
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                detailsTriggerRef.current?.focus()
              }}
            >
              <div className="sr-sheet-header">
                <DialogPrimitive.Title>Why this came up</DialogPrimitive.Title>
                <DialogPrimitive.Close className="sr-icon-button" aria-label="Close review details">×</DialogPrimitive.Close>
              </div>
              <DialogPrimitive.Description className="sr-sheet-intro">{review.headline}</DialogPrimitive.Description>
              <div className="sr-change-block">
                <article className="sr-change-row"><h3>Current rule</h3><p>{review.current_rule}</p></article>
                <article className="sr-change-row proposed"><h3>Proposed rule</h3><p>{review.proposed_rule}</p></article>
              </div>
              <article className="sr-effect"><h3>What changes</h3><p>{review.consequence}</p></article>
              <div className="sr-source-list">
                {review.evidence.map((source) => (
                  <article className="sr-source" key={source.source_id}>
                    <time dateTime={source.occurred_at}>{readableDate(source)}</time>
                    <strong>{source.label}</strong>
                    <p>{source.statement}</p>
                  </article>
                ))}
              </div>
              <article className="sr-alternative">
                <strong>Another possible reason</strong>
                {review.alternative_explanations.map((alternative) => <p key={alternative}>{alternative}</p>)}
              </article>
              <article className="sr-effect"><h3>If this is wrong</h3><p>{review.risk_if_wrong}</p></article>
              <article className="sr-effect"><h3>How we will check</h3><p>{review.validation}</p></article>
              <p className="sr-reversal-note">This changes only your private Brain standard. It does not publish or deploy anything. The old version stays in your history.</p>
              <details className="sr-technical">
                <summary>Technical record</summary>
                <p className="sr-record">review packet: {review.reviewPacketSha256}<br />planned standard: {review.plannedStandardSha256}<br />publication: not authorised</p>
              </details>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </>
    )
  }

  return <ExperienceShell subjectName={subjectName} organisation={organisation}>{content}</ExperienceShell>
}

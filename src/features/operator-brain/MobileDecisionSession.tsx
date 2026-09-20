import { useEffect, useRef, useState } from 'react'
import { Check, Mic, Plus } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { RouteId, SharpeningInput } from './contract'
import { decisionBenchFixture as fixture } from './fixtureDecisionBenchAdapter'
import {
  buildMobileDecisionProjection,
  mobileAnswerInput,
  mobileOutcomeCopy,
  readMobileDecisionState,
  type MobileDecisionChoice,
} from './mobileDecisionSessionModel'
import './MobileDecisionSession.css'

type SessionStep = 'question' | 'updating' | 'result' | 'challenge' | 'call' | 'recorded'

interface SpeechRecognitionResultEvent {
  results: ArrayLike<{ 0: { transcript: string } }>
}

interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

function speechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

interface MobileDecisionSessionProps {
  onAnswer: (input: SharpeningInput | null) => void
  onChallenge: (condition: string) => void
  onRouteChange: (routeId: RouteId) => void
  notify: (message: string) => void
}

const challengeChoices = [
  'Maya rescued the final work',
  'The customer was unusually easy',
  'The change did not last',
] as const

function vibrate() {
  if ('vibrate' in navigator) navigator.vibrate(8)
}

export function MobileDecisionSession({
  onAnswer,
  onChallenge,
  onRouteChange,
  notify,
}: MobileDecisionSessionProps) {
  const dataState = readMobileDecisionState(window.location.search)
  const projection = buildMobileDecisionProjection(fixture, dataState)
  const [step, setStep] = useState<SessionStep>('question')
  const [answer, setAnswer] = useState<MobileDecisionChoice | null>(null)
  const [recordedCall, setRecordedCall] = useState<string | null>(null)
  const [basisOpen, setBasisOpen] = useState(false)
  const [voiceListening, setVoiceListening] = useState(false)
  const timerRef = useRef<number | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const resultRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    recognitionRef.current?.abort()
  }, [])

  useEffect(() => {
    if (step === 'result' || step === 'challenge' || step === 'call' || step === 'recorded') resultRef.current?.focus()
  }, [step])

  function chooseAnswer(choice: MobileDecisionChoice) {
    vibrate()
    setAnswer(choice)
    onAnswer(mobileAnswerInput(projection.question, choice.label))
    setStep('updating')
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setStep('result'), 620)
  }

  function undoAnswer() {
    vibrate()
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    setAnswer(null)
    onAnswer(null)
    setStep('question')
  }

  function keepChallenge(value: typeof challengeChoices[number]) {
    vibrate()
    onChallenge(`Stop if the pilot appears successful only because ${value.toLowerCase()}.`)
    notify('Added to the test boundary')
    setStep('result')
  }

  function startVoiceAnswer() {
    vibrate()
    const Recognition = speechRecognitionConstructor()
    if (!Recognition) {
      notify('Voice input is not available in this browser')
      return
    }
    recognitionRef.current?.abort()
    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-GB'
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (transcript) chooseAnswer({ label: transcript, outcome: 'open' })
    }
    recognition.onerror = () => {
      setVoiceListening(false)
      notify('Voice answer was not captured')
    }
    recognition.onend = () => setVoiceListening(false)
    recognitionRef.current = recognition
    setVoiceListening(true)
    recognition.start()
  }

  function keepCall(routeId: RouteId, label: string) {
    vibrate()
    onRouteChange(routeId)
    setRecordedCall(label)
    setStep('recorded')
  }

  function leaveOpen() {
    vibrate()
    setRecordedCall(null)
    setStep('recorded')
  }

  const outcome = answer ? mobileOutcomeCopy(projection.dataState, answer.outcome) : null

  return (
    <Dialog open={basisOpen} onOpenChange={setBasisOpen}>
      <div className="mds" data-testid="mobile-decision-session">
      <header className="mds-header">
        <div className="mds-person">
          <img src={`${import.meta.env.BASE_URL}mindmaker-favicon.png`} alt="Mindmake" />
          <div><strong>{fixture.subject.display_name}</strong><span>{fixture.subject.organisation}</span></div>
        </div>
        <DialogTrigger asChild><button type="button" className="mds-basis-button">Inspect basis</button></DialogTrigger>
      </header>

      <main className="mds-main">
        <div className="mds-eyebrow">Live decision · <span data-testid="mobile-decision-status">{projection.status}</span> · {projection.asOf}</div>
        <h1>{projection.decision}</h1>

        <section className="mds-view" aria-labelledby="mds-current-view">
          <div className="mds-label" id="mds-current-view">Current view</div>
          <p>{projection.currentView}</p>
          <div className="mds-condition"><Plus aria-hidden="true" /><span>{projection.condition}</span></div>
        </section>

        <section className="mds-turn" aria-live="polite">
          {step === 'question' ? (
            <div data-testid="mobile-decision-question">
              <div className="mds-turn-head">
                <div className="mds-eyebrow">{projection.canAnswer ? 'One thing to settle' : projection.status}</div>
                {projection.canAnswer ? <div className="mds-count">1 of 1</div> : null}
              </div>
              <h2>{projection.question}</h2>
              {projection.canAnswer ? (
                <>
                  <div className="mds-choices">
                    {projection.choices.map((choice) => (
                      <button key={choice.label} type="button" onClick={() => chooseAnswer(choice)}>{choice.label}<span aria-hidden="true">›</span></button>
                    ))}
                  </div>
                  <div className="mds-answer-tools">
                    <button type="button" className="mds-voice" onClick={startVoiceAnswer} aria-pressed={voiceListening}><Mic aria-hidden="true" />{voiceListening ? 'Listening…' : 'Say it instead'}</button>
                    <div>{projection.sourceCount} linked sources</div>
                  </div>
                </>
              ) : (
                <button type="button" className="mds-retry" onClick={() => notify('No synthetic update is connected in this proof')}>Try again</button>
              )}
            </div>
          ) : null}

          {step === 'updating' ? <div className="mds-updating"><span>Checking what this changes</span></div> : null}

          {step === 'result' && answer && outcome ? (
            <div className="mds-result" data-testid="mobile-decision-result" ref={resultRef} tabIndex={-1}>
              <div className="mds-turn-head"><div className="mds-eyebrow">Your answer</div><div className="mds-count">Saved in this session</div></div>
              <p className="mds-answer"><strong>{answer.label}</strong></p>
              <h2>{outcome.title}</h2>
              <p className="mds-explanation">{outcome.explanation}</p>
              <div className="mds-actions">
                <button type="button" onClick={() => setStep('challenge')}>Challenge this</button>
                <button type="button" className="is-primary" onClick={() => setStep('call')}>Record my call</button>
              </div>
              <button type="button" className="mds-undo" onClick={undoAnswer}>Undo answer</button>
            </div>
          ) : null}

          {step === 'challenge' ? (
            <div className="mds-result" data-testid="mobile-decision-challenge" ref={resultRef} tabIndex={-1}>
              <div className="mds-turn-head"><div className="mds-eyebrow">Pressure test</div><div className="mds-count">Optional</div></div>
              <h2>What could make the pilot look better than it really is?</h2>
              <div className="mds-choices">
                {challengeChoices.map((choice) => <button key={choice} type="button" onClick={() => keepChallenge(choice)}>{choice}<span aria-hidden="true">›</span></button>)}
              </div>
              <button type="button" className="mds-undo" onClick={() => setStep('result')}>Back</button>
            </div>
          ) : null}

          {step === 'call' ? (
            <div className="mds-result" data-testid="mobile-decision-call" ref={resultRef} tabIndex={-1}>
              <div className="mds-turn-head"><div className="mds-eyebrow">Your call</div><div className="mds-count">Not recorded</div></div>
              <h2>What do you want to do?</h2>
              <div className="mds-choices">
                <button type="button" onClick={() => keepCall('ROUTE-B', 'Run the proof first')}>Run the proof first<span aria-hidden="true">›</span></button>
                <button type="button" onClick={() => keepCall('ROUTE-A', 'Rebuild now')}>Rebuild now<span aria-hidden="true">›</span></button>
                <button type="button" onClick={leaveOpen}>Leave this open<span aria-hidden="true">›</span></button>
              </div>
              <button type="button" className="mds-undo" onClick={() => setStep('result')}>Back</button>
            </div>
          ) : null}

          {step === 'recorded' ? (
            <div className="mds-result" data-testid="mobile-decision-recorded" ref={resultRef} tabIndex={-1}>
              <div className="mds-turn-head"><div className="mds-eyebrow">Your call</div><Check aria-hidden="true" /></div>
              <h2>{recordedCall ?? 'Decision left open'}</h2>
              <p className="mds-explanation">{recordedCall ? 'Held for this session only.' : 'No human decision was recorded.'} This synthetic proof has not written to a customer Brain or database.</p>
              <button type="button" className="mds-retry" onClick={() => setStep('call')}>Change my call</button>
            </div>
          ) : null}
        </section>
      </main>

        <DialogContent className="mds-basis" data-testid="mobile-decision-basis">
          <div className="mds-basis-head">
            <DialogClose asChild><button type="button">← Back</button></DialogClose>
            <span>Basis</span>
          </div>
          <div className="mds-basis-body">
            <div className="mds-eyebrow">Why this is the standing</div>
            <DialogTitle>{projection.basisTitle}</DialogTitle>
            <DialogDescription className="mds-basis-description">{projection.basisSummary}</DialogDescription>

            <section>
              <h3>Evidence</h3>
              <ul>{projection.evidence.map((source) => <li key={source.id}>{source.assertion}</li>)}</ul>
            </section>

            <section>
              <h3>Routes considered</h3>
              {projection.routes.map((route, index) => (
                <article className="mds-route" key={route.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p><strong>{route.label}{route.current ? ' · current view' : ''}</strong>{route.summary}</p>
                </article>
              ))}
            </section>

            <section>
              <h3>Case against</h3>
              <p>{projection.counterCase}</p>
            </section>

            <section>
              <h3>Sources and history</h3>
              <div className="mds-source-list">
                {projection.sources.map((source) => <p key={source.id}>{source.label}<span>{source.observed_at} · {source.audience.replace('_', ' ')}</span></p>)}
              </div>
            </section>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  )
}

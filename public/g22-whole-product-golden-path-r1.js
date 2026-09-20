const fixtureUrl = '/g22-whole-product-golden-path-fixture.json'
const workRegion = document.querySelector('#work-region')
const overlay = document.querySelector('#overlay')
const drawerTitle = document.querySelector('#drawer-title')
const drawerContent = document.querySelector('#drawer-content')
const toast = document.querySelector('#toast')
const storageKey = 'ctrl-g22-golden-path-r1'

const fixture = await fetch(fixtureUrl).then(response => {
  if (!response.ok) throw new Error('Fixture unavailable')
  return response.json()
})

const query = new URLSearchParams(location.search)
const scenario = query.get('scenario') || 'representative'
if (query.get('reset') === '1') localStorage.removeItem(storageKey)

const defaultState = {
  view: scenario === 'later' ? 'later' : scenario === 'corrected' ? 'brain' : scenario === 'rejected' ? 'rejected' : 'case',
  answer: null,
  route: 'prove',
  learning: scenario === 'corrected' || scenario === 'later' ? 'corrected' : scenario === 'rejected' ? 'rejected' : 'proposed',
  downloaded: false,
  events: [{
    id: 'EVT-001',
    type: 'Work arrived',
    at: '11 Sep · 09:00',
    text: 'Aperture House marketing operating plan v3 became the current case.'
  }]
}

if (['later', 'corrected', 'rejected'].includes(scenario)) {
  defaultState.answer = 'no'
  defaultState.events.push(
    { id: 'EVT-002', type: 'Answer recorded', at: '18 Sep · 13:31', text: 'Maya said more output does not count if she still has to redo the final version.' },
    { id: 'EVT-003', type: 'Call set by Maya', at: '18 Sep · 13:40', text: fixture.ownedCall.decision }
  )
  if (scenario === 'rejected') {
    defaultState.events.push({ id: 'EVT-004', type: 'Not learned', at: '18 Sep · 13:46', text: fixture.learning.rejected.text })
  } else {
    defaultState.events.push({ id: 'EVT-004', type: 'Corrected and accepted', at: '18 Sep · 13:46', text: fixture.learning.corrected.text })
    if (scenario === 'later') defaultState.events.push({ id: 'EVT-005', type: 'Used in later work', at: '1 Oct · 08:15', text: 'The Q4 launch approval plan changed because of the accepted boundary.' })
  }
}

let state = scenario === 'representative' ? loadState(defaultState) : defaultState

function loadState(fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey))
    return saved && saved.view ? { ...fallback, ...saved } : fallback
  } catch {
    return fallback
  }
}

function saveState() {
  if (scenario === 'representative') localStorage.setItem(storageKey, JSON.stringify(state))
}

function addEvent(type, text) {
  const next = state.events.length + 1
  state.events.push({ id: `EVT-${String(next).padStart(3, '0')}`, type, at: 'Now', text })
}

function setView(view) {
  state.view = view
  saveState()
  render()
  requestAnimationFrame(() => workRegion.focus({ preventScroll: true }))
}

function notify(message) {
  toast.textContent = message
  toast.classList.add('visible')
  clearTimeout(notify.timer)
  notify.timer = setTimeout(() => toast.classList.remove('visible'), 1800)
}

function money(value) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
}

function render() {
  if (scenario === 'quiet') return renderQuiet()
  if (scenario === 'sparse') return renderSparse()
  if (scenario === 'stale') return renderStale()
  if (state.view === 'decision') return renderDecision()
  if (state.view === 'call') return renderCall()
  if (state.view === 'correction') return renderCorrection()
  if (state.view === 'later') return renderLater()
  if (state.view === 'brain') return renderBrain()
  if (state.view === 'release') return renderRelease()
  if (state.view === 'rejected') return renderRejected()
  return renderCase()
}

function renderCase() {
  const question = fixture.question
  workRegion.innerHTML = `
    <section class="screen" aria-labelledby="case-title">
      <div class="case-heading">
        <div>
          <span class="object-label">Current decision</span>
          <h1 id="case-title">${fixture.case.decision.title}</h1>
          <p>${fixture.case.decision.timeHorizon} · board decision · evidence current to 11 September</p>
        </div>
        <div class="stakes" aria-label="Decision stakes">
          <div class="stake"><span>Operating budget</span><strong>${money(fixture.case.decision.operatingBudgetGbp)}</strong></div>
          <div class="stake"><span>People affected</span><strong>${fixture.case.decision.affectedRoles} roles</strong></div>
        </div>
      </div>

      <div class="case-grid">
        <article class="work-sheet">
          <div class="sheet-title"><h2>Marketing operating plan</h2><span class="standing">Current · v3</span></div>
          <p class="plan-call">Rebuild marketing around an AI-native operating model, then redesign the roles around the work that remains.</p>
          <p class="plan-note">The plan changes the team and the system together. The current measures still reward the old work.</p>
          <div class="impact-visual" aria-label="The decision connects a 1.2 million pound operating budget to eight affected roles">
            <span class="data-label">What this touches</span>
            <div class="impact-bar"></div>
            <div class="role-marks">${Array.from({ length: 8 }, (_, i) => `<span class="role-mark">${String(i + 1).padStart(2, '0')}</span>`).join('')}</div>
          </div>
          <div class="evidence-list">
            <div class="evidence"><span>Company</span><strong>The scorecard still rewards volume.</strong><button class="source-open" data-source="SRC-COMPANY-SCORECARD-01">Open source</button></div>
            <div class="evidence"><span>Customers</span><strong>The clear point of view is what people remember.</strong><button class="source-open" data-source="SRC-CUSTOMER-01">Open source</button></div>
            <div class="evidence"><span>Maya</span><strong>Clarity matters, but surprise must survive.</strong><button class="source-open" data-source="SRC-MAYA-STANDARD-01">Open source</button></div>
          </div>
        </article>

        <aside class="intervention">
          <div class="intervention-copy">
            <span class="object-label">What CTRL noticed</span>
            <h2>More output could hide the same old bottleneck.</h2>
            <p>Maya is happy to delegate generation. What is not yet proven is whether someone else can recognise the quality she would keep.</p>
            <div class="question">
              <h3>${question.prompt}</h3>
              <div class="choices">${question.options.map(option => `<button class="choice ${state.answer === option.id ? 'selected' : ''}" data-answer="${option.id}" type="button">${option.label}</button>`).join('')}</div>
              <div class="answer-effect ${state.answer ? 'visible' : ''}" id="answer-effect">
                <span>First gate</span>
                <p>${state.answer ? question.options.find(option => option.id === state.answer).effect : ''}</p>
              </div>
            </div>
          </div>
          <div class="action-row">
            <button class="primary-button" id="compare-routes" type="button" ${state.answer ? '' : 'disabled'}>Compare the routes <span>→</span></button>
            <button class="text-button" id="why-button" type="button">Why this question?</button>
          </div>
        </aside>
      </div>
    </section>`

  workRegion.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    state.answer = button.dataset.answer
    if (!state.events.some(event => event.type === 'Answer recorded')) {
      addEvent('Answer recorded', `Maya chose: ${button.textContent.trim()}`)
    }
    saveState()
    renderCase()
  }))
  workRegion.querySelector('#compare-routes')?.addEventListener('click', () => setView('decision'))
  workRegion.querySelector('#why-button')?.addEventListener('click', () => openSourceDrawer(['SRC-MAYA-DELEGATION-01', 'SRC-MAYA-STANDARD-01', 'SRC-COMPANY-SCORECARD-01']))
  bindSourceButtons()
}

function renderDecision() {
  const route = fixture.routes.find(item => item.id === state.route)
  workRegion.innerHTML = `
    <section class="screen wide-wrap" aria-labelledby="decision-work-title">
      <button class="back-button" id="back-case" type="button">← Back to the current case</button>
      <div class="state-head">
        <div><span class="object-label">Decision Table · earned from the current case</span><h1 id="decision-work-title">Compare three real operating routes.</h1></div>
        <p>Maya's answer changed the first gate. The choice now tests whether the new system can produce launch work without her final rescue.</p>
      </div>
      <div class="route-shell">
        <div class="lens"><span>First gate</span><strong>${fixture.question.options.find(option => option.id === state.answer)?.effect || fixture.question.options[0].effect}</strong></div>
        <div class="route-tabs" role="tablist">${fixture.routes.map(item => `<button class="route-tab ${state.route === item.id ? 'selected' : ''}" data-route="${item.id}" type="button" role="tab" aria-selected="${state.route === item.id}"><span>${item.standing}</span><strong>${item.label}</strong></button>`).join('')}</div>
        <div class="route-body">
          <article class="route-column"><span class="data-label">Route</span><h2>${route.summary}</h2><p>${route.id === 'prove' ? 'This creates a live comparison before the organisation commits to a full restructure.' : 'This remains a viable alternative with a materially different risk.'}</p><div class="route-fact"><span>Why it may work</span><strong>${route.strength}</strong></div></article>
          <article class="route-column"><span class="data-label">Strongest challenge</span><h3>${route.risk}</h3><p>${route.id === 'prove' ? 'The pilot must change both decision rights and measures. Otherwise it proves only that the same system can use newer tools.' : 'Maya should compare this against the live proof route, not dismiss it from preference.'}</p><div class="route-fact risk"><span>Evidence boundary</span><strong>Synthetic sources support comparison. They do not prove which route will succeed.</strong></div></article>
          <aside class="route-column action-column"><div><span class="data-label">What only Maya decides</span><h3>${route.id === 'prove' ? 'Is this the right first commitment?' : 'Does this risk deserve to lead?'}</h3><p>The choice sets the working call and the first stop rule. It does not release a company decision.</p></div><button class="primary-button" id="set-call" type="button">Use this route <span>→</span></button></aside>
        </div>
      </div>
    </section>`
  workRegion.querySelector('#back-case').addEventListener('click', () => setView('case'))
  workRegion.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => {
    state.route = button.dataset.route
    saveState()
    renderDecision()
  }))
  workRegion.querySelector('#set-call').addEventListener('click', () => {
    if (!state.events.some(event => event.type === 'Call set by Maya')) addEvent('Call set by Maya', fixture.routes.find(item => item.id === state.route).summary)
    state.learning = 'proposed'
    setView('call')
  })
}

function renderCall() {
  const selectedRoute = fixture.routes.find(item => item.id === state.route)
  workRegion.innerHTML = `
    <section class="screen wide-wrap" aria-labelledby="owned-call-title">
      <button class="back-button" id="back-decision" type="button">← Back to the comparison</button>
      <div class="state-head"><div><span class="object-label">Working call</span><h1 id="owned-call-title">Maya has set the first commitment.</h1></div><p>The decision is owned. CTRL is now asking permission to retain one reusable boundary from the reasoning.</p></div>
      <div class="call-grid">
        <article class="panel">
          <span class="owned-mark">Set by Maya</span>
          <p class="call-copy">${selectedRoute.summary}</p>
          <div class="rule-list">
            <div class="rule"><span>First gate</span><strong>${fixture.ownedCall.firstGate}</strong></div>
            <div class="rule"><span>Stop if</span><strong>${fixture.ownedCall.killCondition}</strong></div>
          </div>
        </article>
        <aside class="panel proposal">
          <span class="object-label">Proposed learning</span>
          <h2>Should CTRL use this in later work?</h2>
          <p class="proposal-text">${fixture.learning.proposal.text}</p>
          <div class="proposal-actions">
            <button class="small-button accept" id="accept-learning" type="button">Accept</button>
            <button class="small-button" id="correct-learning" type="button">Not quite</button>
            <button class="small-button reject" id="reject-learning" type="button">Reject</button>
          </div>
        </aside>
      </div>
    </section>`
  workRegion.querySelector('#back-decision').addEventListener('click', () => setView('decision'))
  workRegion.querySelector('#accept-learning').addEventListener('click', () => {
    state.learning = 'accepted'
    addEvent('Accepted by Maya', fixture.learning.proposal.text)
    setView('later')
  })
  workRegion.querySelector('#correct-learning').addEventListener('click', () => setView('correction'))
  workRegion.querySelector('#reject-learning').addEventListener('click', () => {
    state.learning = 'rejected'
    addEvent('Not learned', fixture.learning.rejected.text)
    setView('rejected')
  })
}

function renderCorrection() {
  workRegion.innerHTML = `
    <section class="screen wide-wrap" aria-labelledby="correction-title">
      <button class="back-button" id="back-call" type="button">← Back to the proposed learning</button>
      <div class="state-head"><div><span class="object-label">Maya's correction</span><h1 id="correction-title">Where does Maya keep the final call?</h1></div><p>The earlier proposal stays in history. This answer decides what CTRL may use later.</p></div>
      <div class="call-grid">
        <article class="panel proposal"><span class="object-label">Too broad</span><p class="proposal-text">${fixture.learning.proposal.text}</p><p class="plan-note">This interpretation is still proposed and cannot shape later work.</p></article>
        <article class="panel correction-box"><h3>Choose the boundary.</h3><div class="correction-options"><button class="choice" data-boundary="launch" type="button">Launch work only</button><button class="choice" data-boundary="all" type="button">All marketing work</button><button class="choice" data-boundary="custom" type="button">Name another boundary</button></div></article>
      </div>
    </section>`
  workRegion.querySelector('#back-call').addEventListener('click', () => setView('call'))
  workRegion.querySelector('[data-boundary="launch"]').addEventListener('click', () => {
    state.learning = 'corrected'
    addEvent('Corrected and accepted', fixture.learning.corrected.text)
    setView('later')
  })
  workRegion.querySelector('[data-boundary="all"]').addEventListener('click', () => {
    state.learning = 'accepted'
    addEvent('Accepted by Maya', fixture.learning.proposal.text)
    setView('later')
  })
  workRegion.querySelector('[data-boundary="custom"]').addEventListener('click', () => {
    notify('Voice and free-text boundary capture belongs in the built product.')
  })
}

function renderLater() {
  const corrected = state.learning === 'corrected'
  const acceptedText = corrected ? fixture.learning.corrected.text : fixture.learning.proposal.text
  const changedText = corrected ? fixture.laterPreparation.after : 'Final review for all marketing work: Maya.'
  if (!state.events.some(event => event.type === 'Used in later work')) addEvent('Used in later work', 'The Q4 launch approval plan changed because of Maya’s accepted learning.')
  saveState()
  workRegion.innerHTML = `
    <section class="screen wide-wrap" aria-labelledby="later-title">
      <div class="state-head"><div><span class="object-label">New work · 1 October</span><h1 id="later-title">The next preparation already knows the boundary.</h1></div><p>CTRL used one accepted version from the earlier decision. The exact change remains inspectable.</p></div>
      <div class="later-grid">
        <article class="panel document">
          <span class="data-label">Q4 launch approval plan</span>
          <h2>Who decides what ships?</h2>
          <div class="document-line">Weekly work: marketing lead uses the agreed quality check.</div>
          <div class="document-line changed">${changedText}</div>
          <div class="document-line">Customer evidence: blinded review before the launch gate.</div>
        </article>
        <aside class="panel because">
          <span class="object-label">Changed because Maya corrected the Brain</span>
          <h2>One judgement carried forward. No new interview.</h2>
          <p>The later plan uses the accepted boundary, not CTRL's first interpretation.</p>
          <div class="cause-join">
            <div class="cause-node"><span>Accepted by Maya</span><strong>${acceptedText}</strong></div>
            <div class="cause-line" aria-hidden="true"></div>
            <div class="cause-node"><span>Used here</span><strong>Final approval and weekly review now have different owners.</strong></div>
          </div>
          <button class="text-button" id="show-before" type="button">Show the earlier version</button>
          <div class="before-box" id="before-box"><strong>Before:</strong> ${fixture.laterPreparation.before}</div>
          <div class="action-row"><button class="primary-button" id="inspect-brain" type="button">Inspect the Living Brain <span>→</span></button></div>
        </aside>
      </div>
    </section>`
  workRegion.querySelector('#show-before').addEventListener('click', () => {
    const box = workRegion.querySelector('#before-box')
    box.classList.toggle('visible')
    workRegion.querySelector('#show-before').textContent = box.classList.contains('visible') ? 'Hide the earlier version' : 'Show the earlier version'
  })
  workRegion.querySelector('#inspect-brain').addEventListener('click', () => setView('brain'))
}

function renderBrain() {
  const isRejected = state.learning === 'rejected'
  const hasCall = state.events.some(event => event.type === 'Call set by Maya')
  const hasLaterUse = state.events.some(event => event.type === 'Used in later work')
  const hasResolvedLearning = hasCall && ['accepted', 'corrected', 'rejected'].includes(state.learning)
  const learningText = isRejected ? fixture.learning.rejected.text : state.learning === 'corrected' ? fixture.learning.corrected.text : fixture.learning.proposal.text
  const learningStanding = isRejected ? 'Rejected · not used' : state.learning === 'corrected' ? 'Corrected and accepted' : state.learning === 'accepted' ? 'Accepted by Maya' : 'Proposed · not used'
  const chain = [
    `<div class="brain-node"><div class="node-card personal"><span class="node-icon">01</span><h2>Maya's standard</h2><p>Make quality clear without killing surprise.</p><div class="node-meta">Maya · accepted · v2</div></div></div>`,
    hasCall
      ? `<div class="brain-node"><div class="node-card company"><span class="node-icon">02</span><h2>Owned decision</h2><p>${fixture.ownedCall.decision}</p><div class="node-meta">Aperture House · set by Maya · v1</div></div></div>`
      : `<div class="brain-node"><div class="node-card company"><span class="node-icon">02</span><h2>Current company work</h2><p>The marketing operating plan affects £1.2m and eight roles. No route is owned yet.</p><div class="node-meta">Aperture House · current · v3</div></div></div>`,
    hasResolvedLearning
      ? `<div class="brain-node"><div class="node-card ${isRejected ? 'proposed' : 'personal'}"><span class="node-icon">03</span><h2>${learningStanding}</h2><p>${learningText}</p><div class="node-meta">Maya · ${learningStanding} · ${state.learning === 'corrected' ? 'v2' : 'v1'}</div></div></div>`
      : `<div class="brain-node"><div class="node-card proposed"><span class="node-icon">03</span><h2>Still unknown</h2><p>Whether another person can ship launch work to Maya's standard without her rewriting it.</p><div class="node-meta">CTRL view · not learned</div></div></div>`
  ]
  if (hasLaterUse) chain.push(`<div class="brain-node"><div class="node-card company"><span class="node-icon">04</span><h2>${isRejected ? 'Later work unchanged' : 'Later work changed'}</h2><p>${isRejected ? fixture.laterPreparation.before : fixture.laterPreparation.after}</p><div class="node-meta">Aperture House · ${isRejected ? 'proposal excluded' : 'used by PREP-LAUNCH-022'}</div></div></div>`)
  const summary = !hasCall
    ? 'CTRL has enough evidence to ask one route-changing question. It has not recorded a decision or learning.'
    : isRejected
      ? 'The rejected proposal did not shape later work.'
      : hasLaterUse
        ? 'One accepted Maya judgement changed one later preparation.'
        : 'Maya has set the call. No accepted learning has changed later work yet.'
  workRegion.innerHTML = `
    <section class="screen wide-wrap" aria-labelledby="brain-title">
      <button class="back-button" id="back-current" type="button">← Back to the current work</button>
      <div class="state-head"><div><span class="object-label">Living Brain</span><h1 id="brain-title">What CTRL used, and what it changed.</h1></div><p>This is one projection of the current case. Every line below has an owner, standing and stored relationship.</p></div>
      <div class="brain-shell">
        <div class="brain-summary"><p><strong>${summary}</strong> Select History for the earlier wording and dated events.</p><span class="standing">Current projection</span></div>
        <div class="brain-chain brain-chain-${chain.length}">${chain.join('')}</div>
        <div class="ownership-seam"><div class="owner-lane"><span>Personal Brain</span><strong>Maya's standards, patterns, corrections and accepted boundaries remain hers.</strong></div><div class="owner-lane"><span>Company Brain</span><strong>Plans, evidence, decisions and outputs remain Aperture House material.</strong></div></div>
      </div>
      <div class="action-row">${hasCall ? `<button class="primary-button" id="prepare-copy" type="button">Prepare Maya's copy <span>→</span></button>` : ''}<button class="secondary-button" id="open-sources" type="button">Inspect sources</button></div>
    </section>`
  workRegion.querySelector('#back-current').addEventListener('click', () => setView(!hasCall ? 'case' : state.learning === 'rejected' ? 'rejected' : hasLaterUse ? 'later' : 'call'))
  workRegion.querySelector('#prepare-copy')?.addEventListener('click', () => setView('release'))
  workRegion.querySelector('#open-sources').addEventListener('click', () => openSourceDrawer(fixture.sources.map(source => source.id)))
}

function renderRelease() {
  workRegion.innerHTML = `
    <section class="screen wide-wrap" aria-labelledby="release-title">
      <button class="back-button" id="back-brain" type="button">← Back to the Living Brain</button>
      <div class="state-head"><div><span class="object-label">Portable Brain · version 1.3</span><h1 id="release-title">Maya can take the intelligence with her.</h1></div><p>The release preserves personal and company ownership, source standing, corrections and the exact later use.</p></div>
      <div class="release-grid">
        <article class="panel release-part"><span class="owned-mark">Owned by Maya</span><h2>Personal judgement</h2><div class="file-list"><div class="file-row"><strong>Quality standard</strong><span>Accepted · v2</span></div><div class="file-row"><strong>Comparison pattern</strong><span>Supported · v1</span></div><div class="file-row"><strong>Launch-only boundary</strong><span>Corrected · v2</span></div></div></article>
        <article class="panel release-part"><span class="owned-mark">Owned by Aperture House</span><h2>Company record</h2><div class="file-list"><div class="file-row"><strong>Marketing operating plan</strong><span>Current · v3</span></div><div class="file-row"><strong>Decision and first gate</strong><span>Set by Maya · v1</span></div><div class="file-row"><strong>Q4 launch preparation</strong><span>Uses learning v2</span></div></div></article>
      </div>
      <div class="action-row"><button class="primary-button" id="download-copy" type="button">Download Brain copy <span>↓</span></button><button class="secondary-button" id="inspect-manifest" type="button">Inspect manifest</button></div>
      <div class="download-ready ${state.downloaded ? 'visible' : ''}" id="download-ready">Downloaded locally. The file is a self-describing synthetic Brain bundle.</div>
    </section>`
  workRegion.querySelector('#back-brain').addEventListener('click', () => setView('brain'))
  workRegion.querySelector('#inspect-manifest').addEventListener('click', showManifest)
  workRegion.querySelector('#download-copy').addEventListener('click', downloadBrainCopy)
}

function renderRejected() {
  workRegion.innerHTML = `
    <section class="screen wide-wrap" aria-labelledby="rejected-title">
      <div class="state-head"><div><span class="object-label">Not learned</span><h1 id="rejected-title">Maya rejected the interpretation.</h1></div><p>The wording remains in history but cannot shape later work without new evidence.</p></div>
      <div class="later-grid">
        <article class="panel proposal"><span class="object-label">Rejected by Maya</span><p class="proposal-text">${fixture.learning.rejected.text}</p><span class="standing">Inactive</span></article>
        <article class="panel document"><span class="data-label">Q4 launch approval plan</span><h2>No hidden rewrite</h2><div class="document-line changed">${fixture.laterPreparation.before}</div><div class="document-line">CTRL did not apply the rejected proposal.</div></article>
      </div>
      <div class="action-row"><button class="primary-button" id="inspect-rejected-brain" type="button">Inspect the Living Brain <span>→</span></button><button class="secondary-button" id="restart-learning" type="button">Return to the proposal</button></div>
    </section>`
  workRegion.querySelector('#inspect-rejected-brain').addEventListener('click', () => setView('brain'))
  workRegion.querySelector('#restart-learning').addEventListener('click', () => setView('call'))
}

function renderQuiet() {
  workRegion.innerHTML = `<section class="screen empty-state"><span class="object-label">Weekly marketing work</span><h1>Nothing needs Maya today.</h1><p>CTRL found no consequential choice that earns an interruption. The current evidence and accepted standards remain available in the Living Brain.</p></section>`
}

function renderSparse() {
  workRegion.innerHTML = `<section class="screen empty-state"><span class="object-label">Evidence boundary</span><h1>Not enough evidence to advise this call.</h1><p>The operating plan is present, but CTRL has no accepted Maya-specific standard for judging the result. It has not invented one.</p><div class="missing-list"><div class="missing-row">Present: current company plan and decision stakes</div><div class="missing-row">Missing: Maya's accepted quality criterion</div><div class="missing-row">Blocked: route recommendation and later learning</div></div><div class="action-row"><button class="secondary-button" id="sparse-sources" type="button">Review what is present</button></div></section>`
  workRegion.querySelector('#sparse-sources').addEventListener('click', () => openSourceDrawer(['SRC-COMPANY-PLAN-01']))
}

function renderStale() {
  workRegion.innerHTML = `<section class="screen empty-state"><span class="object-label">Source needs checking</span><h1>The scorecard is too old for this call.</h1><p>CTRL excluded it before comparing the routes. Without a current measure of success, the pilot recommendation is paused.</p><div class="missing-list"><div class="missing-row">Excluded: Company scorecard v2</div><div class="missing-row">Reason: freshness date passed</div><div class="missing-row">Effect: first gate cannot be released</div></div><div class="action-row"><button class="secondary-button" id="stale-source" type="button">Inspect the source</button></div></section>`
  workRegion.querySelector('#stale-source').addEventListener('click', () => openSourceDrawer(['SRC-COMPANY-SCORECARD-01'], true))
}

function bindSourceButtons() {
  workRegion.querySelectorAll('[data-source]').forEach(button => button.addEventListener('click', () => openSourceDrawer([button.dataset.source])))
}

function openSourceDrawer(ids, forceStale = false) {
  const sources = ids.map(id => fixture.sources.find(source => source.id === id)).filter(Boolean)
  drawerTitle.textContent = sources.length === 1 ? 'Source record' : 'Evidence behind this'
  drawerContent.innerHTML = sources.map(source => `<article class="source-record"><span>${source.origin} · ${forceStale ? 'Stale' : source.standing} · v${source.version}</span><strong>${source.claim}</strong><p>Owner: ${source.owner}<br>Recorded: ${new Date(source.recordedAt).toLocaleDateString('en-GB')} · ID: ${source.id}</p></article>`).join('')
  openOverlay()
}

function showHistory() {
  drawerTitle.textContent = 'Case history'
  drawerContent.innerHTML = state.events.slice().reverse().map(event => `<article class="history-event"><span>${event.at} · ${event.type}</span><strong>${event.text}</strong><p>${event.id} · synthetic local event</p></article>`).join('')
  openOverlay()
}

function showManifest() {
  drawerTitle.textContent = 'Brain copy manifest'
  drawerContent.innerHTML = `<article class="source-record"><span>Personal · Maya Chen</span><strong>Accepted standards, supported patterns, corrections and current learning versions</strong></article><article class="source-record"><span>Company · Aperture House</span><strong>Source index, decision record, evidence boundaries and later outputs</strong></article><article class="source-record"><span>History</span><strong>Append-only local events, superseded wording and stored relationships</strong></article><article class="source-record"><span>Format</span><strong>Self-describing JSON proof bundle · schema ${fixture.schemaVersion}</strong><p>Synthetic demonstration data only.</p></article>`
  openOverlay()
}

function openOverlay() {
  overlay.hidden = false
  document.body.style.overflow = 'hidden'
  document.querySelector('#drawer-close').focus()
}

function closeOverlay() {
  overlay.hidden = true
  document.body.style.overflow = ''
}

function downloadBrainCopy() {
  const bundle = {
    manifest: {
      schemaVersion: fixture.schemaVersion,
      synthetic: true,
      subject: fixture.case.person.name,
      company: fixture.case.company.name,
      exportedAt: new Date().toISOString(),
      sections: ['personalBrain', 'companyBrain', 'history', 'relationships']
    },
    personalBrain: {
      standards: fixture.sources.filter(source => source.owner === 'Maya Chen'),
      currentLearning: state.learning === 'corrected' ? fixture.learning.corrected : state.learning === 'rejected' ? fixture.learning.rejected : fixture.learning.proposal
    },
    companyBrain: {
      sources: fixture.sources.filter(source => source.owner === 'Aperture House'),
      decision: fixture.ownedCall,
      laterPreparation: state.learning === 'rejected' ? { ...fixture.laterPreparation, after: fixture.laterPreparation.before, changedBecauseOf: null } : fixture.laterPreparation
    },
    history: state.events,
    relationships: fixture.brainProjection.relationships
  }
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'maya-chen-living-brain-v1.3.synthetic.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  state.downloaded = true
  if (!state.events.some(event => event.type === 'Brain copy downloaded')) addEvent('Brain copy downloaded', 'Maya downloaded Living Brain version 1.3 as a local synthetic bundle.')
  saveState()
  renderRelease()
  notify('Brain copy downloaded')
}

document.querySelector('#history-button').addEventListener('click', showHistory)
document.querySelector('#brain-button').addEventListener('click', () => setView('brain'))
document.querySelector('#drawer-close').addEventListener('click', closeOverlay)
overlay.addEventListener('click', event => { if (event.target === overlay) closeOverlay() })
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !overlay.hidden) closeOverlay() })

render()

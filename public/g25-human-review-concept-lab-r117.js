(function () {
  const app = document.getElementById('app')
  const params = new URLSearchParams(window.location.search)
  const candidate = ['stone', 'edit', 'rehearsal'].includes(params.get('candidate')) ? params.get('candidate') : 'stone'
  const initialState = ['ready', 'approved', 'rejected', 'stale', 'reversed', 'loading', 'error', 'long'].includes(params.get('state')) ? params.get('state') : 'ready'

  const fixture = {
    person: 'Maya Chen',
    company: 'Aperture House',
    surface: 'Customer proposals',
    current: 'Maya reviews every customer-facing proposal before it leaves the team.',
    proposed: 'Maya reviews high-stakes proposals. Routine proposals can move when the named customer proof and agreed quality checks are present.',
    long: 'Maya reviews high-stakes customer proposals, any proposal that changes the company promise and any proposal where the named customer proof is incomplete. Routine proposals can move without her final review only when the proof is present, every agreed quality check passes and the owner accepts responsibility for the result.',
    consequence: 'Routine proposals could move without waiting for Maya. High-stakes work would still need her final review.',
    sources: [
      {
        date: '14 September',
        title: 'The proof was already clear in the comparison table.',
        detail: 'Maya rejected the first draft, then approved the same route after seeing the customer proof that was already attached.',
      },
      {
        date: '11 September',
        title: 'The second proposal stalled for the same reason.',
        detail: 'The team waited for Maya even though the named proof and every agreed quality check were present.',
      },
    ],
  }

  let state = initialState
  let sheet = null
  let rehearsalChoice = null
  let longReviewed = initialState !== 'long'
  let returnFocusAction = null

  function icon() {
    return '<svg class="mark" viewBox="0 0 200 200" role="img" aria-label="Mindmaker CTRL"><defs><linearGradient id="r117-mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9dedcb"/><stop offset="1" stop-color="#2d8b72"/></linearGradient></defs><rect x="48" y="100" width="50" height="50" fill="url(#r117-mark)"/><rect x="102" y="100" width="50" height="50" fill="url(#r117-mark)"/><polygon points="65,96 81,96 89,72 57,72" fill="url(#r117-mark)"/><polygon points="114,96 138,96 148,52 104,52" fill="url(#r117-mark)"/></svg>'
  }

  function shell(content) {
    return '<div class="app-shell"><header class="topbar"><div class="identity">' + icon() + '<div class="person"><strong>' + fixture.person + '</strong><span>' + fixture.company + '</span></div></div><div class="top-actions"><span class="proof-stamp">Synthetic preview</span></div></header><main class="main">' + content + '</main></div>' + renderSheet()
  }

  function actions(useLabel) {
    const needsLongRead = state === 'long' && !longReviewed
    const primaryLabel = needsLongRead ? 'Review exact wording' : useLabel
    return '<div class="actions"><button class="primary" type="button" data-action="' + (needsLongRead ? 'details' : 'approve') + '">' + primaryLabel + '</button><button class="secondary" type="button" data-action="reject">Keep my current rule</button></div>'
  }

  function stone() {
    const rule = state === 'long' ? fixture.long : fixture.proposed
    return '<section class="decision" aria-labelledby="question"><h1 class="question" id="question">Should your Brain use this rule?</h1><article class="rule-card"><div class="evidence-notches" aria-hidden="true"><span class="evidence-notch"></span><span class="evidence-notch"></span></div><div class="rule-label">Proposed rule for ' + fixture.surface + '</div><p class="rule-text">' + rule + '</p><p class="rule-note">' + fixture.consequence + '</p></article><div class="evidence-line"><span class="evidence-count">Suggested after 2 reviews</span><button class="text-button" type="button" data-action="evidence">Why this came up</button></div>' + actions('Use this rule') + '<p class="footnote">No data is saved in this proof</p></section>'
  }

  function edit() {
    const after = state === 'long' ? fixture.long : fixture.proposed
    return '<section class="decision" aria-labelledby="question"><h1 class="question" id="question">One edit to your proposal standard</h1><p class="intro">Two recent reviews suggest your current rule may be wider than you mean.</p><div class="edit-object"><div class="edit-row before"><div class="meta-label">Current</div><p>' + fixture.current + '</p></div><div class="edit-row after"><div class="meta-label">Proposed</div><p>' + after + '</p></div></div><div class="impact-pair" aria-label="What changes"><div class="impact-cell"><span>Routine work</span><strong>Waits for Maya</strong></div><div class="impact-arrow" aria-hidden="true">→</div><div class="impact-cell"><span>Routine work</span><strong>Moves when proof is present</strong></div></div><div class="evidence-line"><span class="evidence-count">Based on 2 reviews</span><button class="text-button" type="button" data-action="evidence">See the evidence</button></div>' + actions('Use the edited rule') + '<p class="footnote">No data is saved in this proof</p></section>'
  }

  function rehearsal() {
    if (!rehearsalChoice) {
      return '<section class="decision rehearsal" aria-labelledby="question"><h1 class="question" id="question">A routine proposal has the proof you asked for. Who makes the last call?</h1><p class="case-line">The customer proof is named. Every agreed quality check has passed. The work is not high stakes.</p><div class="flow-map"><div class="flow-node"><span>Proposal</span><strong>Proof and checks are present</strong></div><div class="flow-join" aria-hidden="true"></div><div class="flow-node"><span>Last call</span><strong>Choose who decides</strong></div></div><div class="choices"><button class="choice" type="button" data-choice="team"><span>Route one</span><strong>The team can move it</strong></button><button class="choice" type="button" data-choice="maya"><span>Route two</span><strong>I still review it</strong></button></div><button class="text-button" type="button" data-action="evidence">Why are you asking?</button><p class="footnote">No data is saved in this proof</p></section>'
    }
    const team = rehearsalChoice === 'team'
    const outcome = team ? fixture.proposed : fixture.current
    const note = team ? fixture.consequence : 'Every customer-facing proposal would continue to wait for Maya.'
    const primary = team ? '<button class="primary" type="button" data-action="approve">Use this rule</button>' : '<button class="primary" type="button" data-action="reject">Keep my current rule</button>'
    return '<section class="decision rehearsal" aria-labelledby="question"><button class="text-button" type="button" data-action="back">← Change my answer</button><div class="confirm-block"><h1 class="question" id="question">Then this is the rule</h1><article class="rule-card"><div class="rule-label">' + (team ? 'Proposed' : 'Current') + ' rule for ' + fixture.surface + '</div><p class="rule-text">' + outcome + '</p><p class="rule-note">' + note + '</p></article><div class="actions">' + primary + '</div></div><p class="footnote">No data is saved in this proof</p></section>'
  }

  function stateView() {
    const states = {
      approved: { cls: '', icon: '✓', title: 'Rule updated', copy: 'Routine proposals can now move when the proof and agreed checks are present.', primary: 'Done', primaryAction: 'done', secondary: 'Put the old rule back', secondAction: 'reverse' },
      rejected: { cls: '', icon: '✓', title: 'Current rule kept', copy: 'Every customer-facing proposal will still wait for Maya\'s final review.', primary: 'Done', primaryAction: 'done' },
      reversed: { cls: '', icon: '↶', title: 'Old rule restored', copy: 'Every customer-facing proposal will again wait for Maya\'s final review.', primary: 'Done', primaryAction: 'done' },
      stale: { cls: 'stale', icon: '↻', title: 'This rule changed while you were reviewing it', copy: 'Nothing changed from this screen.', primary: 'Review the latest rule', primaryAction: 'latest' },
      error: { cls: 'error', icon: '!', title: 'We could not save your choice', copy: 'Your rule has not changed.', primary: 'Try again', primaryAction: 'retry', secondary: 'Close', secondAction: 'done' },
    }
    const item = states[state]
    return '<section class="decision"><article class="state-card ' + item.cls + '"><div class="state-icon" aria-hidden="true">' + item.icon + '</div><h1>' + item.title + '</h1><p>' + item.copy + '</p><div class="actions"><button class="primary" type="button" data-action="' + item.primaryAction + '">' + item.primary + '</button>' + (item.secondary ? '<button class="secondary" type="button" data-action="' + item.secondAction + '">' + item.secondary + '</button>' : '') + '</div></article><p class="footnote">No data is saved in this proof</p></section>'
  }

  function loading() {
    return '<section class="loading-card" aria-label="Loading this change"><div class="meta-label">Checking the latest rule</div><div class="skeleton wide"></div><div class="skeleton"></div><div class="skeleton mid"></div><div class="skeleton short"></div></section>'
  }

  function renderSheet() {
    if (!sheet) return '<div class="overlay" hidden></div>'
    const evidence = '<div class="overlay" data-overlay><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-header"><h2 id="sheet-title">Why this came up</h2><button class="icon-button" type="button" data-action="close-sheet" aria-label="Close evidence">×</button></div><p class="sheet-intro">Twice, the current rule stopped routine work even though the proof and agreed checks were already present.</p><div class="source-list">' + fixture.sources.map((source) => '<article class="source"><time>' + source.date + '</time><strong>' + source.title + '</strong><p>' + source.detail + '</p></article>').join('') + '</div><div class="alternative"><strong>Another possible reason</strong><p>The quality checks may be too weak. The current rule may still be right.</p></div><button class="text-button" type="button" data-action="details">See the exact change</button></section></div>'
    const details = '<div class="overlay" data-overlay><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-header"><h2 id="sheet-title">The exact change</h2><button class="icon-button" type="button" data-action="close-sheet" aria-label="Close exact change">×</button></div><div class="detail-section"><h3>Current rule</h3><p>' + fixture.current + '</p></div><div class="detail-section"><h3>Proposed rule</h3><p>' + (state === 'long' ? fixture.long : fixture.proposed) + '</p></div><div class="detail-section"><h3>What changes</h3><p>' + fixture.consequence + '</p></div><div class="detail-section"><h3>Can I undo it?</h3><p>Yes, while this is still the latest change. Both versions stay in your history.</p></div><div class="record">review packet: 7e2c…91af<br>planned standard: 12b4…e883<br>checked: passed<br>publication: not authorised</div><button class="text-button" type="button" data-action="evidence">Back to evidence</button></section></div>'
    return sheet === 'evidence' ? evidence : details
  }

  function render() {
    let content
    if (state === 'loading') content = loading()
    else if (state !== 'ready' && state !== 'long') content = stateView()
    else if (candidate === 'edit') content = edit()
    else if (candidate === 'rehearsal') content = rehearsal()
    else content = stone()
    app.innerHTML = shell(content)
    bind()
  }

  function vibrate() {
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  function bind() {
    app.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action
        if (action === 'evidence') { returnFocusAction = 'evidence'; sheet = 'evidence' }
        if (action === 'details') { returnFocusAction = returnFocusAction || 'details'; sheet = 'details'; longReviewed = true }
        if (action === 'close-sheet') sheet = null
        if (action === 'approve') { state = 'approved'; sheet = null; vibrate() }
        if (action === 'reject') { state = 'rejected'; sheet = null; vibrate() }
        if (action === 'reverse') state = 'reversed'
        if (action === 'back') rehearsalChoice = null
        if (action === 'done' || action === 'latest' || action === 'retry') { state = initialState === 'long' ? 'long' : 'ready'; rehearsalChoice = null; sheet = null }
        render()
        if (action === 'close-sheet' && returnFocusAction) {
          const trigger = app.querySelector('[data-action="' + returnFocusAction + '"]')
          if (trigger) trigger.focus()
          returnFocusAction = null
        }
      })
    })
    app.querySelectorAll('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => { rehearsalChoice = button.dataset.choice; vibrate(); render() })
    })
    const dialog = app.querySelector('[role="dialog"]')
    if (dialog) {
      app.querySelector('.topbar').setAttribute('inert', '')
      app.querySelector('.topbar').setAttribute('aria-hidden', 'true')
      app.querySelector('.main').setAttribute('inert', '')
      app.querySelector('.main').setAttribute('aria-hidden', 'true')
      const close = dialog.querySelector('[data-action="close-sheet"]')
      if (close) close.focus()
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sheet) { sheet = null; render() }
    if (event.key === 'Tab' && sheet) {
      const dialog = app.querySelector('[role="dialog"]')
      const focusable = dialog ? [...dialog.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')] : []
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
  })

  render()
})()

(function () {
  const app = document.getElementById('app')
  const params = new URLSearchParams(window.location.search)
  const allowedStates = ['ready', 'approved', 'rejected', 'stale', 'reversed', 'loading', 'error', 'long']
  const requestedState = allowedStates.includes(params.get('state')) ? params.get('state') : 'ready'

  const fixture = {
    person: 'Maya Chen',
    company: 'Aperture House',
    surface: 'Proposal review',
    current: 'Review every customer-facing proposal before it leaves the team.',
    proposed: 'Review proposals above £250,000 or changes to the company promise. The team can send the rest once the customer result, evidence and owner are named.',
    long: 'Review proposals above £250,000, changes to the company promise and any proposal where the evidence comes from one unverified source. The team can send the rest only when the customer result, evidence source, accountable owner and stop condition are named.',
    consequence: 'Routine work moves. The biggest customer and brand risks still wait for you.',
    sources: [
      {
        date: '14 September',
        title: 'A £90,000 renewal proposal waited 36 hours.',
        detail: 'Maya approved it without changes after checking the customer quote and renewal forecast already attached.',
      },
      {
        date: '11 September',
        title: 'A £120,000 expansion proposal waited a day.',
        detail: 'The customer result, evidence source and proposal owner were already named.',
      },
    ],
  }

  let state = requestedState
  let disclosureOpen = false
  let returnFocus = false
  let longReviewed = requestedState !== 'long'
  let saveTimer = null

  function mark() {
    return '<svg class="mark" viewBox="0 0 200 200" role="img" aria-label="Mindmaker CTRL"><defs><linearGradient id="r117-mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9dedcb"/><stop offset="1" stop-color="#2d8b72"/></linearGradient></defs><rect x="48" y="100" width="50" height="50" fill="url(#r117-mark)"/><rect x="102" y="100" width="50" height="50" fill="url(#r117-mark)"/><polygon points="65,96 81,96 89,72 57,72" fill="url(#r117-mark)"/><polygon points="114,96 138,96 148,52 104,52" fill="url(#r117-mark)"/></svg>'
  }

  function shell(content) {
    return '<div class="app-shell"><header class="topbar"><div class="identity">' + mark() + '<div class="person"><strong>' + fixture.person + '</strong><span>' + fixture.company + '</span></div></div></header><main class="main">' + content + '</main></div>' + disclosure()
  }

  function readyView() {
    const exactRule = state === 'long' ? fixture.long : fixture.proposed
    const primaryAction = state === 'long' && !longReviewed ? 'review-long' : 'approve'
    const primaryLabel = state === 'long' && !longReviewed ? 'Review exact wording' : 'Make this my proposal rule'
    return '<section class="decision" aria-labelledby="review-question"><h1 class="question" id="review-question">Should this be your proposal rule?</h1><article class="rule-card"><div class="evidence-notches" aria-hidden="true"><span class="evidence-notch"></span><span class="evidence-notch"></span></div><div class="rule-label meta-label">Proposed rule</div><p class="rule-text">' + exactRule + '</p><p class="rule-note">' + fixture.consequence + '</p></article><div class="evidence-line"><span class="evidence-count">2 recent proposal reviews</span><button class="text-button" type="button" data-action="open-disclosure">See why</button></div><p class="owner-line">Only you can change this. The old version stays in your history. You can put it back until this rule changes again.</p><div class="actions"><button class="primary" type="button" data-action="' + primaryAction + '">' + primaryLabel + '</button><button class="secondary" type="button" data-action="reject">Keep my current rule</button></div><p class="footnote">Synthetic preview. No data is saved.</p></section>'
  }

  function savingView() {
    const exactRule = requestedState === 'long' ? fixture.long : fixture.proposed
    return '<section class="decision" aria-labelledby="review-question"><h1 class="question" id="review-question">Should this be your proposal rule?</h1><article class="rule-card"><div class="rule-label meta-label">Proposed rule</div><p class="rule-text">' + exactRule + '</p><p class="rule-note">' + fixture.consequence + '</p></article><div class="actions"><button class="primary" type="button" disabled>Saving your choice</button></div><p class="footnote">Synthetic preview. No data is saved.</p></section>'
  }

  function reverseConfirmView() {
    return '<section class="decision"><article class="state-card stale"><div class="state-icon" aria-hidden="true">↶</div><h1 tabindex="-1" data-result-heading>Put the previous rule back?</h1><p>' + fixture.current + '</p><p>Every customer-facing proposal will wait for your final review again. Both versions stay in your history.</p><div class="actions"><button class="primary" type="button" data-action="confirm-reverse">Restore the previous rule</button><button class="secondary" type="button" data-action="cancel-reverse">Cancel</button></div></article><p class="footnote">Synthetic preview. No data is saved.</p></section>'
  }

  function resultView() {
    const results = {
      approved: { cls: '', icon: '✓', title: 'Proposal rule updated', copy: 'Routine proposals can now move when the result, evidence and owner are named.', primary: 'Done', primaryAction: 'reset', secondary: 'Put the old rule back', secondAction: 'reverse' },
      rejected: { cls: '', icon: '✓', title: 'Current rule kept', copy: 'Every customer-facing proposal will still wait for your final review.', primary: 'Done', primaryAction: 'reset' },
      reversed: { cls: '', icon: '↶', title: 'Previous rule restored', copy: 'Every customer-facing proposal will again wait for your final review.', primary: 'Done', primaryAction: 'reset' },
      stale: { cls: 'stale', icon: '↻', title: 'This rule changed while you were reviewing it', copy: 'Nothing changed from this screen.', primary: 'Review the latest rule', primaryAction: 'reset' },
      error: { cls: 'error', icon: '!', title: 'We could not save your choice', copy: 'Your rule has not changed.', primary: 'Try again', primaryAction: 'reset' },
    }
    const item = results[state]
    return '<section class="decision"><article class="state-card ' + item.cls + '" role="status"><div class="state-icon" aria-hidden="true">' + item.icon + '</div><h1 tabindex="-1" data-result-heading>' + item.title + '</h1><p>' + item.copy + '</p><div class="actions"><button class="primary" type="button" data-action="' + item.primaryAction + '">' + item.primary + '</button>' + (item.secondary ? '<button class="secondary" type="button" data-action="' + item.secondAction + '">' + item.secondary + '</button>' : '') + '</div></article><p class="footnote">Synthetic preview. No data is saved.</p></section>'
  }

  function loadingView() {
    return '<section class="loading-card" aria-label="Loading the latest rule"><div class="loading-label meta-label">Checking the latest rule</div><div class="skeleton wide"></div><div class="skeleton"></div><div class="skeleton mid"></div><div class="skeleton short"></div></section>'
  }

  function disclosure() {
    if (!disclosureOpen) return '<div class="overlay" hidden></div>'
    const proposed = state === 'long' ? fixture.long : fixture.proposed
    return '<div class="overlay" data-overlay><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="disclosure-title"><div class="sheet-header"><h2 id="disclosure-title">Why this came up</h2><button class="icon-button" type="button" data-action="close-disclosure" aria-label="Close review details">×</button></div><p class="sheet-intro">The exact change and the two proposal reviews behind it.</p><div class="change-block"><article class="change-row"><h3>Current rule</h3><p>' + fixture.current + '</p></article><article class="change-row proposed"><h3>Proposed rule</h3><p>' + proposed + '</p></article></div><article class="effect"><h3>What changes</h3><p>' + fixture.consequence + '</p></article><div class="source-list">' + fixture.sources.map((source) => '<article class="source"><time>' + source.date + '</time><strong>' + source.title + '</strong><p>' + source.detail + '</p></article>').join('') + '</div><div class="alternative"><strong>Another possible reason</strong><p>The team may already know what Maya would choose. The current rule may still be protecting quality.</p></div><p class="reversal-note">This changes only your private Brain standard. It does not publish or deploy anything. The old version stays in your history. You can put it back until this rule changes again.</p><details class="technical"><summary>Technical record</summary><p class="record">synthetic review packet: 7e2c…91af<br>synthetic planned standard: 12b4…e883<br>check: passed<br>publication: not authorised</p></details></section></div>'
  }

  function render(options) {
    let content
    if (state === 'loading') content = loadingView()
    else if (state === 'saving') content = savingView()
    else if (state === 'ready' || state === 'long') content = readyView()
    else if (state === 'reverse-confirm') content = reverseConfirmView()
    else content = resultView()
    app.innerHTML = shell(content)
    bind()
    if (options && options.focusResult) {
      const heading = app.querySelector('[data-result-heading]')
      if (heading) heading.focus()
    }
    if (options && options.restoreDisclosureFocus) {
      const trigger = app.querySelector('[data-action="open-disclosure"]')
      if (trigger) trigger.focus()
    }
  }

  function vibrate() {
    if ('vibrate' in navigator) navigator.vibrate(10)
  }

  function openDisclosure() {
    returnFocus = true
    disclosureOpen = true
    render()
    const close = app.querySelector('[data-action="close-disclosure"]')
    if (close) close.focus()
  }

  function closeDisclosure() {
    disclosureOpen = false
    const shouldRestore = returnFocus
    returnFocus = false
    render({ restoreDisclosureFocus: shouldRestore })
  }

  function approve() {
    state = 'saving'
    disclosureOpen = false
    render()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      state = 'approved'
      vibrate()
      render({ focusResult: true })
    }, 420)
  }

  function bind() {
    const background = app.querySelectorAll('.topbar, .main')
    const dialog = app.querySelector('[role="dialog"]')
    if (dialog) {
      background.forEach((element) => { element.setAttribute('inert', ''); element.setAttribute('aria-hidden', 'true') })
    }
    app.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action
        if (action === 'open-disclosure') openDisclosure()
        if (action === 'close-disclosure') closeDisclosure()
        if (action === 'review-long') { longReviewed = true; openDisclosure() }
        if (action === 'approve') approve()
        if (action === 'reject') { state = 'rejected'; vibrate(); render({ focusResult: true }) }
        if (action === 'reverse') { state = 'reverse-confirm'; render({ focusResult: true }) }
        if (action === 'confirm-reverse') { state = 'reversed'; vibrate(); render({ focusResult: true }) }
        if (action === 'cancel-reverse') { state = 'approved'; render({ focusResult: true }) }
        if (action === 'reset') { state = requestedState === 'long' ? 'long' : 'ready'; disclosureOpen = false; render() }
      })
    })
  }

  document.addEventListener('keydown', (event) => {
    if (!disclosureOpen) return
    if (event.key === 'Escape') { event.preventDefault(); closeDisclosure(); return }
    if (event.key !== 'Tab') return
    const dialog = app.querySelector('[role="dialog"]')
    const focusable = dialog ? [...dialog.querySelectorAll('button, summary, [href], [tabindex]:not([tabindex="-1"])')] : []
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  })

  render()
})()

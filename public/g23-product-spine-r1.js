const choiceCopy = {
  carry: {
    label: 'Carries with a condition',
    text: 'The rule for what must stay human may guide this people decision, but the role design must also replace volume-led measures before the judgement can shape the call.'
  },
  change: {
    label: 'Changed for this decision',
    text: 'AI may own first drafts. A named human owns customer consequence and final release. The narrower version can now prepare this people decision.'
  },
  stay: {
    label: 'Kept in its original arena',
    text: 'This judgement remains useful for organisation design. It will not shape the people decision until a different rule for what stays human earns standing.'
  }
}

const choiceButtons = [...document.querySelectorAll('[data-choice]')]
const choiceResult = document.querySelector('.choice-result')

choiceButtons.forEach(button => {
  button.addEventListener('click', () => {
    const choice = button.dataset.choice
    const result = choiceCopy[choice]
    choiceButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)))
    choiceResult.innerHTML = `<strong>${result.label}</strong>${result.text}`
    choiceResult.hidden = false
    document.body.classList.add('has-choice')
  })
})

document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => {
    const detail = document.getElementById(button.dataset.open)
    if (!detail) return
    detail.open = true
    detail.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    detail.querySelector('summary')?.focus({ preventScroll: true })
  })
})

document.querySelectorAll('details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return
    document.querySelectorAll('details').forEach(other => {
      if (other !== detail) other.open = false
    })
  })
})

const scenario = new URLSearchParams(location.search).get('state')
const stateSection = document.querySelector('.states')
const crossing = document.querySelector('.crossing')

if (scenario && ['quiet', 'sparse', 'contradiction'].includes(scenario)) {
  crossing.hidden = true
  stateSection.hidden = false
  document.querySelector(`.${scenario}-state`).style.display = 'block'
}

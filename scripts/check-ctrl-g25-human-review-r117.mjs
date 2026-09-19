import fs from 'node:fs'

const html = fs.readFileSync(new URL('../public/g25-human-review-r117.html', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../public/g25-human-review-r117.css', import.meta.url), 'utf8')
const js = fs.readFileSync(new URL('../public/g25-human-review-r117.js', import.meta.url), 'utf8')
const all = `${html}\n${css}\n${js}`

const required = [
  'Should this be your proposal rule?',
  'Make this my proposal rule',
  'Keep my current rule',
  'Only you can change this.',
  'Current rule',
  'Proposed rule',
  'Another possible reason',
  'This changes only your private Brain standard.',
  'Put the previous rule back?',
  'Synthetic preview. No data is saved.',
]

for (const phrase of required) {
  if (!js.includes(phrase)) throw new Error(`missing R117 contract phrase: ${phrase}`)
}

for (const forbidden of ['quality checks', 'AI recommends', 'confidence score', 'profile complete', 'One move has earned']) {
  if (all.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`forbidden R117 phrase: ${forbidden}`)
}

if (all.includes('—') || all.includes('–')) throw new Error('dash outside the CTRL copy contract found')
if (!html.includes('noindex,nofollow,noarchive')) throw new Error('synthetic proof is indexable')
if (!css.includes('@media (prefers-reduced-motion: reduce)')) throw new Error('reduced motion contract missing')
if (!css.includes('min-height: 100dvh')) throw new Error('mobile full-page disclosure contract missing')
if (!js.includes("event.key === 'Escape'")) throw new Error('Escape recovery missing')
if (!js.includes("event.key !== 'Tab'")) throw new Error('focus trap missing')
if (!js.includes("setAttribute('inert'")) throw new Error('background inertness missing')
if (!js.includes("focusResult: true")) throw new Error('result focus contract missing')
if (!js.includes("state = 'saving'")) throw new Error('single inline saving state missing')
if (!js.includes("state = 'reverse-confirm'")) throw new Error('reversal confirmation missing')
if (/font-size:\s*[0-9](?:px)/.test(css)) {
  const tiny = [...css.matchAll(/font-size:\s*([0-9.]+)px/g)].filter((match) => Number(match[1]) < 9)
  if (tiny.length) throw new Error('font size below 9px found')
}

console.log('ok: R117 human review copy, authority, disclosure and accessibility contracts passed')

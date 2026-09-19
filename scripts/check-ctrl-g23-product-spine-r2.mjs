import fs from 'node:fs'

const html = fs.readFileSync(new URL('../public/g23-product-spine-r2.html', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../public/g23-product-spine-r2.css', import.meta.url), 'utf8')

const required = [
  'CTRL is a private AI Brain built with one leader over 30 days.',
  'The company pays for a leader who can redesign how the business works with AI',
  'Brain prepares',
  'Krish challenges',
  'Leader decides',
  'What happens in the 30 days',
  'Arrives prepared',
  'Works on the first real decision',
  'Learns and repairs',
  'Leaves owned',
  'This is more than AI with good notes.',
  'A folder stores information.',
  'A general AI uses the context it is given now.',
  'Evidence and permission travel with it',
  'A yes locks',
  'Still open',
  'Is this the product we are building?',
  'Synthetic content',
  'No customer or database write',
]

for (const phrase of required) {
  if (!html.includes(phrase)) throw new Error(`missing required phrase: ${phrase}`)
}

if ((html.match(/Is this the product we are building\?/g) || []).length !== 1) {
  throw new Error('founder approval question must appear exactly once')
}

if (html.includes('data-choice=') || html.includes('choice-row')) {
  throw new Error('founder alignment artifact must not become an interactive decision workflow')
}

if (/font-size:\s*[0-9](?:px|rem)/.test(css)) {
  const tiny = [...css.matchAll(/font-size:\s*([0-9.]+)px/g)].filter(match => Number(match[1]) < 8)
  if (tiny.length) throw new Error('font size below 8px found')
}

if (html.includes('—') || css.includes('—')) throw new Error('em dash found')
if (/overflow(?:-y)?:\s*(auto|scroll)/.test(css)) throw new Error('nested scroll contract violated')
if (!css.includes('@media (max-width: 620px)')) throw new Error('narrow phone breakpoint missing')
if (!css.includes('@media (prefers-reduced-motion: reduce)') && !css.includes("@import url('/g23-product-spine-r1.css')")) {
  throw new Error('reduced motion contract missing')
}

console.log('ok: G23 R2 product relationship, mechanism, approval and responsive contracts passed')

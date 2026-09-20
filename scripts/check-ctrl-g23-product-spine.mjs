import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const files = {
  html: await readFile(resolve(root, 'public/g23-product-spine-r1.html'), 'utf8'),
  css: await readFile(resolve(root, 'public/g23-product-spine-r1.css'), 'utf8'),
  js: await readFile(resolve(root, 'public/g23-product-spine-r1.js'), 'utf8'),
  synthesis: await readFile(resolve(root, 'project-documentation/ctrl-evolution/design/g23-product-spine-synthesis.md'), 'utf8'),
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

for (const [name, value] of Object.entries(files)) {
  assert(!value.includes('—'), `${name} may not contain em dashes`)
}

const requiredHtml = [
  'Mindmake builds a private AI Brain with one leader in 30 days.',
  'The company pays because the leader becomes better at changing how the business works and grows.',
  'Brain prepares',
  'Krish challenges',
  'Leader decides',
  'How one decision can improve the next',
  'Which marketing roles still create value once AI can produce the first draft?',
  'If the team keeps the same output targets, what will stop it producing more average work?',
  'A capable general AI',
  'What changes for the leader',
  'What happens across 30 days',
  'What lives in the Brain',
  'What Krish controls backstage',
  'Is this the product we are building?',
]

for (const text of requiredHtml) {
  assert(files.html.includes(text), `Missing required product-spine content: ${text}`)
}

assert((files.html.match(/Is this the product we are building\?/g) ?? []).length === 1, 'Founder approval question must appear exactly once')
assert(!files.html.match(/dashboard|timeline|progress|complete your|step \d/i), 'Rendered spine must not introduce dashboard, timeline, progress or course language')
assert(!files.html.match(/sparkle|magic wand|autonomous verdict/i), 'Rendered spine must not use decorative AI or autonomous-decision language')
assert(files.html.includes('Synthetic content') && files.html.includes('No customer or database write'), 'Synthetic and no-write boundaries must be visible')
assert(files.js.includes("['quiet', 'sparse', 'contradiction']"), 'Quiet, sparse and contradiction states are required')
assert(files.js.includes("data-choice") && files.js.includes("aria-pressed"), 'Crossing choices and selected state are required')
assert(files.css.includes('@media (max-width: 620px)'), 'Narrow-phone contract is required')
assert(files.css.includes('@media (prefers-reduced-motion: reduce)'), 'Reduced-motion contract is required')
assert(!files.css.match(/overflow\s*:\s*(auto|scroll)/), 'Nested scrolling is not permitted')

const forbiddenVoice = [
  'unlock',
  'game-changer',
  'seamless',
  'empower',
  'in today\'s fast-moving landscape',
  'the future of work',
  'best-in-class',
]

const lowerHtml = files.html.toLowerCase()
for (const phrase of forbiddenVoice) {
  assert(!lowerHtml.includes(phrase), `Forbidden voice phrase found: ${phrase}`)
}

console.log('ok: G23 product spine content, interaction, state and responsive contracts passed')

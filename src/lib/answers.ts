/**
 * The /answers content layer.
 *
 * An answer page is one markdown file in `src/content/answers/`. Dropping a
 * file in that directory is the whole publishing step: the glob below picks it
 * up, the index lists it, the route map prerenders it, and the build writes it
 * into the sitemap and llms.txt. There is deliberately no manifest to keep in
 * step, because a manifest is a second place to forget.
 *
 * The front matter grammar is small on purpose. These files are written by the
 * research engine against a fixed template, so a full YAML parser would be a
 * runtime dependency bought for nothing. What is supported:
 *
 *   key: "scalar"          a quoted or bare single-line string
 *   key:                   a list of strings
 *     - "one"
 *   key:                   a list of question/answer objects
 *     - q: "..."
 *       a: "..."
 *
 * Anything else throws with the file name in the message, so a malformed page
 * fails loudly at build time rather than rendering half a page to a crawler.
 */

export interface AnswerFaqEntry {
  /** The question, rendered as a real heading and as a FAQPage `Question`. */
  q: string
  /** The answer, rendered as prose and as the FAQPage `acceptedAnswer`. */
  a: string
}

export interface AnswerDoc {
  title: string
  slug: string
  description: string
  /** The liftable direct answer. Renders first on the page, above any prose. */
  answer: string
  /** The one thing this page says that no other page on this question says. */
  claim: string
  /** The question a leader actually types, verbatim. */
  targetQuery: string
  /** ISO 8601 timestamp. Drives ordering and `datePublished`. */
  publishedAt: string
  /** Statements Mindmake can make first hand, not sourced from elsewhere. */
  firstParty: string[]
  faq: AnswerFaqEntry[]
  /** The markdown body, with any duplicated trailing FAQ block removed. */
  body: string
  /** Site-relative path, for links and for the prerender route map. */
  path: string
}

const REQUIRED_SCALARS = ['title', 'slug', 'description', 'answer', 'claim', 'target_query', 'published_at'] as const

type FrontMatterValue = string | string[] | AnswerFaqEntry[]

/** Strip one layer of matching quotes and unescape the two sequences we emit. */
function unquote(raw: string): string {
  const value = raw.trim()
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  return value
}

/**
 * Parse the front matter block into a flat record. Hand-rolled rather than
 * pulled from a YAML library: see the grammar note at the top of this file.
 */
function parseFrontMatter(block: string, source: string): Record<string, FrontMatterValue> {
  const out: Record<string, FrontMatterValue> = {}
  const lines = block.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i += 1
      continue
    }
    const scalar = line.match(/^([A-Za-z0-9_]+):[ \t]*(.*)$/)
    if (!scalar) {
      throw new Error(`${source}: unsupported front matter line "${line}"`)
    }
    const [, key, inline] = scalar
    i += 1

    if (inline.trim()) {
      out[key] = unquote(inline)
      continue
    }

    // A bare "key:" opens a list. Collect the indented "- " items under it.
    const strings: string[] = []
    const objects: AnswerFaqEntry[] = []
    while (i < lines.length && /^[ \t]+- /.test(lines[i])) {
      const item = lines[i].replace(/^[ \t]+- /, '')
      i += 1
      const pair = item.match(/^([A-Za-z0-9_]+):[ \t]*(.*)$/)
      if (pair && pair[2].trim()) {
        // An object item: the first key sits on the dash line, the rest follow
        // at the same indentation as the item's own body.
        const entry: Record<string, string> = { [pair[1]]: unquote(pair[2]) }
        while (i < lines.length && /^[ \t]+[A-Za-z0-9_]+:/.test(lines[i]) && !/^[ \t]+- /.test(lines[i])) {
          const next = lines[i].match(/^[ \t]+([A-Za-z0-9_]+):[ \t]*(.*)$/)
          if (!next) break
          entry[next[1]] = unquote(next[2])
          i += 1
        }
        if (typeof entry.q !== 'string' || typeof entry.a !== 'string') {
          throw new Error(`${source}: list item under "${key}" needs both q and a`)
        }
        objects.push({ q: entry.q, a: entry.a })
      } else {
        strings.push(unquote(item))
      }
    }
    if (objects.length && strings.length) {
      throw new Error(`${source}: list "${key}" mixes plain strings and objects`)
    }
    out[key] = objects.length ? objects : strings
  }

  return out
}

function normaliseQuestion(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[?.!:]+$/, '')
}

/**
 * Remove a trailing FAQ block from the body when it repeats the front matter.
 *
 * The research engine writes the same questions twice: once as structured
 * `faq` front matter and once as prose at the end of the body. The page renders
 * the front matter version, because that is the copy the JSON-LD is built from
 * and the two must not be able to disagree. So if the body's last level-two
 * section contains nothing but level-three headings that match the front matter
 * questions, it is the same block and it is dropped. A section that does not
 * match is left exactly where the author put it.
 */
export function stripDuplicateFaqSection(body: string, faq: AnswerFaqEntry[]): string {
  if (!faq.length) return body
  const lines = body.split(/\r?\n/)
  let start = -1
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (/^## /.test(lines[i])) {
      start = i
      break
    }
  }
  if (start === -1) return body

  const section = lines.slice(start)
  const headings = section.filter((line) => /^### /.test(line)).map((line) => normaliseQuestion(line.slice(4)))
  if (!headings.length) return body

  const known = new Set(faq.map((entry) => normaliseQuestion(entry.q)))
  if (!headings.every((heading) => known.has(heading))) return body

  return lines.slice(0, start).join('\n').trimEnd()
}

/** Parse one answer markdown file. `source` is only used in error messages. */
export function parseAnswerFile(raw: string, source: string): AnswerDoc {
  const match = raw.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`${source}: missing front matter block`)

  const front = parseFrontMatter(match[1], source)
  for (const key of REQUIRED_SCALARS) {
    if (typeof front[key] !== 'string' || !(front[key] as string).trim()) {
      throw new Error(`${source}: front matter is missing required field "${key}"`)
    }
  }

  const faqRaw = front.faq
  const faq: AnswerFaqEntry[] = Array.isArray(faqRaw) && typeof faqRaw[0] === 'object' ? (faqRaw as AnswerFaqEntry[]) : []
  const firstPartyRaw = front.first_party
  const firstParty: string[] = Array.isArray(firstPartyRaw) && typeof firstPartyRaw[0] === 'string' ? (firstPartyRaw as string[]) : []

  const slug = front.slug as string
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${source}: slug "${slug}" must be lower-case words joined by single hyphens`)
  }

  return {
    title: front.title as string,
    slug,
    description: front.description as string,
    answer: front.answer as string,
    claim: front.claim as string,
    targetQuery: front.target_query as string,
    publishedAt: front.published_at as string,
    firstParty,
    faq,
    body: stripDuplicateFaqSection(match[2].trim(), faq),
    path: `/answers/${slug}`,
  }
}

/** Newest first, with the slug as a tie-break so the order is deterministic. */
export function byNewestFirst(a: AnswerDoc, b: AnswerDoc): number {
  const at = Date.parse(a.publishedAt)
  const bt = Date.parse(b.publishedAt)
  if (Number.isFinite(at) && Number.isFinite(bt) && at !== bt) return bt - at
  return a.slug.localeCompare(b.slug)
}

// Eager and raw: the pages are prerendered, so every file has to be present in
// the SSR bundle at build time. A lazy glob would resolve to promises that the
// synchronous renderToStaticMarkup pass could never await.
const files = import.meta.glob('../content/answers/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const ANSWERS: AnswerDoc[] = Object.entries(files)
  .map(([source, raw]) => parseAnswerFile(raw, source))
  .sort(byNewestFirst)

export function getAnswer(slug: string | undefined): AnswerDoc | undefined {
  if (!slug) return undefined
  return ANSWERS.find((doc) => doc.slug === slug)
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Render a publication date for the reader. Spelled out by hand rather than
 * through Intl, because the prerendered HTML is produced by Node and then
 * hydrated by a browser in an unknown locale: any difference between the two
 * would be a hydration mismatch on the one line a crawler reads as the date.
 */
export function formatAnswerDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

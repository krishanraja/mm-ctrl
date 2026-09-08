/**
 * A block parser for answer-page bodies.
 *
 * `renderMarkdown` in this directory exists for Edge artifacts: it returns an
 * HTML string carrying compact in-app utility classes, sized for a panel. An
 * answer page is long-form reading on a public surface, so it needs a different
 * type ramp and it should not go anywhere near `dangerouslySetInnerHTML` on
 * content that will one day be generated. This parser returns a plain block
 * tree instead, and the component renders real React elements from it.
 *
 * The supported subset is exactly what the answer template uses: level two and
 * three headings, paragraphs, bullet and numbered lists, and inline bold,
 * italic, code and links. Anything else stays literal text, which is the safe
 * failure: a stray character reaches the reader, never a broken page.
 */

export type AnswerInline =
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'em'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string }

export type AnswerBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; content: AnswerInline[] }
  | { type: 'list'; ordered: boolean; items: AnswerInline[][] }

// One pass over the four inline forms. Ordered so that ** is tried before *,
// otherwise bold would be read as an empty italic.
const INLINE = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g

export function parseInline(source: string): AnswerInline[] {
  const out: AnswerInline[] = []
  let last = 0
  for (const match of source.matchAll(INLINE)) {
    const at = match.index ?? 0
    if (at > last) out.push({ type: 'text', text: source.slice(last, at) })
    if (match[1] !== undefined) out.push({ type: 'strong', text: match[1] })
    else if (match[2] !== undefined) out.push({ type: 'em', text: match[2] })
    else if (match[3] !== undefined) out.push({ type: 'code', text: match[3] })
    else out.push({ type: 'link', text: match[4], href: match[5] })
    last = at + match[0].length
  }
  if (last < source.length) out.push({ type: 'text', text: source.slice(last) })
  return out.length ? out : [{ type: 'text', text: source }]
}

export function parseAnswerBody(markdown: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ type: 'paragraph', content: parseInline(paragraph.join(' ').trim()) })
    paragraph = []
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    if (!line.trim()) {
      flushParagraph()
      continue
    }

    const heading = line.match(/^(#{2,3}) +(.*)$/)
    if (heading) {
      flushParagraph()
      blocks.push({ type: 'heading', level: heading[1].length === 2 ? 2 : 3, text: heading[2].trim() })
      continue
    }

    const bullet = line.match(/^[-*] +(.*)$/)
    const numbered = line.match(/^\d+\. +(.*)$/)
    if (bullet || numbered) {
      flushParagraph()
      const ordered = Boolean(numbered)
      const items: AnswerInline[][] = []
      // Consume the whole run so consecutive items become one list, not one
      // list each. A blank line ends the run, same as any other block.
      while (i < lines.length) {
        const item = lines[i].match(ordered ? /^\d+\. +(.*)$/ : /^[-*] +(.*)$/)
        if (!item) break
        items.push(parseInline(item[1].trim()))
        i += 1
      }
      i -= 1
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    paragraph.push(line.trim())
  }

  flushParagraph()
  return blocks
}

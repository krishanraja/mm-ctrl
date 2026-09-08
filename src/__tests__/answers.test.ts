import { describe, expect, it } from 'vitest'
import {
  ANSWERS,
  byNewestFirst,
  formatAnswerDate,
  getAnswer,
  parseAnswerFile,
  stripDuplicateFaqSection,
  type AnswerDoc,
} from '@/lib/answers'
import { parseAnswerBody, parseInline } from '@/lib/answerMarkdown'
import { buildArticleSchema, buildFaqSchema, serialiseJsonLd } from '@/lib/answerSchema'

const FIXTURE = `---
title: "A title"
slug: "a-title"
description: "A description."
answer: "The liftable answer."
claim: "The one thing nobody else says."
target_query: "What is the question"
published_at: "2026-09-01T10:00:00.000Z"
first_party:
  - "One fact."
  - "Another fact."
faq:
  - q: "First question?"
    a: "First answer."
  - q: "Second question?"
    a: "Second answer."
---Opening line.

## A section

Body text.

## Questions people ask next

### First question?

First answer.

### Second question?

Second answer.
`

describe('parseAnswerFile', () => {
  const doc = parseAnswerFile(FIXTURE, 'fixture.md')

  it('reads every front matter field', () => {
    expect(doc.title).toBe('A title')
    expect(doc.slug).toBe('a-title')
    expect(doc.description).toBe('A description.')
    expect(doc.answer).toBe('The liftable answer.')
    expect(doc.claim).toBe('The one thing nobody else says.')
    expect(doc.targetQuery).toBe('What is the question')
    expect(doc.publishedAt).toBe('2026-09-01T10:00:00.000Z')
    expect(doc.firstParty).toEqual(['One fact.', 'Another fact.'])
    expect(doc.faq).toEqual([
      { q: 'First question?', a: 'First answer.' },
      { q: 'Second question?', a: 'Second answer.' },
    ])
    expect(doc.path).toBe('/answers/a-title')
  })

  it('drops the body FAQ block that repeats the front matter', () => {
    expect(doc.body).toContain('## A section')
    expect(doc.body).not.toContain('Questions people ask next')
    expect(doc.body.match(/First answer\./g)).toBeNull()
  })

  it('rejects a file with no front matter', () => {
    expect(() => parseAnswerFile('just a body', 'bad.md')).toThrow(/missing front matter/)
  })

  it('rejects a file missing a required field', () => {
    const broken = FIXTURE.replace('claim: "The one thing nobody else says."\n', '')
    expect(() => parseAnswerFile(broken, 'bad.md')).toThrow(/"claim"/)
  })

  it('rejects a slug that would not survive a URL', () => {
    const broken = FIXTURE.replace('slug: "a-title"', 'slug: "A Title"')
    expect(() => parseAnswerFile(broken, 'bad.md')).toThrow(/slug/)
  })
})

describe('stripDuplicateFaqSection', () => {
  it('leaves a trailing section that is not the FAQ alone', () => {
    const body = '## Real section\n\n### A heading nobody asked\n\nText.'
    expect(stripDuplicateFaqSection(body, [{ q: 'Different?', a: 'Yes.' }])).toBe(body)
  })

  it('leaves the body alone when there is no front matter FAQ', () => {
    const body = '## Questions people ask next\n\n### One?\n\nYes.'
    expect(stripDuplicateFaqSection(body, [])).toBe(body)
  })
})

describe('ordering', () => {
  const make = (slug: string, publishedAt: string) => ({ slug, publishedAt }) as AnswerDoc

  it('puts the newest page first', () => {
    const sorted = [
      make('older', '2026-08-01T00:00:00.000Z'),
      make('newest', '2026-09-05T00:00:00.000Z'),
      make('middle', '2026-08-20T00:00:00.000Z'),
    ].sort(byNewestFirst)
    expect(sorted.map((doc) => doc.slug)).toEqual(['newest', 'middle', 'older'])
  })

  it('breaks a tie on slug so the order never wobbles between builds', () => {
    const sorted = [make('b', '2026-09-01T00:00:00.000Z'), make('a', '2026-09-01T00:00:00.000Z')].sort(byNewestFirst)
    expect(sorted.map((doc) => doc.slug)).toEqual(['a', 'b'])
  })
})

describe('formatAnswerDate', () => {
  it('spells the date out without depending on the runtime locale', () => {
    expect(formatAnswerDate('2026-09-08T11:27:24.671Z')).toBe('8 September 2026')
  })

  it('returns nothing for an unusable value rather than showing Invalid Date', () => {
    expect(formatAnswerDate('not a date')).toBe('')
  })
})

describe('parseAnswerBody', () => {
  it('reads headings, paragraphs and lists', () => {
    const blocks = parseAnswerBody('## Heading\n\nA line\nwrapped over two.\n\n- one\n- two\n\n### Sub\n\nEnd.')
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'paragraph', 'list', 'heading', 'paragraph'])
    expect(blocks[0]).toMatchObject({ level: 2, text: 'Heading' })
    expect(blocks[1]).toMatchObject({ content: [{ type: 'text', text: 'A line wrapped over two.' }] })
    expect(blocks[2]).toMatchObject({ ordered: false })
    expect((blocks[2] as { items: unknown[] }).items).toHaveLength(2)
    expect(blocks[3]).toMatchObject({ level: 3, text: 'Sub' })
  })

  it('keeps a run of numbered items as one ordered list', () => {
    const blocks = parseAnswerBody('1. first\n2. second')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: true })
  })

  it('reads bold before italic so bold is never mistaken for an empty emphasis', () => {
    expect(parseInline('a **bold** and *soft* bit')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'strong', text: 'bold' },
      { type: 'text', text: ' and ' },
      { type: 'em', text: 'soft' },
      { type: 'text', text: ' bit' },
    ])
  })

  it('reads a link', () => {
    expect(parseInline('[CTRL](https://makeyourmindup.ai/)')).toEqual([
      { type: 'link', text: 'CTRL', href: 'https://makeyourmindup.ai/' },
    ])
  })
})

describe('structured data', () => {
  const doc = parseAnswerFile(FIXTURE, 'fixture.md')

  it('builds an Article from the front matter and nothing else', () => {
    const schema = buildArticleSchema(doc) as Record<string, string>
    expect(schema['@type']).toBe('Article')
    expect(schema.headline).toBe(doc.title)
    expect(schema.abstract).toBe(doc.answer)
    expect(schema.datePublished).toBe(doc.publishedAt)
    expect(schema.url).toBe('https://makeyourmindup.ai/answers/a-title')
  })

  it('builds a FAQPage carrying every front matter question', () => {
    const schema = buildFaqSchema(doc) as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> }
    expect(schema.mainEntity).toHaveLength(2)
    expect(schema.mainEntity[0].name).toBe('First question?')
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('First answer.')
  })

  it('has no FAQPage to build when the page carries no questions', () => {
    expect(buildFaqSchema({ ...doc, faq: [] })).toBeNull()
  })

  it('escapes angle brackets so a string can never close the script tag', () => {
    const json = serialiseJsonLd({ note: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('</script>')
    expect(JSON.parse(json).note).toBe('</script><script>alert(1)</script>')
  })
})

describe('the published set', () => {
  it('loads every markdown file in src/content/answers', () => {
    expect(ANSWERS.length).toBeGreaterThan(0)
  })

  it('gives every page a unique slug', () => {
    expect(new Set(ANSWERS.map((doc) => doc.slug)).size).toBe(ANSWERS.length)
  })

  it('carries the answer prose, which is the whole point of the surface', () => {
    for (const doc of ANSWERS) {
      expect(doc.answer.length).toBeGreaterThan(40)
      expect(doc.body.length).toBeGreaterThan(200)
      expect(getAnswer(doc.slug)).toBe(doc)
    }
  })

  it('is ordered newest first', () => {
    const dates = ANSWERS.map((doc) => Date.parse(doc.publishedAt))
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('has no answer for an unknown slug', () => {
    expect(getAnswer('nothing-here')).toBeUndefined()
    expect(getAnswer(undefined)).toBeUndefined()
  })
})

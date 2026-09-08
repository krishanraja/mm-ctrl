import type { AnswerDoc } from '@/lib/answers'

/**
 * JSON-LD for the answer pages.
 *
 * `index.html` already carries a site-wide graph in the document head. That one
 * describes the product and never changes per route, so it cannot say anything
 * about a specific page. These builders produce the per-page objects: an
 * `Article` so the page is quotable with a date and an author, and a `FAQPage`
 * built from the same front matter the visible questions are rendered from, so
 * the machine-readable version and the human-readable version cannot drift.
 *
 * Every value here comes from the front matter or from facts the site already
 * states publicly. Nothing is inferred and nothing is filled in.
 */

export const SITE_ORIGIN = 'https://makeyourmindup.ai'
export const ANSWERS_URL = `${SITE_ORIGIN}/answers`

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Mindmaker',
  url: SITE_ORIGIN,
} as const

export function answerUrl(doc: AnswerDoc): string {
  return `${SITE_ORIGIN}${doc.path}`
}

export function buildArticleSchema(doc: AnswerDoc): Record<string, unknown> {
  const url = answerUrl(doc)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: doc.description,
    // The liftable answer, in the field a retriever looks at first.
    abstract: doc.answer,
    about: doc.targetQuery,
    datePublished: doc.publishedAt,
    dateModified: doc.publishedAt,
    inLanguage: 'en',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isPartOf: { '@type': 'Blog', name: 'CTRL Answers', url: ANSWERS_URL },
    author: PUBLISHER,
    publisher: PUBLISHER,
  }
}

export function buildFaqSchema(doc: AnswerDoc): Record<string, unknown> | null {
  if (!doc.faq.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: doc.faq.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: { '@type': 'Answer', text: entry.a },
    })),
  }
}

export function buildAnswersIndexSchema(docs: AnswerDoc[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'CTRL Answers',
    url: ANSWERS_URL,
    inLanguage: 'en',
    publisher: PUBLISHER,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: docs.length,
      itemListElement: docs.map((doc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: answerUrl(doc),
        name: doc.title,
      })),
    },
  }
}

/**
 * Serialise for a `<script type="application/ld+json">` body. The angle bracket
 * escape is what stops a `</script>` sequence inside any string from closing
 * the tag early; JSON parsers read the escape back as the same character.
 */
export function serialiseJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

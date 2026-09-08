import { serialiseJsonLd } from '@/lib/answerSchema'

/**
 * One `application/ld+json` block. Rendered inside the page body rather than
 * the head, because the prerender pass swaps a body element and never touches
 * the document head. Search engines and AI fetchers read JSON-LD from anywhere
 * in the document, so body placement costs nothing.
 */
export function JsonLd({ schema }: { schema: Record<string, unknown> | null }) {
  if (!schema) return null
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiseJsonLd(schema) }} />
}

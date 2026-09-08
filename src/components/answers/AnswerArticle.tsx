import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { HeroBackdrop } from '@/components/public/HeroBackdrop'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { AnswerProse } from '@/components/answers/AnswerProse'
import { JsonLd } from '@/components/answers/JsonLd'
import { buildArticleSchema, buildFaqSchema } from '@/lib/answerSchema'
import { formatAnswerDate, type AnswerDoc } from '@/lib/answers'

/**
 * One answer page.
 *
 * The order of this document is the whole point of the surface. A retriever
 * reads the first chunk it is given and stops; if the direct answer is not in
 * that chunk, the page is quoted for its preamble or not quoted at all. So the
 * heading, the question and the answer come first, in that order, and every
 * piece of framing that would normally sit above the fold has been moved below
 * it. The prose that earns the answer follows, then the position the page
 * takes, then what the site can say first hand, then the questions a reader
 * asks next as real headed sections rather than an accordion a fetcher cannot
 * open.
 *
 * This component takes its document as a prop rather than reading the route,
 * so the prerender entry can render it directly for every slug without a
 * router match. See `src/entry-prerender.tsx`.
 */

const SECTION_HEADING = 'font-display text-[22px] font-extrabold leading-[1.16] tracking-[-0.025em] text-foreground sm:text-[27px]'
const EYEBROW = 'font-display text-[10.5px] font-bold uppercase tracking-[0.13em] text-accent'
const META = 'font-mono text-[11px] uppercase tracking-[0.11em] text-muted-foreground/70'
const COLUMN = 'mx-auto w-full max-w-[46rem]'

export function AnswerArticle({ doc }: { doc: AnswerDoc }) {
  const published = formatAnswerDate(doc.publishedAt)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <JsonLd schema={buildArticleSchema(doc)} />
      <JsonLd schema={buildFaqSchema(doc)} />

      <article>
        <header className="relative overflow-hidden border-b border-border px-5 pb-12 pt-11 sm:px-8 sm:pb-16 sm:pt-14">
          <HeroBackdrop weight="quiet" />
          <div className={`relative z-10 ${COLUMN}`}>
            <Link
              to="/answers"
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.06] px-3 py-1.5 transition-colors hover:border-accent/45"
            >
              <ArrowLeft className="h-3 w-3 text-accent" />
              <span className={EYEBROW}>Answers</span>
            </Link>

            <h1 className="mt-6 max-w-[20ch] text-balance font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
              {doc.title}
            </h1>

            <p className={`mt-7 ${META}`}>The question</p>
            <p className="mt-2 max-w-[58ch] text-[15px] leading-[1.55] text-muted-foreground sm:text-[16.5px]">
              {doc.targetQuery}
            </p>
          </div>
        </header>

        <div className="px-5 pb-4 pt-10 sm:px-8 sm:pt-14">
          <div className={COLUMN}>
            {/* The liftable answer. Nothing prose-shaped is allowed above it. */}
            <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-6 sm:p-8">
              <p className={EYEBROW}>The short answer</p>
              <p className="mt-4 text-[18px] leading-[1.58] text-foreground sm:text-[20.5px] sm:leading-[1.56]">
                {doc.answer}
              </p>
            </div>

            <p className={`mt-5 ${META}`}>{published ? `Published ${published}` : 'CTRL Answers'}</p>

            <div className="mt-12">
              <AnswerProse markdown={doc.body} />
            </div>

            <aside className="mt-16 max-w-[62ch] border-l-2 border-accent/50 pl-6 sm:pl-8">
              <p className={EYEBROW}>The position</p>
              <p className="mt-3 font-display text-[19px] font-semibold leading-[1.42] tracking-[-0.015em] text-foreground sm:text-[22px]">
                {doc.claim}
              </p>
            </aside>

            {doc.firstParty.length > 0 && (
              <section className="mt-16">
                <h2 className={SECTION_HEADING}>What we can say first hand</h2>
                <ul className="mt-6 max-w-[64ch] space-y-3">
                  {doc.firstParty.map((fact) => (
                    <li
                      key={fact}
                      className="rounded-2xl border border-border bg-card p-5 text-[15px] leading-[1.62] text-foreground/85 sm:text-[16px] sm:leading-[1.64]"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {doc.faq.length > 0 && (
              <section className="mt-16 border-t border-border pt-12">
                <h2 className={SECTION_HEADING}>Questions people ask next</h2>
                <div className="mt-8 max-w-[64ch] space-y-10">
                  {doc.faq.map((entry) => (
                    <div key={entry.q}>
                      <h3 className="font-display text-[17.5px] font-bold leading-[1.3] tracking-[-0.015em] text-foreground sm:text-[19px]">
                        {entry.q}
                      </h3>
                      <p className="mt-3 text-[16.5px] leading-[1.72] text-foreground/85 sm:text-[17.5px] sm:leading-[1.75]">
                        {entry.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <nav className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
              <Link
                to="/answers"
                className="font-display text-[14px] text-muted-foreground transition-colors hover:text-foreground"
              >
                All answers
              </Link>
              <Link
                to="/try"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-3 font-display text-[14px] font-semibold text-foreground transition-colors hover:border-accent/45"
              >
                See CTRL work <ArrowRight className="h-3.5 w-3.5 text-accent" />
              </Link>
            </nav>
          </div>
        </div>
      </article>

      <PublicFooter />
    </div>
  )
}

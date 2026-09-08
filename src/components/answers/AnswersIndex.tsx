import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HeroBackdrop } from '@/components/public/HeroBackdrop'
import { PublicHeader } from '@/components/public/PublicHeader'
import { PublicFooter } from '@/components/public/PublicFooter'
import { JsonLd } from '@/components/answers/JsonLd'
import { buildAnswersIndexSchema } from '@/lib/answerSchema'
import { formatAnswerDate, type AnswerDoc } from '@/lib/answers'

/**
 * The /answers index.
 *
 * Newest first, on the front matter `published_at`, which is the date the page
 * was written rather than the moment it landed in the repository. Each row
 * carries the two things that decide whether a page is worth opening: what it
 * is called and which question it answers.
 *
 * The list takes its documents as a prop for the same reason the article does:
 * the prerender entry renders it with no data fetching and no route match.
 */
export function AnswersIndex({ docs }: { docs: AnswerDoc[] }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <JsonLd schema={buildAnswersIndexSchema(docs)} />

      <section className="relative overflow-hidden border-b border-border px-5 pb-12 pt-11 sm:px-8 sm:pb-16 sm:pt-14">
        <HeroBackdrop weight="quiet" />
        <div className="relative z-10 mx-auto w-full max-w-[46rem]">
          <span className="inline-block rounded-full border border-accent/25 bg-accent/[0.06] px-3 py-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.13em] text-accent">
            Answers
          </span>
          <h1 className="mt-6 max-w-[16ch] text-balance font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
            The questions leaders actually type.
          </h1>
          <p className="mt-5 max-w-[58ch] text-[15px] leading-[1.6] text-muted-foreground sm:text-[16.5px]">
            One question a page. The answer sits in the first line, the reasoning underneath it, and each page takes a
            position rather than surveying the field.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto w-full max-w-[46rem]">
          {docs.length === 0 ? (
            <p className="text-[15px] leading-[1.6] text-muted-foreground">
              No answers published yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {docs.map((doc) => {
                const published = formatAnswerDate(doc.publishedAt)
                return (
                  <li key={doc.slug}>
                    <Link
                      to={doc.path}
                      className="group block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent/45 sm:p-7"
                    >
                      {published && (
                        <p className="font-mono text-[11px] uppercase tracking-[0.11em] text-muted-foreground/70">
                          {published}
                        </p>
                      )}
                      <h2 className="mt-3 max-w-[34ch] font-display text-[21px] font-extrabold leading-[1.18] tracking-[-0.025em] text-foreground sm:text-[25px]">
                        {doc.title}
                      </h2>
                      <p className="mt-3 max-w-[60ch] text-[14.5px] leading-[1.62] text-muted-foreground sm:text-[15.5px]">
                        <span className="text-muted-foreground/60">Answers: </span>
                        {doc.targetQuery}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1.5 font-display text-[13.5px] font-semibold text-accent">
                        Read
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

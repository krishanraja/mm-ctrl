import { useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { OperatorPendingQueue } from '@/features/standard-review/operatorPendingQueue'

export function OperatorReviewSignal({
  queue,
  notify,
}: {
  queue: OperatorPendingQueue
  notify: (message: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const questionRef = useRef<HTMLHeadingElement>(null)

  if (!queue.available) return null

  const item = queue.next
  const countLabel = queue.ready_count === 1
    ? '1 question for Maya'
    : `${queue.ready_count} questions, next for Maya`

  async function copyQuestion() {
    try {
      await navigator.clipboard.writeText(item.question)
      setCopied(true)
      notify('Question copied')
    } catch {
      setCopied(false)
      const selection = window.getSelection()
      if (selection && questionRef.current) {
        const range = document.createRange()
        range.selectNodeContents(questionRef.current)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      notify('Copy was blocked. The question is selected.')
    }
  }

  return (
    <section className="dt-review-signal" aria-labelledby="operator-review-question">
      <div className="dt-review-meta">
        <span>For your next session</span>
        <strong>{countLabel}</strong>
      </div>
      <div className="dt-review-copy">
        <h2 id="operator-review-question" ref={questionRef}>{item.question}</h2>
        <p><strong>{item.headline}</strong> {item.consequence}</p>
      </div>
      <div className="dt-review-action">
        <span>Maya decides.</span>
        <button type="button" onClick={copyQuestion} data-copied={copied || undefined}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy question'}
        </button>
      </div>
    </section>
  )
}

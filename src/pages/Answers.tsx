import { AnswersIndex } from '@/components/answers/AnswersIndex'
import { ANSWERS } from '@/lib/answers'

/** /answers, the index of every published answer page. */
export default function AnswersPage() {
  return <AnswersIndex docs={ANSWERS} />
}

import { Navigate, useParams } from 'react-router-dom'
import { AnswerArticle } from '@/components/answers/AnswerArticle'
import { getAnswer } from '@/lib/answers'

/**
 * /answers/:slug in the client app.
 *
 * A slug with no file behind it sends the visitor to the index rather than the
 * 404 screen: the only way to reach an unknown slug is a link to a page that
 * was renamed or removed, and the index is where the replacement will be.
 */
export default function AnswerPage() {
  const { slug } = useParams<{ slug: string }>()
  const doc = getAnswer(slug)
  if (!doc) return <Navigate to="/answers" replace />
  return <AnswerArticle doc={doc} />
}

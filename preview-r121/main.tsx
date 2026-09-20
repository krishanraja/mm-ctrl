/* eslint-disable react-refresh/only-export-components -- this is a dedicated proof entrypoint */
import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import { StandardReviewExperience } from '@/features/standard-review/StandardReviewExperience'
import { StandardReviewGateway } from '@/features/standard-review/gateway'
import { createSupabaseStandardReviewInvoker } from '@/features/standard-review/supabaseInvoker'
import '@/index.css'

const isolatedProject = 'cgkcplcamsijghalintq'
const url = import.meta.env.VITE_R121_SUPABASE_URL ?? ''
const publishableKey = import.meta.env.VITE_R121_SUPABASE_PUBLISHABLE_KEY ?? ''

if (url !== `https://${isolatedProject}.supabase.co` || publishableKey.length < 20) {
  throw new Error('R121 requires the exact isolated project and its transient publishable key.')
}

const client = createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})

function isUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function isSha256(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{64}$/.test(value))
}

function R121AuthenticatedReview() {
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const params = new URLSearchParams(window.location.search)
  const checkId = params.get('check_id')
  const expectedResultSha256 = params.get('result_sha256')
  const gateway = useMemo(
    () => new StandardReviewGateway(createSupabaseStandardReviewInvoker(client)),
    [],
  )

  useEffect(() => {
    let active = true
    void client.auth.getSession().then(({ data }) => {
      if (active) setSessionState(data.session ? 'ready' : 'missing')
    })
    return () => { active = false }
  }, [])

  if (sessionState === 'loading') return <main aria-label="Checking sign in" />
  if (sessionState === 'missing') return <main><h1>Sign in required</h1></main>
  if (!isUuid(checkId) || !isSha256(expectedResultSha256)) {
    return <main><h1>Review link incomplete</h1></main>
  }

  return (
    <StandardReviewExperience
      gateway={gateway}
      checkId={checkId}
      expectedResultSha256={expectedResultSha256}
      subjectName="Maya Chen"
      organisation="Aperture House · isolated proof"
      proofLabel="Temporary authenticated proof. Nothing can publish or deploy."
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><R121AuthenticatedReview /></StrictMode>,
)

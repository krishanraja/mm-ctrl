/* eslint-disable react-refresh/only-export-components -- this is a dedicated proof entrypoint */
import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import { StandardReviewAddressExperience } from '@/features/standard-review/StandardReviewAddressExperience'
import { createSupabaseStandardReviewInvoker } from '@/features/standard-review/supabaseInvoker'
import '@/index.css'

const isolatedProject = 'cgkcplcamsijghalintq'
const url = import.meta.env.VITE_R122_SUPABASE_URL ?? ''
const publishableKey = import.meta.env.VITE_R122_SUPABASE_PUBLISHABLE_KEY ?? ''

if (url !== `https://${isolatedProject}.supabase.co` || publishableKey.length < 20) {
  throw new Error('R122 requires the exact isolated project and its transient publishable key.')
}

const client = createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})

function reviewPacketId() {
  const match = window.location.pathname.match(/^\/operator\/reviews\/([0-9a-f-]{36})\/?$/i)
  return match?.[1] ?? ''
}

function R122StableReviewAddress() {
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const invoker = useMemo(() => createSupabaseStandardReviewInvoker(client), [])
  const reviewId = reviewPacketId()

  useEffect(() => {
    let active = true
    void client.auth.getSession().then(({ data }) => {
      if (active) setSessionState(data.session ? 'ready' : 'missing')
    })
    return () => { active = false }
  }, [])

  if (sessionState === 'loading') return <main aria-label="Checking sign in" />
  if (sessionState === 'missing') return <main><h1>Sign in required</h1></main>
  if (!reviewId) return <main><h1>Review link incomplete</h1></main>

  return (
    <StandardReviewAddressExperience
      invoker={invoker}
      reviewPacketId={reviewId}
      subjectName="Maya Chen"
      organisation="Aperture House · isolated proof"
      proofLabel="Temporary authenticated proof. Nothing can publish or deploy."
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><R122StableReviewAddress /></StrictMode>,
)

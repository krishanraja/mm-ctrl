/* eslint-disable react-refresh/only-export-components -- dedicated disposable proof entrypoint */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import DecisionBenchPage from '@/features/operator-brain/DecisionBenchPage'
import '@/index.css'

const isolatedProject = 'cgkcplcamsijghalintq'
const url = import.meta.env.VITE_R138_SUPABASE_URL ?? ''
const publishableKey = import.meta.env.VITE_R138_SUPABASE_PUBLISHABLE_KEY ?? ''

if (url !== `https://${isolatedProject}.supabase.co` || publishableKey.length < 20) {
  throw new Error('R138 requires the exact isolated project and its transient publishable key.')
}

function createEphemeralAuthStorage() {
  const memory = new Map<string, string>()
  return {
    getItem(key: string) {
      const staged = window.localStorage.getItem(key)
      if (staged !== null) {
        window.localStorage.removeItem(key)
        memory.set(key, staged)
        return staged
      }
      return memory.get(key) ?? null
    },
    setItem(key: string, value: string) {
      memory.set(key, value)
      window.localStorage.removeItem(key)
    },
    removeItem(key: string) {
      memory.delete(key)
      window.localStorage.removeItem(key)
    },
  }
}

const client = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: createEphemeralAuthStorage(),
  },
})

function isUuid(value: string | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function R138PrivateOperatorComposition() {
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const workspaceId = new URLSearchParams(window.location.search).get('workspace_id')

  useEffect(() => {
    let active = true
    void client.auth.getSession().then(({ data }) => {
      if (active) setSessionState(data.session ? 'ready' : 'missing')
    })
    return () => { active = false }
  }, [])

  if (sessionState === 'loading') return <main aria-label="Checking sign in" />
  if (sessionState === 'missing') return <main><h1>Sign in required</h1></main>
  if (!isUuid(workspaceId)) return <main><h1>Workspace link incomplete</h1></main>

  return (
    <DecisionBenchPage
      runtimeReview={{ client, workspaceId, leaderLabel: 'Maya' }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><R138PrivateOperatorComposition /></StrictMode>,
)

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"

/**
 * Handles OAuth provider callbacks (Google, etc).
 * Supabase JS auto-detects the code/hash in the URL and exchanges it for a session.
 * Once authenticated, we redirect to the dashboard.
 */
export default function AuthCallback() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      navigate(isAuthenticated ? '/dashboard' : '/auth', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </div>
  )
}

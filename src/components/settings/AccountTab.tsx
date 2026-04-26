// src/components/settings/AccountTab.tsx
import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { LogOut, Loader2 } from 'lucide-react'

export function AccountTab() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/auth', { replace: true })
    } catch (err) {
      console.error('sign out failed:', err)
      toast({
        title: 'Sign out failed',
        description: (err as Error).message,
        variant: 'destructive',
      })
      setSigningOut(false)
    }
  }

  // Audit cleanup: removed the "Profile photo coming soon" placeholder and
  // the Change Password button (no click handler, no backend wired up).
  // Password reset is handled via the auth provider's "forgot password" link
  // on the sign-in screen — that's the working path for now. Add a real
  // in-app change-password flow when there's a working backend for it.
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">Profile</h3>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <p className="text-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-1">Sign out</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You&apos;ll need to sign in again to access your data on this device.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="gap-2"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign out
        </Button>
      </div>
    </div>
  )
}

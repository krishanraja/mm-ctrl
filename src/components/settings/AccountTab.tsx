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

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-foreground">{user?.email}</p>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              Profile photo coming soon
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <p className="text-muted-foreground text-sm mb-2">••••••••</p>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
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

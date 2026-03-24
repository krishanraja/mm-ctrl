// src/components/settings/EdgeProTab.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail } from 'lucide-react'

export function EdgeProTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [initialEmail, setInitialEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    async function loadEmail() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('edge_delivery_email')
        .eq('id', user!.id)
        .single()

      if (!error && data) {
        const saved = (data as Record<string, unknown>).edge_delivery_email as string || ''
        setEmail(saved)
        setInitialEmail(saved)
      }
      setIsLoading(false)
    }

    loadEmail()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ edge_delivery_email: email.trim() } as Record<string, unknown>)
      .eq('id', user.id)

    setIsSaving(false)

    if (error) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setInitialEmail(email.trim())
      toast({
        title: 'Saved',
        description: 'Your delivery email has been updated.',
      })
    }
  }

  const hasChanged = email.trim() !== initialEmail

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold">Email Delivery</h3>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Generated artifacts (memos, strategy docs, emails) can be delivered
          straight to your inbox. Enter the email address where you want to
          receive them.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanged}
              size="sm"
              className="whitespace-nowrap"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

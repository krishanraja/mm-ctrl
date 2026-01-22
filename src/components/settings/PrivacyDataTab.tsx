// src/components/settings/PrivacyDataTab.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PrivacyDataTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [facts, setFacts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMemories()
  }, [user])

  const loadMemories = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFacts(data || [])
    } catch (error) {
      console.error('Error loading memories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (factId: string) => {
    const confirmed = confirm('Delete this fact? This cannot be undone.')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('user_memory')
        .delete()
        .eq('id', factId)

      if (error) throw error

      setFacts(facts.filter((f) => f.id !== factId))

      toast({
        title: 'Deleted',
        description: 'Fact removed from your memory',
      })
    } catch (error) {
      console.error('Error deleting fact:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete fact',
        variant: 'destructive',
      })
    }
  }

  const handleExportData = async () => {
    try {
      // Fetch all user data
      const { data: profileData } = await supabase
        .from('leaders')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      const { data: memoryData } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', user?.id)

      const exportData = {
        profile: profileData,
        memory: memoryData,
        exportedAt: new Date().toISOString(),
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mindmaker-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Complete',
        description: 'Your data has been downloaded',
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      identity: '👤',
      business: '🏢',
      objective: '🎯',
      blocker: '🚧',
      preference: '⚙️',
    }
    return icons[category] || '📝'
  }

  return (
    <div className="space-y-6">
      {/* User Memory */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">User Memory</h3>
        <p className="text-sm text-gray-400 mb-6">
          These facts were extracted from your conversations. You can delete any incorrect information.
        </p>

        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : facts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No facts captured yet</p>
        ) : (
          <div className="space-y-3">
            {facts.map((fact) => (
              <div key={fact.id} className="flex items-start justify-between bg-gray-800 p-4 rounded">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getCategoryIcon(fact.category)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white">{fact.fact_text}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {fact.category} • Confidence: {Math.round((fact.confidence || 0) * 100)}%
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(fact.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Data Export</h3>
        <p className="text-sm text-gray-400 mb-4">
          Download all your profile and memory data in JSON format
        </p>
        <Button variant="outline" onClick={handleExportData}>
          Download All Data
        </Button>
      </div>

      {/* Account Deletion */}
      <div className="bg-gray-900 p-6 rounded-lg border border-red-900/50">
        <h3 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h3>
        <p className="text-sm text-gray-400 mb-4">
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        <Button variant="destructive">
          Delete Account
        </Button>
      </div>
    </div>
  )
}

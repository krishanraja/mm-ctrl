// src/components/settings/WorkContextTab.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/integrations/supabase/client'
import { EditableField } from './EditableField'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

export function WorkContextTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [completeness, setCompleteness] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('leaders')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setCompleteness(data.profile_completeness || 0)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (field: string, value: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('leaders')
        .update({ [field]: value })
        .eq('user_id', user.id)

      if (error) throw error

      // Reload to get updated completeness
      await loadProfile()

      toast({
        title: 'Updated',
        description: 'Your profile has been updated successfully',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!profile) {
    return <div className="text-center py-8 text-gray-400">No profile found</div>
  }

  return (
    <div className="space-y-6">
      {/* Profile Completeness */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Profile Completeness</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Your profile is {completeness}% complete</span>
            <span className="text-[#00D9B6] font-semibold">{completeness}/100</span>
          </div>
          <Progress value={completeness} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            Complete profile helps us give better recommendations and benchmark you accurately
          </p>
        </div>
      </div>

      {/* Role & Company */}
      <div className="bg-gray-900 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold border-b border-gray-800 pb-2">Role & Company</h3>

        <EditableField
          label="Title"
          value={profile.title || ''}
          onSave={(value) => handleUpdate('title', value)}
          placeholder="e.g., VP of Product"
          helpText="Your official job title"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Functional Area"
          value={profile.role || ''}
          onSave={(value) => handleUpdate('role', value)}
          type="select"
          options={['Product', 'Engineering', 'Marketing', 'Sales', 'Operations', 'Finance', 'HR', 'Executive', 'Other']}
          helpText="Your primary functional area"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Company"
          value={profile.company || ''}
          onSave={(value) => handleUpdate('company', value)}
          placeholder="e.g., Acme Inc"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Industry"
          value={profile.industry || ''}
          onSave={(value) => handleUpdate('industry', value)}
          type="select"
          options={['SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'Manufacturing', 'Consulting', 'Education', 'Media', 'Other']}
          helpText="Used for peer benchmarking"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Company Stage"
          value={profile.company_stage || ''}
          onSave={(value) => handleUpdate('company_stage', value)}
          type="select"
          options={[
            'Startup (0-50 employees)',
            'Growth (51-250 employees)',
            'Mid-Market (251-1000 employees)',
            'Enterprise (1000+ employees)',
          ]}
        />
      </div>

      {/* Strategic Context */}
      <div className="bg-gray-900 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold border-b border-gray-800 pb-2">Strategic Context</h3>
        <p className="text-sm text-gray-400">
          This information helps us tailor our recommendations to your specific situation
        </p>

        <EditableField
          label="Top Challenge"
          value={profile.strategic_problem || ''}
          onSave={(value) => handleUpdate('strategic_problem', value)}
          type="textarea"
          placeholder="What's your biggest business challenge right now?"
          helpText="Be specific - this helps us give relevant advice"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Biggest Obstacle"
          value={profile.biggest_obstacle || ''}
          onSave={(value) => handleUpdate('biggest_obstacle', value)}
          type="textarea"
          placeholder="What's holding you back from solving it?"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Main Concern"
          value={profile.biggest_fear || ''}
          onSave={(value) => handleUpdate('biggest_fear', value)}
          type="textarea"
          placeholder="What are you most worried about? (optional)"
          helpText="🔒 Sensitive information - only you can see this"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Strategic Goal"
          value={profile.strategic_goal || ''}
          onSave={(value) => handleUpdate('strategic_goal', value)}
          type="textarea"
          placeholder="What are you trying to achieve?"
        />

        <div className="border-t border-gray-800 pt-4" />

        <EditableField
          label="Quarterly Focus"
          value={profile.quarterly_focus || ''}
          onSave={(value) => handleUpdate('quarterly_focus', value)}
          type="textarea"
          placeholder="What's your focus this quarter?"
          helpText="Helps us prioritize time-sensitive recommendations"
        />
      </div>
    </div>
  )
}

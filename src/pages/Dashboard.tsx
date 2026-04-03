import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { MobileMemoryDashboard } from "@/components/memory-web/MobileMemoryDashboard"
import { DesktopMemoryDashboard } from "@/components/memory-web/DesktopMemoryDashboard"
import { GuidedFirstExperience } from "@/components/memory-web/GuidedFirstExperience"
import { BottomNav } from "@/components/memory-web/BottomNav"
import { DesktopSidebar } from "@/components/memory-web/DesktopSidebar"
import { AppHeader } from "@/components/memory-web/AppHeader"
import { useDevice } from "@/hooks/useDevice"
import { useGuidedCapture } from "@/hooks/useGuidedCapture"
import { useAuth } from "@/components/auth/AuthProvider"
import { supabase } from "@/integrations/supabase/client"
import type { EdgeView } from "@/types/edge"

const EdgeViewLazy = React.lazy(() => import("@/components/edge/EdgeView"))

export default function Dashboard() {
  const { isMobile } = useDevice()
  const { isFirstTime, completeOnboarding } = useGuidedCapture()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  // Determine which view to show: Memory or Edge
  const activeView: EdgeView = (searchParams.get('view') as EdgeView) || 'memory'

  const alreadyOnboarded = !!localStorage.getItem('mindmaker_onboarded')

  const { data: hasExistingFacts, isLoading: checkingDb } = useQuery({
    queryKey: ['memory', 'onboarding-check', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_memory')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_current', true)

      if (count && count > 0) {
        localStorage.setItem('mindmaker_onboarded', 'true')
        return true
      }
      return false
    },
    enabled: !!user && !alreadyOnboarded,
    staleTime: 1000 * 60 * 5,
  })

  if (checkingDb) {
    return <div className="h-screen-safe flex items-center justify-center">Loading...</div>
  }

  if (isFirstTime && !hasExistingFacts && !alreadyOnboarded) {
    return <GuidedFirstExperience onComplete={completeOnboarding} />
  }

  // Edge view
  if (activeView === 'edge') {
    if (isMobile) {
      return (
        <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
          <AppHeader />
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <React.Suspense fallback={<div className="flex items-center justify-center py-20">Loading...</div>}>
              <EdgeViewLazy />
            </React.Suspense>
          </div>
          <BottomNav />
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-background">
        <DesktopSidebar />
        <main className="ml-64 min-h-screen">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <React.Suspense fallback={<div className="flex items-center justify-center py-20">Loading...</div>}>
              <EdgeViewLazy />
            </React.Suspense>
          </div>
        </main>
      </div>
    )
  }

  // Memory view (default)
  return isMobile ? <MobileMemoryDashboard /> : <DesktopMemoryDashboard />
}

import * as React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { MobileMemoryDashboard } from "@/components/memory-web/MobileMemoryDashboard"
import { DesktopMemoryDashboard } from "@/components/memory-web/DesktopMemoryDashboard"
import { GuidedFirstExperience } from "@/components/memory-web/GuidedFirstExperience"
import { BottomNav } from "@/components/memory-web/BottomNav"
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
  const [checkingDb, setCheckingDb] = useState(() => {
    return !localStorage.getItem('mindmaker_onboarded')
  })
  const [hasExistingFacts, setHasExistingFacts] = useState(false)

  // Determine which view to show: Memory or Edge
  const activeView: EdgeView = (searchParams.get('view') as EdgeView) || 'memory'

  useEffect(() => {
    if (!checkingDb || !user) return

    supabase
      .from('user_memory')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_current', true)
      .then(({ count }) => {
        if (count && count > 0) {
          localStorage.setItem('mindmaker_onboarded', 'true')
          setHasExistingFacts(true)
        }
        setCheckingDb(false)
      })
  }, [checkingDb, user])

  if (checkingDb) {
    return <div className="h-screen-safe flex items-center justify-center">Loading...</div>
  }

  if (isFirstTime && !hasExistingFacts) {
    return <GuidedFirstExperience onComplete={completeOnboarding} />
  }

  // Edge view
  if (activeView === 'edge') {
    return (
      <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <React.Suspense fallback={<div className="flex items-center justify-center py-20">Loading...</div>}>
            <EdgeViewLazy />
          </React.Suspense>
        </div>
        {isMobile && <BottomNav />}
      </div>
    )
  }

  // Memory view (default)
  return isMobile ? <MobileMemoryDashboard /> : <DesktopMemoryDashboard />
}

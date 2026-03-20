import * as React from "react"
import { useEffect, useState } from "react"
import { MobileMemoryDashboard } from "@/components/memory-web/MobileMemoryDashboard"
import { DesktopMemoryDashboard } from "@/components/memory-web/DesktopMemoryDashboard"
import { GuidedFirstExperience } from "@/components/memory-web/GuidedFirstExperience"
import { useDevice } from "@/hooks/useDevice"
import { useGuidedCapture } from "@/hooks/useGuidedCapture"
import { useAuth } from "@/components/auth/AuthProvider"
import { supabase } from "@/integrations/supabase/client"

export default function Dashboard() {
  const { isMobile } = useDevice()
  const { isFirstTime, completeOnboarding } = useGuidedCapture()
  const { user } = useAuth()
  const [checkingDb, setCheckingDb] = useState(() => {
    // Only need to check DB if localStorage says first-time
    return !localStorage.getItem('mindmaker_onboarded')
  })
  const [hasExistingFacts, setHasExistingFacts] = useState(false)

  useEffect(() => {
    if (!checkingDb || !user) return

    // Check if user already has memory facts in the database
    supabase
      .from('user_memory')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_current', true)
      .then(({ count }) => {
        if (count && count > 0) {
          // Returning user on new device — skip onboarding
          localStorage.setItem('mindmaker_onboarded', 'true')
          setHasExistingFacts(true)
        }
        setCheckingDb(false)
      })
  }, [checkingDb, user])

  // Show loading while checking DB for existing facts
  if (checkingDb) {
    return <div className="h-screen-safe flex items-center justify-center">Loading...</div>
  }

  // First-time users get the guided onboarding flow (unless DB check found existing facts)
  if (isFirstTime && !hasExistingFacts) {
    return <GuidedFirstExperience onComplete={completeOnboarding} />
  }

  return isMobile ? <MobileMemoryDashboard /> : <DesktopMemoryDashboard />
}

import * as React from "react"
import { MobileMemoryDashboard } from "@/components/memory-web/MobileMemoryDashboard"
import { DesktopMemoryDashboard } from "@/components/memory-web/DesktopMemoryDashboard"
import { GuidedFirstExperience } from "@/components/memory-web/GuidedFirstExperience"
import { useDevice } from "@/hooks/useDevice"
import { useGuidedCapture } from "@/hooks/useGuidedCapture"

export default function Dashboard() {
  const { isMobile } = useDevice()
  const { isFirstTime, completeOnboarding } = useGuidedCapture()

  // First-time users get the guided onboarding flow
  if (isFirstTime) {
    return <GuidedFirstExperience onComplete={completeOnboarding} />
  }

  return isMobile ? <MobileMemoryDashboard /> : <DesktopMemoryDashboard />
}

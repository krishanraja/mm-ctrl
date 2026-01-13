// src/pages/Dashboard.tsx
import * as React from "react"
import { useEffect } from "react"
import { DashboardProvider } from "@/components/dashboard/DashboardProvider"
import { MobileDashboard } from "@/components/dashboard/mobile/MobileDashboard"
import { DesktopDashboard } from "@/components/dashboard/desktop/DesktopDashboard"
import { useDevice } from "@/hooks/useDevice"

export default function Dashboard() {
  const { isMobile } = useDevice()

  // Dark mode for dashboard
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <DashboardProvider>
      {isMobile ? <MobileDashboard /> : <DesktopDashboard />}
    </DashboardProvider>
  )
}

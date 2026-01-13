import * as React from "react"
import { DashboardProvider } from "@/components/dashboard/DashboardProvider"
import { MobileDashboard } from "@/components/dashboard/mobile/MobileDashboard"
import { DesktopDashboard } from "@/components/dashboard/desktop/DesktopDashboard"
import { useDevice } from "@/hooks/useDevice"

export default function Dashboard() {
  const { isMobile } = useDevice()

  return (
    <DashboardProvider>
      {isMobile ? <MobileDashboard /> : <DesktopDashboard />}
    </DashboardProvider>
  )
}

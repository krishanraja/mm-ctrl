// src/components/dashboard/desktop/DesktopDashboard.tsx
import * as React from "react"
import { useDashboard } from "../DashboardProvider"
import { HeroStatusCard } from "../HeroStatusCard"
import { WeeklyActionCard } from "../WeeklyActionCard"
import { DailyProvocationCard } from "../DailyProvocationCard"
import { Sidebar } from "./Sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth/AuthProvider"

export function DesktopDashboard() {
  const { data, loading } = useDashboard()
  const { user } = useAuth()

  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-10 sm:p-12 md:p-16 lg:p-20">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-12 sm:mb-16 leading-[1.1] tracking-tight">
            Good {getGreeting()}, {user?.email?.split('@')[0] || 'there'}
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {loading ? (
              <>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full col-span-2" />
              </>
            ) : (
              <>
                {data?.baseline && <HeroStatusCard baseline={data.baseline} />}
                {data?.weeklyAction && <WeeklyActionCard action={data.weeklyAction} />}
                {data?.dailyProvocation && (
                  <div className="lg:col-span-2">
                    <DailyProvocationCard provocation={data.dailyProvocation} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

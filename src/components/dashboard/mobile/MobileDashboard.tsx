// src/components/dashboard/mobile/MobileDashboard.tsx
import * as React from "react"
import { useDashboard } from "../DashboardProvider"
import { HeroStatusCard } from "../HeroStatusCard"
import { WeeklyActionCard } from "../WeeklyActionCard"
import { DailyProvocationCard } from "../DailyProvocationCard"
import { BottomNav } from "./BottomNav"
import { VoiceFAB } from "./VoiceFAB"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth/AuthProvider"

export function MobileDashboard() {
  const { data, loading } = useDashboard()
  const { user } = useAuth()

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header - Apple-level typography */}
      <div className="flex-shrink-0 p-8 sm:p-10 border-b border-border/40">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
          Good {getGreeting()}, {user?.email?.split('@')[0] || 'there'}
        </h1>
      </div>

      {/* Content - Apple-level spacing */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-8 sm:space-y-10 pb-32">
        {loading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            {data?.baseline && <HeroStatusCard baseline={data.baseline} />}
            {data?.weeklyAction && <WeeklyActionCard action={data.weeklyAction} />}
            {data?.dailyProvocation && <DailyProvocationCard provocation={data.dailyProvocation} />}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
      <VoiceFAB />
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

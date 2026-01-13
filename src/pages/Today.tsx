// src/pages/Today.tsx
import * as React from "react"
import { WeeklyActionCard } from "@/components/dashboard/WeeklyActionCard"
import { DailyProvocationCard } from "@/components/dashboard/DailyProvocationCard"
import { useDashboard } from "@/components/dashboard/DashboardProvider"
import { Skeleton } from "@/components/ui/skeleton"

export default function Today() {
  const { data, loading } = useDashboard()

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header - Apple-level typography */}
      <div className="flex-shrink-0 p-8 sm:p-10 md:p-12 border-b border-border/40">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">Today</h1>
      </div>

      {/* Content - Apple-level spacing */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-8 sm:space-y-10">
        {loading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : (
          <>
            {data?.weeklyAction && <WeeklyActionCard action={data.weeklyAction} />}
            {data?.dailyProvocation && <DailyProvocationCard provocation={data.dailyProvocation} />}
          </>
        )}
      </div>
    </div>
  )
}

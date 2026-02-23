import * as React from "react"
import { motion } from "framer-motion"
import { useDashboard } from "../DashboardProvider"
import { HeroStatusCard } from "../HeroStatusCard"
import { WeeklyActionCard } from "../WeeklyActionCard"
import { DailyProvocationCard } from "../DailyProvocationCard"
import { Sidebar } from "./Sidebar"
import { useAuth } from "@/components/auth/AuthProvider"
import { MissionsDashboard } from "@/components/missions/MissionsDashboard"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function DesktopDashboard() {
  const { data, loading } = useDashboard()
  const { user } = useAuth()
  const firstName = user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <p className="text-sm text-muted-foreground">Good {getGreeting()}</p>
            <h1 className="text-2xl font-semibold capitalize">{firstName}</h1>
          </motion.div>

          {/* Content Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {loading ? (
              <>
                <div className="h-48 bg-secondary rounded-2xl skeleton-shimmer lg:col-span-2" />
                <div className="h-40 bg-secondary rounded-2xl skeleton-shimmer" />
                <div className="h-40 bg-secondary rounded-2xl skeleton-shimmer" />
              </>
            ) : (
              <>
                {/* Phase 1: Missions Dashboard */}
                {user?.id && (
                  <div className="lg:col-span-2">
                    <MissionsDashboard leaderId={user.id} />
                  </div>
                )}
                
                {data.baseline && (
                  <div className="lg:col-span-2">
                    <HeroStatusCard baseline={data.baseline} />
                  </div>
                )}
                {data.weeklyAction && <WeeklyActionCard action={data.weeklyAction} />}
                {data.dailyProvocation && <DailyProvocationCard provocation={data.dailyProvocation} />}
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

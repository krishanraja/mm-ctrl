import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { WeeklyActionCard } from "@/components/dashboard/WeeklyActionCard"
import { DailyProvocationCard } from "@/components/dashboard/DailyProvocationCard"
import { DashboardProvider, useDashboard } from "@/components/dashboard/DashboardProvider"
import { useDevice } from "@/hooks/useDevice"
import { Sidebar } from "@/components/dashboard/desktop/Sidebar"

function TodayContent() {
  const { data, loading } = useDashboard()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-secondary rounded-2xl skeleton-shimmer" />
        <div className="h-40 bg-secondary rounded-2xl skeleton-shimmer" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {data.weeklyAction && <WeeklyActionCard action={data.weeklyAction} />}
      {data.dailyProvocation && <DailyProvocationCard provocation={data.dailyProvocation} />}
    </motion.div>
  )
}

export default function Today() {
  const navigate = useNavigate()
  const { isMobile } = useDevice()

  if (!isMobile) {
    return (
      <DashboardProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className="ml-64 p-8">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-semibold mb-6">Today</h1>
              <TodayContent />
            </div>
          </main>
        </div>
      </DashboardProvider>
    )
  }

  return (
    <DashboardProvider>
      <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center gap-4 px-4 py-4 border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Today</h1>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 pb-20 scrollbar-hide">
          <TodayContent />
        </main>
      </div>
    </DashboardProvider>
  )
}

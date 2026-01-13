// src/components/dashboard/DashboardProvider.tsx
import * as React from "react"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth/AuthProvider"

interface DashboardData {
  baseline: any
  weeklyAction: any
  dailyProvocation: any
}

interface DashboardContextType {
  data: DashboardData | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [weeklyAction, dailyProvocation, pulse] = await Promise.all([
        api.getWeeklyAction(user.id).catch(() => ({ action: null })),
        api.getDailyProvocation(user.id).catch(() => ({ provocation: null })),
        api.getStrategicPulse(user.id).catch(() => ({ baseline: null, tensions: [], risks: [] })),
      ])

      setData({
        baseline: pulse.baseline,
        weeklyAction: weeklyAction.action,
        dailyProvocation: dailyProvocation.provocation,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  return (
    <DashboardContext.Provider value={{ data, loading, error, refetch: fetchData }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return context
}

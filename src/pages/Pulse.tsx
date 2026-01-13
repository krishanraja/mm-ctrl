// src/pages/Pulse.tsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboard } from "@/components/dashboard/DashboardProvider"
import { Skeleton } from "@/components/ui/skeleton"
import { useDevice } from "@/hooks/useDevice"

export default function Pulse() {
  const navigate = useNavigate()
  const { data, loading } = useDashboard()
  const { isMobile } = useDevice()

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header - Apple-level typography */}
      <div className="flex-shrink-0 p-6 sm:p-8 md:p-10 border-b border-border/40 flex items-center gap-4 sm:gap-6">
        <Button variant="ghost" size="icon-lg" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">Strategic Pulse</h1>
      </div>

      {/* Content - Apple-level spacing */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-8 sm:space-y-10">
        {loading ? (
          <>
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </>
        ) : (
          <>
            {data?.baseline && (
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl sm:text-3xl font-bold">Your Baseline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                    {data.baseline.score || 0} <span className="text-3xl sm:text-4xl text-muted-foreground font-medium">/ 100</span>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground font-medium">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold">Active Tensions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">No active tensions detected.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold">Risk Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">No risk signals detected.</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

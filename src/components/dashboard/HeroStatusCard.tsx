// src/components/dashboard/HeroStatusCard.tsx
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HeroStatusCardProps {
  baseline: any
}

export function HeroStatusCard({ baseline }: HeroStatusCardProps) {
  const score = baseline?.score || 0
  const tier = baseline?.tier || "Getting Started"
  const percentile = baseline?.percentile || 0

  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground font-semibold">
          Your AI Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-5xl sm:text-6xl md:text-7xl font-bold mb-3 tracking-tight">
            {score} <span className="text-3xl sm:text-4xl text-muted-foreground font-medium">/ 100</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-accent">{tier}</div>
        </div>
        <div className="text-base sm:text-lg text-muted-foreground font-medium">
          Top {percentile}% of leaders
        </div>
      </CardContent>
    </Card>
  )
}

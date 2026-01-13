import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface BaselineCardProps {
  baseline: {
    score: number
    tier: string
    percentile: number
  }
}

export function BaselineCard({ baseline }: BaselineCardProps) {
  const { score, tier, percentile } = baseline

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          Your Baseline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-bold text-accent">{score}</span>
          <span className="text-sm text-muted-foreground mb-1">/ 100</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tier</span>
            <span className="font-medium">{tier}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Percentile</span>
            <span className="font-medium">Top {percentile}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

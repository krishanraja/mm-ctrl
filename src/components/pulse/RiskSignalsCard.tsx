import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RiskSignal {
  id: string
  title: string
  level: 'high' | 'medium' | 'low'
}

interface RiskSignalsCardProps {
  risks: RiskSignal[]
}

export function RiskSignalsCard({ risks }: RiskSignalsCardProps) {
  const levelColors = {
    high: 'text-destructive',
    medium: 'text-yellow-500',
    low: 'text-accent',
  }

  const levelBg = {
    high: 'bg-destructive',
    medium: 'bg-yellow-500',
    low: 'bg-accent',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          Risk Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {risks.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center text-accent">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">No risk signals detected</span>
          </div>
        ) : (
          <div className="space-y-2">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-center gap-3 py-2"
              >
                <div className={cn("w-2 h-2 rounded-full", levelBg[risk.level])} />
                <span className="text-sm flex-1">{risk.title}</span>
                <span className={cn("text-xs font-medium capitalize", levelColors[risk.level])}>
                  {risk.level}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

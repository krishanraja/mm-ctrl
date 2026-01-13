import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, ArrowRight } from "lucide-react"

interface WeeklyActionCardProps {
  action: {
    text: string
    why: string
    cta?: string
  }
}

export function WeeklyActionCard({ action }: WeeklyActionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-accent" />
          </div>
          <CardTitle className="text-base">This Week's Focus</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{action.text}</p>
        {action.why && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Why:</span> {action.why}
          </p>
        )}
        {action.cta && (
          <Button variant="outline" size="sm" className="w-full">
            {action.cta}
            <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

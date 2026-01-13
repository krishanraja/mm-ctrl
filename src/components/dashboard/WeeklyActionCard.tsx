// src/components/dashboard/WeeklyActionCard.tsx
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface WeeklyActionCardProps {
  action: any
}

export function WeeklyActionCard({ action }: WeeklyActionCardProps) {
  if (!action) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No weekly action available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold">This Week's Focus</CardTitle>
        {action.why && (
          <CardDescription className="text-base sm:text-lg mt-3 leading-relaxed">Why: {action.why}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg sm:text-xl leading-[1.6] font-medium">{action.text || action.action}</p>
        {action.cta && (
          <Button variant="accent" size="lg" className="w-full h-14 text-lg font-semibold">
            {action.cta}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

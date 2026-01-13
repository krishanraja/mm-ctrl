// src/components/dashboard/DailyProvocationCard.tsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface DailyProvocationCardProps {
  provocation: any
}

export function DailyProvocationCard({ provocation }: DailyProvocationCardProps) {
  const navigate = useNavigate()

  if (!provocation) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No daily provocation available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold">Today's Question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg sm:text-xl leading-[1.6] font-medium">{provocation.question || provocation.text}</p>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/voice')}
          className="w-full h-14 text-lg font-semibold"
        >
          Answer
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

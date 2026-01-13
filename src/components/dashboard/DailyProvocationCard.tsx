import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Mic } from "lucide-react"

interface DailyProvocationCardProps {
  provocation: {
    question: string
  }
}

export function DailyProvocationCard({ provocation }: DailyProvocationCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-base">Today's Question</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed italic">
          "{provocation.question}"
        </p>
        <Button 
          variant="accent" 
          size="sm" 
          className="w-full"
          onClick={() => navigate('/voice')}
        >
          <Mic className="w-3 h-3 mr-2" />
          Answer with Voice
        </Button>
      </CardContent>
    </Card>
  )
}

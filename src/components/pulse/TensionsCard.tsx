import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tension {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface TensionsCardProps {
  tensions: Tension[]
}

export function TensionsCard({ tensions }: TensionsCardProps) {
  const priorityColors = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    low: 'bg-accent/10 text-accent border-accent/20',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          Active Tensions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tensions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active tensions detected
          </p>
        ) : (
          <div className="space-y-3">
            {tensions.map((tension) => (
              <div
                key={tension.id}
                className={cn(
                  "p-3 rounded-lg border",
                  priorityColors[tension.priority]
                )}
              >
                <p className="text-sm font-medium mb-1">{tension.title}</p>
                <p className="text-xs opacity-80">{tension.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

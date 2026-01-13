// src/components/diagnostic/ProgressBar.tsx
import * as React from "react"
import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100

  return (
    <div className="w-full space-y-3">
      <Progress value={progress} />
      <div className="flex justify-between items-center">
        <span className="text-base sm:text-lg font-medium text-muted-foreground">
          Step {current} of {total}
        </span>
      </div>
    </div>
  )
}

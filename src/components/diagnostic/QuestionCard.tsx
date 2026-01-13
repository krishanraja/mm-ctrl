// src/components/diagnostic/QuestionCard.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface QuestionCardProps {
  option: string
  label: string
  selected: boolean
  onClick: () => void
}

export function QuestionCard({ option, label, selected, onClick }: QuestionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-6 sm:p-7 md:p-8 rounded-2xl border transition-all duration-200",
        "bg-card hover:bg-muted/50 hover:shadow-md",
        selected
          ? "border-accent border-2 bg-accent/5 shadow-sm"
          : "border-border/50"
      )}
    >
      <div className="flex items-start gap-4 sm:gap-5">
        <div className={cn(
          "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all",
          selected ? "border-accent bg-accent scale-110" : "border-border"
        )}>
          {selected && (
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-accent-foreground" />
          )}
        </div>
        <span className="flex-1 text-lg sm:text-xl md:text-xl leading-[1.6] font-medium">{label}</span>
      </div>
    </button>
  )
}

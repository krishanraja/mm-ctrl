// src/components/landing/TrustIndicators.tsx
import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const indicators = [
  "No integrations needed",
  "Encrypted at rest",
  "Export to any AI",
  "Delete anytime",
]

export function TrustIndicators({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 sm:gap-6", className)}>
      {indicators.map((text, index) => (
        <div key={index} className="flex items-center gap-2">
          <Check className="h-4 w-4 text-accent flex-shrink-0" />
          <span className="text-sm text-muted-foreground">{text}</span>
        </div>
      ))}
    </div>
  )
}

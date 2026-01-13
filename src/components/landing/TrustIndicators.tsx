// src/components/landing/TrustIndicators.tsx
import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const indicators = [
  "20+ years executive coaching",
  "Boardroom-ready insights",
  "Actionable guidance, no fluff",
]

export function TrustIndicators({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 sm:gap-8 md:gap-10", className)}>
      {indicators.map((text, index) => (
        <div key={index} className="flex items-center gap-3">
          <Check className="h-5 w-5 text-accent flex-shrink-0" />
          <span className="text-base sm:text-lg text-muted-foreground leading-relaxed">{text}</span>
        </div>
      ))}
    </div>
  )
}

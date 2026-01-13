import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface HeroStatusCardProps {
  baseline: {
    score: number
    tier: string
    percentile: number
  }
}

export function HeroStatusCard({ baseline }: HeroStatusCardProps) {
  const { score, tier, percentile } = baseline

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
              AI Readiness
            </p>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-4xl sm:text-5xl font-bold text-accent"
            >
              {score}
            </motion.div>
            <p className="text-sm text-muted-foreground">out of 100</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-md text-accent text-sm font-medium">
              <TrendingUp className="w-3 h-3" />
              Top {percentile}%
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Your Tier
          </p>
          <p className="text-lg font-semibold">{tier}</p>
        </div>
      </CardContent>
    </Card>
  )
}

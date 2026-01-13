import * as React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Trophy, TrendingUp } from "lucide-react"

interface ResultsCardProps {
  score: number
  tier: string
  percentile: number
  onContinue?: () => void
}

export function ResultsCard({ score, tier, percentile, onContinue }: ResultsCardProps) {
  const navigate = useNavigate()

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="text-center">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-xl">Your AI Readiness Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score */}
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-5xl sm:text-6xl font-bold text-accent"
            >
              {score}
            </motion.div>
            <p className="text-sm text-muted-foreground mt-1">out of 100</p>
          </div>

          {/* Tier */}
          <div className="py-3 px-4 bg-secondary rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Your Tier
            </p>
            <p className="text-lg font-semibold">{tier}</p>
          </div>

          {/* Percentile */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span>Top <strong>{percentile}%</strong> of leaders assessed</span>
          </div>

          {/* CTA */}
          <Button onClick={handleContinue} className="w-full" size="lg">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

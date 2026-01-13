import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { motion } from "framer-motion"

interface QuestionCardProps {
  option: string
  label: string
  selected: boolean
  onClick: () => void
}

export function QuestionCard({ option, label, selected, onClick }: QuestionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200",
        "bg-card hover:bg-secondary/50",
        selected
          ? "border-accent bg-accent/10 shadow-sm"
          : "border-border hover:border-border/80"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          selected 
            ? "border-accent bg-accent" 
            : "border-muted-foreground/30"
        )}>
          {selected && (
            <Check className="w-3 h-3 text-accent-foreground" />
          )}
        </div>
        <span className="text-sm leading-relaxed">{label}</span>
      </div>
    </motion.button>
  )
}

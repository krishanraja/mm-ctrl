import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Mic } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function VoiceFAB() {
  const navigate = useNavigate()

  return (
    <motion.button
      onClick={() => navigate('/voice')}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.2 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "fixed bottom-20 right-4 z-40",
        "w-14 h-14 rounded-full",
        "bg-accent text-accent-foreground",
        "flex items-center justify-center",
        "shadow-lg shadow-accent/25",
        "fab-pulse"
      )}
    >
      <Mic className="h-6 w-6" />
    </motion.button>
  )
}

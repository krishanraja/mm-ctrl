// src/components/dashboard/mobile/VoiceFAB.tsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Mic } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function VoiceFAB() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="fixed bottom-32 sm:bottom-36 right-6 sm:right-8 z-40"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Button
          size="icon-xl"
          variant="accent"
          onClick={() => navigate('/voice')}
          className="rounded-full shadow-2xl hover:shadow-accent/50"
        >
          <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
        </Button>
      </motion.div>
    </motion.div>
  )
}

// src/components/voice/AudioWaveform.tsx
import * as React from "react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface AudioWaveformProps {
  isRecording: boolean
}

export function AudioWaveform({ isRecording }: AudioWaveformProps) {
  const [bars, setBars] = useState<number[]>(Array(20).fill(0))

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(20).fill(0))
      return
    }

    // Simulate waveform animation
    const interval = setInterval(() => {
      setBars(Array(20).fill(0).map(() => Math.random() * 0.8 + 0.2))
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording])

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-1 bg-accent rounded-full"
          animate={{
            height: `${height * 100}%`,
          }}
          transition={{
            duration: 0.1,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}

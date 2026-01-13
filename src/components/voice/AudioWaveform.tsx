import * as React from "react"
import { cn } from "@/lib/utils"

interface AudioWaveformProps {
  isRecording: boolean
  barCount?: number
}

export function AudioWaveform({ isRecording, barCount = 24 }: AudioWaveformProps) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full bg-accent transition-all duration-150",
            isRecording ? "waveform-bar" : "h-2"
          )}
          style={{
            animationDelay: isRecording ? `${i * 0.05}s` : undefined,
            height: isRecording ? undefined : '8px',
          }}
        />
      ))}
    </div>
  )
}

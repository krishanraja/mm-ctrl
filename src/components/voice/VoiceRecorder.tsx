import * as React from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useVoice } from "@/hooks/useVoice"
import { AudioWaveform } from "./AudioWaveform"
import { cn } from "@/lib/utils"
import { sanitizeTranscriptionError } from "@/utils/transcriptionErrors"

interface VoiceRecorderProps {
  onTranscript?: (transcript: string) => void
}

export function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const {
    isRecording,
    isProcessing,
    duration,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoice({
    maxDuration: 120,
    onTranscript,
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Show transcript result
  if (transcript) {
    return (
      <div className="space-y-6 w-full">
        <div className="p-4 bg-secondary rounded-xl">
          <p className="text-sm leading-relaxed">{transcript}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={resetRecording} className="flex-1">
            Record Again
          </Button>
          <Button onClick={() => onTranscript?.(transcript)} className="flex-1">
            Submit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-1">Voice Check-in</h2>
        <p className="text-sm text-muted-foreground">
          Share what's on your mind. Up to 2 minutes.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">
          {sanitizeTranscriptionError(error.message)}
        </div>
      )}

      {/* Processing state */}
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 text-accent animate-spin" />
          <p className="text-sm text-muted-foreground">Processing your recording...</p>
        </div>
      ) : (
        <>
          {/* Mic Button */}
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              "transition-all duration-200",
              isRecording
                ? "bg-destructive text-destructive-foreground recording-pulse"
                : "bg-accent text-accent-foreground glow-accent-sm hover:glow-accent"
            )}
          >
            {isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </motion.button>

          {/* Recording UI */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              {/* Timer */}
              <div className="text-3xl font-bold tabular-nums">
                {formatTime(duration)}
                <span className="text-lg text-muted-foreground ml-2">/ 2:00</span>
              </div>

              {/* Waveform */}
              <AudioWaveform isRecording={isRecording} />

              {/* Stop button */}
              <Button
                variant="destructive"
                onClick={stopRecording}
                className="w-full"
              >
                Stop Recording
              </Button>
            </motion.div>
          )}

          {/* Idle hint */}
          {!isRecording && (
            <p className="text-xs text-muted-foreground">
              Tap the microphone to start
            </p>
          )}
        </>
      )}
    </div>
  )
}

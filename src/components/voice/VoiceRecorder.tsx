// src/components/voice/VoiceRecorder.tsx
import * as React from "react"
import { Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVoice } from "@/hooks/useVoice"
import { AudioWaveform } from "./AudioWaveform"
import { cn } from "@/lib/utils"

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

  if (transcript) {
    return (
      <div className="space-y-6 sm:space-y-8 w-full max-w-2xl">
        <div className="p-8 sm:p-10 bg-muted/30 rounded-3xl border border-border/40">
          <p className="text-lg sm:text-xl leading-[1.6] font-medium">{transcript}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <Button variant="outline" size="lg" onClick={resetRecording} className="flex-1 h-14 text-lg font-semibold">
            Record Again
          </Button>
          <Button size="lg" onClick={() => onTranscript?.(transcript)} className="flex-1 h-14 text-lg font-semibold">
            Submit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Weekly Check-in</h2>
        <p className="text-muted-foreground">
          Share what's on your mind. Speak for up to 2 minutes.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-xl">
          {error.message}
        </div>
      )}

      {isProcessing ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your recording...</p>
        </div>
      ) : (
        <>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`
              h-20 w-20 rounded-full flex items-center justify-center
              transition-all duration-200
              ${isRecording
                ? 'bg-destructive text-destructive-foreground scale-110'
                : 'bg-accent text-accent-foreground hover:bg-accent/90'
              }
              shadow-lg
            `}
          >
            {isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>

          {isRecording && (
            <>
              <div className="text-4xl font-bold">
                {formatTime(duration)} / {formatTime(120)}
              </div>
              <AudioWaveform isRecording={isRecording} />
              <Button
                variant="destructive"
                onClick={stopRecording}
                className="w-full h-14 text-lg"
              >
                Stop Recording
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}

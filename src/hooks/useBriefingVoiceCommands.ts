import { useCallback, useEffect, useRef, useState } from 'react'
import { useBriefingContext } from '@/contexts/BriefingContext'
import type { PlaybackSpeed } from '@/types/briefing'

type CommandName =
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'faster'
  | 'slower'
  | 'stop'

interface UseBriefingVoiceCommandsReturn {
  supported: boolean
  listening: boolean
  lastCommand: CommandName | null
  start: () => void
  stop: () => void
}

const SPEED_STEPS: PlaybackSpeed[] = [0.75 as PlaybackSpeed, 1, 1.25, 1.5, 2]

function getSpeedStep(current: PlaybackSpeed, direction: 1 | -1): PlaybackSpeed {
  const idx = SPEED_STEPS.indexOf(current)
  const safeIdx = idx === -1 ? 1 : idx
  const next = Math.min(SPEED_STEPS.length - 1, Math.max(0, safeIdx + direction))
  return SPEED_STEPS[next]
}

function matchCommand(raw: string): CommandName | null {
  const text = raw.toLowerCase().trim()
  if (!text) return null
  if (/\b(pause|hold on|wait)\b/.test(text)) return 'pause'
  if (/\b(play|resume|continue|go on|keep going)\b/.test(text)) return 'play'
  if (/\b(next|skip|forward|ahead)\b/.test(text)) return 'next'
  if (/\b(back|previous|repeat|again)\b/.test(text)) return 'previous'
  if (/\b(faster|speed up|quicker)\b/.test(text)) return 'faster'
  if (/\b(slower|slow down)\b/.test(text)) return 'slower'
  if (/\b(stop|close|end|done)\b/.test(text)) return 'stop'
  return null
}

function getSpeechRecognition(): typeof window extends unknown
  ? { new (): SpeechRecognitionLike } | null
  : null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = typeof window !== 'undefined' ? (window as any) : null
  if (!w) return null
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((ev: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

/**
 * Client-side voice command recognition for briefing playback. Uses the Web
 * Speech API directly (no MediaRecorder, no backend round-trip) so commands
 * can fire without interrupting the ElevenLabs audio stream.
 */
export function useBriefingVoiceCommands(): UseBriefingVoiceCommandsReturn {
  const { play, pause, seek, setSpeed, playback, setSheetOpen, briefing } = useBriefingContext()
  const [listening, setListening] = useState(false)
  const [lastCommand, setLastCommand] = useState<CommandName | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const latestPlayback = useRef(playback)
  latestPlayback.current = playback

  const supported = Boolean(getSpeechRecognition())

  const handleCommand = useCallback(
    (cmd: CommandName) => {
      setLastCommand(cmd)
      const segments = briefing?.segments ?? []
      const current = latestPlayback.current
      const segmentCount = segments.length
      const segmentDuration =
        segmentCount > 0 && briefing?.audio_duration_seconds
          ? briefing.audio_duration_seconds / segmentCount
          : 0

      switch (cmd) {
        case 'play':
          play()
          break
        case 'pause':
          pause()
          break
        case 'stop':
          pause()
          setSheetOpen(false)
          break
        case 'next': {
          if (!segmentDuration) return
          const targetIndex = Math.min(segmentCount - 1, current.currentSegmentIndex + 1)
          seek(targetIndex * segmentDuration)
          break
        }
        case 'previous': {
          if (!segmentDuration) return
          const segmentStart = current.currentSegmentIndex * segmentDuration
          const withinThreshold = current.currentTime - segmentStart < 2
          const targetIndex = withinThreshold
            ? Math.max(0, current.currentSegmentIndex - 1)
            : current.currentSegmentIndex
          seek(targetIndex * segmentDuration)
          break
        }
        case 'faster':
          setSpeed(getSpeedStep(current.speed, 1))
          break
        case 'slower':
          setSpeed(getSpeedStep(current.speed, -1))
          break
      }
    },
    [play, pause, seek, setSpeed, setSheetOpen, briefing],
  )

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition) {
      try {
        recognition.stop()
      } catch {
        /* already stopped */
      }
    }
    recognitionRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognition()
    if (!SpeechRecognitionCtor) return

    if (recognitionRef.current) {
      stop()
      return
    }

    const recognition = new SpeechRecognitionCtor() as SpeechRecognitionLike
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result.isFinal) continue
        const transcript = result[0]?.transcript ?? ''
        const cmd = matchCommand(transcript)
        if (cmd) handleCommand(cmd)
      }
    }
    recognition.onerror = () => {
      /* non-blocking */
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      recognitionRef.current = null
      setListening(false)
    }
  }, [handleCommand, stop])

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current
      if (recognition) {
        try {
          recognition.stop()
        } catch {
          /* ignore */
        }
      }
      recognitionRef.current = null
    }
  }, [])

  return { supported, listening, lastCommand, start, stop }
}

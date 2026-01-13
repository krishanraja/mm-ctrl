import { useState, useRef, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'

interface UseVoiceOptions {
  maxDuration?: number // in seconds
  onTranscript?: (transcript: string) => void
}

interface UseVoiceReturn {
  isRecording: boolean
  isProcessing: boolean
  duration: number
  transcript: string | null
  error: Error | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetRecording: () => void
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { maxDuration = 120, onTranscript } = options

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscript(null)
      setDuration(0)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsRecording(false)
        setIsProcessing(true)

        try {
          const audioBlob = new Blob(chunksRef.current, { 
            type: mediaRecorder.mimeType 
          })

          // Transcribe using Whisper API
          const result = await api.transcribeAudio(audioBlob)
          setTranscript(result.transcript)
          onTranscript?.(result.transcript)
        } catch (err) {
          console.error('Transcription error:', err)
          setError(err as Error)
        } finally {
          setIsProcessing(false)
          cleanup()
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)

    } catch (err) {
      console.error('Failed to start recording:', err)
      setError(new Error('Microphone access denied. Please allow microphone access to record.'))
      cleanup()
    }
  }, [maxDuration, onTranscript, cleanup])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // Reset recording
  const resetRecording = useCallback(() => {
    cleanup()
    setIsRecording(false)
    setIsProcessing(false)
    setDuration(0)
    setTranscript(null)
    setError(null)
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isRecording,
    isProcessing,
    duration,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  }
}

import { useState, useRef, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { uploadVoiceRecordingToStorage } from '@/utils/supabaseStorage'

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

  // Web Speech API fallback: accumulates transcript in parallel during recording
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecognitionRef = useRef<any>(null)
  const webSpeechTranscriptRef = useRef<string>('')

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
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop() } catch { /* already stopped */ }
      speechRecognitionRef.current = null
    }
    webSpeechTranscriptRef.current = ''
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
      webSpeechTranscriptRef.current = ''

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
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

        // Stop Web Speech API recognition
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop() } catch { /* already stopped */ }
          speechRecognitionRef.current = null
        }

        try {
          const audioBlob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType
          })

          // Transcribe via edge function (Whisper -> Gemini failover)
          const result = await api.transcribeAudio(audioBlob)
          setTranscript(result.transcript)

          if (result.provider) {
            console.log(`[VOICE] Transcribed via ${result.provider}`)
          }

          // Retain raw audio in Supabase Storage (fire-and-forget)
          const sessionId = crypto.randomUUID()
          uploadVoiceRecordingToStorage(audioBlob, sessionId, 'voice-capture')
            .catch(err => console.warn('Audio storage failed (non-blocking):', err))

          if (onTranscript) {
            await onTranscript(result.transcript)
          }
        } catch (err) {
          // TIER 3: If edge function failed entirely, try the Web Speech API fallback
          const fallbackText = webSpeechTranscriptRef.current.trim()
          if (fallbackText.length > 5) {
            console.warn('[VOICE] Edge function failed, using Web Speech API fallback transcript')
            setTranscript(fallbackText)
            if (onTranscript) {
              await onTranscript(fallbackText)
            }
          } else {
            console.error('Transcription error:', err)
            setError(err as Error)
          }
        } finally {
          setIsProcessing(false)
          cleanup()
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)

      // Start parallel Web Speech API recognition as client-side fallback
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any
        const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition
        if (SpeechRecognitionAPI) {
          const recognition = new SpeechRecognitionAPI()
          recognition.continuous = true
          recognition.interimResults = false // only final results
          recognition.lang = 'en-US'

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                webSpeechTranscriptRef.current += event.results[i][0].transcript + ' '
              }
            }
          }
          recognition.onerror = () => { /* non-blocking fallback */ }
          recognition.onend = () => {
            // Restart if still recording (Web Speech API auto-stops after silence)
            if (mediaRecorderRef.current?.state === 'recording' && speechRecognitionRef.current) {
              try { speechRecognitionRef.current.start() } catch { /* ignore */ }
            }
          }

          speechRecognitionRef.current = recognition
          recognition.start()
        }
      } catch {
        // Web Speech API not available - no fallback, but edge function still works
      }

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

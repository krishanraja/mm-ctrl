// src/hooks/useVoice.ts
import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface UseVoiceOptions {
  maxDuration?: number // seconds
  onTranscript?: (transcript: string) => void
  onError?: (error: Error) => void
}

interface UseVoiceReturn {
  isRecording: boolean
  isProcessing: boolean
  duration: number
  transcript: string | null
  error: Error | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  resetRecording: () => void
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { maxDuration = 120, onTranscript, onError } = options
  
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.start(1000) // Capture in 1-second chunks
      setIsRecording(true)
      setDuration(0)
      setError(null)
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= maxDuration - 1) {
            stopRecording()
            return maxDuration
          }
          return d + 1
        })
      }, 1000)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording')
      setError(error)
      onError?.(error)
    }
  }, [maxDuration, onError])
  
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return
    
    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!
      
      mediaRecorder.onstop = async () => {
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop())
        
        setIsRecording(false)
        setIsProcessing(true)
        
        try {
          // Create audio blob
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          
          // Send to Whisper via edge function
          const formData = new FormData()
          formData.append('file', audioBlob, 'recording.webm')
          
          const { data, error: transcribeError } = await supabase.functions.invoke(
            'voice-transcribe',
            { body: formData }
          )
          
          if (transcribeError) throw transcribeError
          
          const transcriptText = data?.transcript || ''
          setTranscript(transcriptText)
          onTranscript?.(transcriptText)
          
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Transcription failed')
          setError(error)
          onError?.(error)
        } finally {
          setIsProcessing(false)
        }
        
        resolve()
      }
      
      mediaRecorder.stop()
    })
  }, [isRecording, onTranscript, onError])
  
  const resetRecording = useCallback(() => {
    setTranscript(null)
    setDuration(0)
    setError(null)
  }, [])
  
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

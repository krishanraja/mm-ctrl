import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder } from '@/utils/audioRecorder';

interface UseAudioCaptureOptions {
  /** Maximum recording duration in seconds. When reached, recording stops automatically. */
  maxDuration?: number;
}

interface UseAudioCaptureReturn {
  /** Start recording. The onAudioReady callback fires with the audio Blob when recording stops. */
  startRecording: (onAudioReady: (blob: Blob) => void) => Promise<void>;
  /** Stop the current recording (triggers the onAudioReady callback passed to startRecording). */
  stopRecording: () => void;
  /** Whether the recorder is currently active. */
  isRecording: boolean;
  /** Elapsed recording time in seconds. Resets when recording starts. */
  duration: number;
  /** Error message from mic permission or recorder failures; null when no error. */
  error: string | null;
  /** Clear error state. */
  clearError: () => void;
  /** Tear down recorder and timers. Called automatically on unmount. */
  cleanup: () => void;
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}): UseAudioCaptureReturn {
  const { maxDuration } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopCalledRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearTimer();
    if (recorderRef.current?.isRecording()) {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setIsRecording(false);
    setDuration(0);
  }, [clearTimer]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      clearTimer();
      setDuration(0);
    }
  }, [clearTimer]);

  const startRecording = useCallback(async (onAudioReady: (blob: Blob) => void) => {
    try {
      setError(null);
      stopCalledRef.current = false;
      recorderRef.current = new AudioRecorder();

      await recorderRef.current.start((audioBlob) => {
        onAudioReady(audioBlob);
      });

      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          if (maxDuration && next >= maxDuration && !stopCalledRef.current) {
            stopCalledRef.current = true;
            // Defer stop to avoid state update during setDuration
            queueMicrotask(() => {
              if (recorderRef.current?.isRecording()) {
                recorderRef.current.stop();
                setIsRecording(false);
                clearTimer();
              }
            });
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
      throw err;
    }
  }, [maxDuration, clearTimer]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (recorderRef.current?.isRecording()) {
        recorderRef.current.stop();
      }
    };
  }, [clearTimer]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    duration,
    error,
    clearError,
    cleanup,
  };
}

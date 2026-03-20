/**
 * VoiceEntry Component
 * 
 * Quick voice entry (30 seconds) - Voice-first input.
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, X, Loader2, MessageSquare, Send } from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';
import { haptics } from '@/lib/haptics';
import { invokeEdgeFunction } from '@/lib/api';
import { QUICK_VOICE_DURATION } from '@/core/constants';
import { cn } from '@/lib/utils';

interface VoiceEntryProps {
  onComplete: (transcript: string) => void;
  onCancel: () => void;
}

export function VoiceEntry({ onComplete, onCancel }: VoiceEntryProps) {
  const { isMobile } = useDevice();
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QUICK_VOICE_DURATION);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeRemaining(QUICK_VOICE_DURATION);
      haptics.light();

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      haptics.medium();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Send to backend for transcription using OpenAI Whisper
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('sessionId', `voice-entry-${Date.now()}-${Math.random().toString(36).substring(7)}`);
      formData.append('moduleType', 'landing_voice');

      const { data, error } = await invokeEdgeFunction<{ transcript: string; confidence?: number; duration_seconds?: number }>(
        'voice-transcribe',
        formData,
        { retries: 2 }
      );

      if (error || !data?.transcript) {
        throw new Error(error || 'Transcription failed');
      }

      const transcript = data.transcript.trim();

      if (!transcript) {
        throw new Error('No speech detected. Please try again.');
      }

      setTranscript(transcript);
      setIsProcessing(false);
      onComplete(transcript);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process recording. Please try again.';
      setError(errorMessage);
      setIsProcessing(false);
      console.error('Error processing recording:', err);
    }
  };

  return (
    <div className="h-[var(--mobile-vh)] flex flex-col items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">What's on your mind?</h2>
          <p className="text-muted-foreground">Voice it. We'll organize it.</p>
        </div>

        {/* Recording Interface */}
        <div className="flex flex-col items-center space-y-4">
          {inputMode === 'text' ? (
            <>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="What's on your mind right now?"
                rows={4}
                autoFocus
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-muted border border-border',
                  'text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30',
                  'resize-none text-sm',
                )}
              />
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => setInputMode('voice')}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Use voice
                </Button>
                <Button
                  onClick={() => {
                    if (textInput.trim()) {
                      onComplete(textInput.trim());
                    }
                  }}
                  disabled={!textInput.trim()}
                  className="flex-1 gap-2"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </Button>
              </div>
            </>
          ) : isRecording ? (
            <>
              <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
                <Mic className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{timeRemaining}s</p>
                <p className="text-sm text-muted-foreground">Recording...</p>
              </div>
              <Button onClick={stopRecording} variant="outline" size="lg" className="w-full">
                Stop Recording
              </Button>
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Processing your voice...</p>
            </>
          ) : (
            <>
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                <Mic className="w-12 h-12 text-muted-foreground" />
              </div>
              <Button onClick={startRecording} size="lg" className="w-full">
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
              <button
                onClick={() => setInputMode('text')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Type instead
              </button>
            </>
          )}

          {error && (
            <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
          </div>
          )}

          <Button onClick={onCancel} variant="ghost" size="sm" className="w-full">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

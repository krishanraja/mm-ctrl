import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { AudioRecorder } from '@/utils/audioRecorder';
import { api } from '@/lib/api';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  placeholder?: string;
  maxDuration?: number;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  placeholder = 'Tap to record',
  maxDuration = 60,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current?.isRecording()) recorderRef.current.stop();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      recorderRef.current = new AudioRecorder();
      
      await recorderRef.current.start(async (audioBlob) => {
        setIsTranscribing(true);
        await transcribeAudio(audioBlob);
      });

      setIsRecording(true);
      setElapsedTime(0);

      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const result = await api.transcribeAudio(audioBlob, `deep-profile-${Date.now()}`, 'deep_profile');
      if (result?.transcript) {
        onTranscript(result.transcript);
      }
      setIsTranscribing(false);
    } catch (err) {
      console.error('Error transcribing:', err);
      setError('Failed to transcribe. Try typing instead.');
      setIsTranscribing(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant={isRecording ? 'default' : 'outline'}
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
        className={`gap-2 ${isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}`}
      >
        {isTranscribing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing...
          </>
        ) : isRecording ? (
          <>
            <MicOff className="h-4 w-4" />
            Stop ({elapsedTime}s)
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            {placeholder}
          </>
        )}
      </Button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
};

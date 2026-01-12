import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Loader2, Edit2, X } from 'lucide-react';
import { AudioRecorder } from '@/utils/audioRecorder';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/utils/haptic';

interface VoiceFirstInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  maxDuration?: number;
  className?: string;
  showTextFallback?: boolean;
}

export const VoiceFirstInput: React.FC<VoiceFirstInputProps> = ({
  value,
  onValueChange,
  placeholder = 'Tap to speak',
  label,
  maxDuration = 60,
  className = '',
  showTextFallback = true
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      haptic.medium();
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
      haptic.light();
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      haptic.medium();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sessionId', `operator-intake-${Date.now()}`);
      formData.append('moduleType', 'operator_intake');

      const { data, error } = await supabase.functions.invoke('voice-transcribe', {
        body: formData
      });

      if (error) throw error;

      if (data?.transcript) {
        onValueChange(data.transcript);
        haptic.double();
      }
      setIsTranscribing(false);
    } catch (err) {
      console.error('Error transcribing:', err);
      setError('Failed to transcribe. Try typing instead.');
      setIsTranscribing(false);
      haptic.light();
    }
  };

  const handleClear = () => {
    onValueChange('');
    haptic.light();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* Voice Button - Primary Input */}
      {!showTextInput && (
        <div className="space-y-2">
          <Button
            type="button"
            variant={isRecording ? 'default' : 'cta'}
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`w-full min-h-[56px] rounded-xl ${
              isRecording 
                ? 'animate-pulse bg-red-500 hover:bg-red-600' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Transcribing...
              </>
            ) : isRecording ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Recording ({elapsedTime}s)
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                {placeholder}
              </>
            )}
          </Button>

          {showTextFallback && (
            <button
              type="button"
              onClick={() => {
                setShowTextInput(true);
                haptic.light();
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center"
            >
              Or type instead
            </button>
          )}
        </div>
      )}

      {/* Text Input Fallback */}
      {showTextInput && (
        <div className="space-y-2">
          <div className="relative">
            <Input
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={placeholder}
              className="pr-20 min-h-[44px]"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTextInput(false);
                  haptic.light();
                }}
                className="h-8 w-8 p-0"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {value && !isRecording && !isTranscribing && (
        <div className="relative p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground flex-1">{value}</p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(true);
                  setShowTextInput(true);
                  haptic.light();
                }}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

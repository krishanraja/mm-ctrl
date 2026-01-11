import { useState, useRef, useCallback } from 'react';
import { AudioRecorder } from '@/utils/audioRecorder';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const recorderRef = useRef<AudioRecorder | null>(null);

  const startListening = useCallback(async () => {
    try {
      setIsListening(true);
      setTranscript('');
      recorderRef.current = new AudioRecorder();
      
      await recorderRef.current.start(async (audioBlob) => {
        setIsListening(false);
        setIsProcessing(true);
        await transcribeAudio(audioBlob);
      });
    } catch (err) {
      console.error('Error starting recording:', err);
      setIsListening(false);
      throw err;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sessionId', `voice-command-${Date.now()}`);
      formData.append('moduleType', 'command');

      const { data, error } = await supabase.functions.invoke('voice-transcribe', {
        body: formData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.transcript) {
        setTranscript(data.transcript);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isListening,
    isProcessing,
    transcript,
    startListening,
    stopListening,
  };
};

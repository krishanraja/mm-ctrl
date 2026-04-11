import { useState, useRef, useCallback } from 'react';
import { AudioRecorder } from '@/utils/audioRecorder';
import { api } from '@/lib/api';

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
      const result = await api.transcribeAudio(audioBlob, `voice-command-${Date.now()}`, 'command');
      if (result?.transcript) {
        setTranscript(result.transcript);
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

/**
 * Mindmaker Control - Executive Voice Capture
 * 
 * Voice is not a feature. Voice is the interface.
 * 
 * Rules:
 * - One tap to start
 * - One tap to stop
 * - No visible waveform clutter
 * - Subtle animated state only
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Loader2, RotateCcw, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { classifyVoiceIntent, VoiceIntent } from '@/utils/classifyVoiceIntent';
import { composeExecutiveResponse, StructuredResponse } from '@/utils/decisionResponseComposer';
import { HandOffCard } from '@/components/HandOffCard';
import { transitions, variants, premiumVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { FaviconMark } from '@/components/ui/FaviconMark';

interface ExecutiveVoiceCaptureProps {
  onClose: () => void;
  tensionContext?: string;
}

type CaptureState = 'idle' | 'recording' | 'transcribing' | 'processing' | 'response' | 'error';
type InputMode = 'voice' | 'text';

export const ExecutiveVoiceCapture: React.FC<ExecutiveVoiceCaptureProps> = ({
  onClose,
  tensionContext,
}) => {
  const [state, setState] = useState<CaptureState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [intent, setIntent] = useState<VoiceIntent | null>(null);
  const [response, setResponse] = useState<StructuredResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHandOff, setShowHandOff] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [textInput, setTextInput] = useState('');

  const {
    startRecording: startCapture,
    stopRecording: stopCapture,
    error: captureError,
    clearError: clearCaptureError,
  } = useAudioCapture();

  // Mounted guard to prevent state updates on unmounted component
  const isMountedRef = useRef(true);
  // Store last audio blob for retry
  const lastAudioBlobRef = useRef<Blob | null>(null);

  const MAX_RETRIES = 2;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync capture errors to component error state
  useEffect(() => {
    if (captureError) {
      setError(captureError);
      setState('error');
    }
  }, [captureError]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      clearCaptureError();

      await startCapture(async (audioBlob) => {
        setState('transcribing');
        await processAudio(audioBlob);
      });

      setState('recording');
    } catch {
      // Error state is set by the hook via captureError effect
      setState('error');
    }
  }, [startCapture, clearCaptureError]);

  const stopRecording = useCallback(() => {
    stopCapture();
  }, [stopCapture]);

  const processAudio = async (audioBlob: Blob, isRetry = false) => {
    // Store blob for potential retry
    lastAudioBlobRef.current = audioBlob;
    
    try {
      // Step 1: Transcribe
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sessionId', `exec-capture-${Date.now()}`);
      formData.append('moduleType', 'executive_capture');

      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke('voice-transcribe', {
        body: formData,
      });

      if (transcribeError) throw transcribeError;
      if (transcribeData?.error) throw new Error(transcribeData.error);

      // Guard after async operation
      if (!isMountedRef.current) return;

      const transcriptText = transcribeData?.transcript || '';
      setTranscript(transcriptText);

      if (!transcriptText.trim()) {
        setError('No speech detected. Tap to try again.');
        setState('error');
        return;
      }

      // Step 2: Classify intent
      const classifiedIntent = classifyVoiceIntent(transcriptText);
      if (!isMountedRef.current) return;
      setIntent(classifiedIntent);

      // Step 3: Generate response
      setState('processing');
      const structuredResponse = await composeExecutiveResponse(transcriptText, tensionContext);
      
      // Guard after async operation
      if (!isMountedRef.current) return;
      setResponse(structuredResponse);
      setState('response');
      
      // Reset retry count on success
      setRetryCount(0);

    } catch (err) {
      console.error('Error processing audio:', err);
      if (!isMountedRef.current) return;
      
      // Auto-retry logic
      if (retryCount < MAX_RETRIES && !isRetry) {
        console.log(`Retrying... attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setRetryCount(prev => prev + 1);
        // Short delay before retry
        setTimeout(() => {
          if (isMountedRef.current && lastAudioBlobRef.current) {
            processAudio(lastAudioBlobRef.current, true);
          }
        }, 1000);
        return;
      }
      
      // Max retries reached or retry failed
      setError('Failed to process. Tap mic to try again.');
      setState('error');
    }
  };
  
  // Manual retry handler
  const handleRetry = useCallback(() => {
    if (lastAudioBlobRef.current) {
      setRetryCount(0);
      setState('transcribing');
      processAudio(lastAudioBlobRef.current, false);
    } else {
      // No audio to retry, start fresh
      handleReset();
    }
  }, []);

  const handleMicPress = useCallback(() => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle' || state === 'error') {
      startRecording();
    }
  }, [state, startRecording, stopRecording]);

  const handleReset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setIntent(null);
    setResponse(null);
    setError(null);
    setShowHandOff(false);
    setTextInput('');
  }, []);

  const processTextInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    try {
      setTranscript(text);
      setState('processing');
      
      const classifiedIntent = classifyVoiceIntent(text);
      if (!isMountedRef.current) return;
      setIntent(classifiedIntent);
      
      const structuredResponse = await composeExecutiveResponse(text, tensionContext);
      
      if (!isMountedRef.current) return;
      setResponse(structuredResponse);
      setState('response');
      setTextInput('');
    } catch (err) {
      console.error('Error processing text:', err);
      if (!isMountedRef.current) return;
      setError('Failed to process. Please try again.');
      setState('error');
    }
  }, [tensionContext]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      processTextInput(textInput.trim());
    }
  }, [textInput, processTextInput]);

  const renderContent = () => {
    // Response state - show the 3-part response
    if (state === 'response' && response) {
      return (
        <motion.div
          key="response"
          className="w-full max-w-md space-y-6"
          variants={variants.responseCard}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitions.default}
        >
          {/* What this is */}
          <ResponseSection
            label="What this actually is"
            content={response.what_this_is}
            isExpanded={true}
          />

          {/* What you might be missing */}
          <ResponseSection
            label="What you might be missing"
            content={response.what_you_might_be_missing}
          />

          {/* What to decide next */}
          <ResponseSection
            label="What to decide or delegate next"
            content={response.what_to_decide_next}
          />

          {/* Actions - Premium buttons */}
          <div className="flex gap-3 pt-4">
            <motion.button
              onClick={() => setShowHandOff(true)}
              className="flex-1 py-3 px-4 rounded-xl btn-primary-glow font-medium"
              variants={premiumVariants.cardGlow}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              transition={transitions.fast}
            >
              Hand this off cleanly
            </motion.button>
            <motion.button
              onClick={handleReset}
              className="py-3 px-4 rounded-xl btn-premium font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={transitions.fast}
            >
              New
            </motion.button>
          </div>
        </motion.div>
      );
    }

    // Text input mode
    if (inputMode === 'text' && state !== 'processing') {
      return (
        <motion.div
          key="text-capture"
          className="flex flex-col items-center justify-center w-full max-w-md"
          variants={variants.insightFadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitions.default}
        >
          <motion.p 
            className="text-muted-foreground text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            What's the decision or situation?
          </motion.p>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Describe the decision or situation you're facing..."
            rows={4}
            autoFocus
            className={cn(
              'w-full px-4 py-3 rounded-xl',
              'bg-secondary/30 border border-border',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              'resize-none text-sm',
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) handleTextSubmit();
            }}
          />

          <div className="flex gap-3 mt-4 w-full">
            <motion.button
              onClick={() => setInputMode('voice')}
              className="flex-1 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Mic className="w-4 h-4" />
              Use voice
            </motion.button>
            <motion.button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl btn-primary-glow font-medium flex items-center justify-center gap-2",
                !textInput.trim() && "opacity-50"
              )}
              whileHover={textInput.trim() ? { scale: 1.02 } : undefined}
              whileTap={textInput.trim() ? { scale: 0.98 } : undefined}
            >
              <Send className="w-4 h-4" />
              Submit
            </motion.button>
          </div>
        </motion.div>
      );
    }

    // Recording/Processing states - show mic orb
    return (
      <motion.div
        key="capture"
        className="flex flex-col items-center justify-center"
        variants={variants.insightFadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transitions.default}
      >
        {/* Status text */}
        <motion.p 
          className="text-muted-foreground text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {state === 'idle' && "What's the decision or situation?"}
          {state === 'recording' && "Listening..."}
          {state === 'transcribing' && "Processing speech..."}
          {state === 'processing' && "Analyzing..."}
          {state === 'error' && (error || "Something went wrong")}
        </motion.p>

        {/* Mic Orb - Premium with animated border */}
        <motion.button
          onClick={handleMicPress}
          disabled={state === 'transcribing' || state === 'processing'}
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center",
            "transition-all duration-300",
            state === 'recording' 
              ? "bg-primary mic-orb-recording" 
              : state === 'error'
              ? "bg-destructive/20"
              : "bg-secondary hover:bg-secondary/80 mic-orb-pulse"
          )}
          variants={premiumVariants.micOrbPulse}
          initial="idle"
          animate={state === 'recording' ? 'recording' : 'idle'}
          whileHover={state === 'idle' ? 'hover' : undefined}
          transition={transitions.mic}
        >
          {state === 'transcribing' || state === 'processing' ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : state === 'recording' ? (
            <MicOff className="w-12 h-12 text-primary-foreground" />
          ) : (
            <Mic className="w-12 h-12 text-foreground" />
          )}
        </motion.button>

        {/* Tap hint or retry button */}
        {state === 'error' && lastAudioBlobRef.current ? (
          <motion.button
            onClick={handleRetry}
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={transitions.fast}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry processing</span>
          </motion.button>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {state === 'recording' ? "Tap to stop" : "Tap to speak"}
            </motion.p>
            {state === 'idle' && (
              <motion.button
                onClick={() => setInputMode('text')}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <MessageSquare className="w-3 h-3" />
                Type instead
              </motion.button>
            )}
          </div>
        )}

        {/* Transcript preview (if available) */}
        {transcript && state !== 'response' && (
          <motion.div
            className="mt-8 p-4 rounded-xl bg-secondary/30 max-w-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.default}
          >
            <p className="text-sm text-muted-foreground">{transcript}</p>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      className="w-full min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transitions.default}
    >
      {/* Favicon mark in top-left */}
      <FaviconMark />
      
      {/* Close button */}
      <motion.button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={transitions.fast}
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      <AnimatePresence mode="wait">
        {showHandOff && response ? (
          <HandOffCard
            key="handoff"
            response={response}
            transcript={transcript}
            onClose={() => setShowHandOff(false)}
          />
        ) : (
          renderContent()
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Helper component for response sections
interface ResponseSectionProps {
  label: string;
  content: string;
  isExpanded?: boolean;
}

const ResponseSection: React.FC<ResponseSectionProps> = ({ label, content, isExpanded = false }) => {
  const [expanded, setExpanded] = useState(isExpanded);

  return (
    <motion.div
      className="card-premium rounded-xl overflow-hidden border-glow"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.default}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={transitions.fast}
          className="text-muted-foreground"
        >
          ▼
        </motion.span>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitions.default}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-foreground">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExecutiveVoiceCapture;

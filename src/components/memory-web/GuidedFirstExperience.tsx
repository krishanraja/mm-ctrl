import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuidedCapture } from '@/hooks/useGuidedCapture';
import { useVoice } from '@/hooks/useVoice';
import { useUserMemory } from '@/hooks/useUserMemory';
import { useMemoryExport } from '@/hooks/useMemoryExport';
import { FactVerificationCard } from '@/components/memory/FactVerificationCard';

interface Props {
  onComplete: () => void;
}

export function GuidedFirstExperience({ onComplete }: Props) {
  const { step, currentPrompt, extractedFactCount, advance, completeOnboarding } = useGuidedCapture();
  const {
    pendingVerifications,
    isExtracting,
    extractFromTranscript,
    verifyFact,
    rejectFact,
    clearPendingVerifications,
  } = useUserMemory();
  const { exportResult, generateExport } = useMemoryExport();
  const [copied, setCopied] = useState(false);

  const handleTranscript = useCallback(
    async (text: string) => {
      advance(); // -> processing
      const result = await extractFromTranscript(text);
      const count = result?.pending_verifications?.length || 0;
      advance(count); // -> verification
    },
    [advance, extractFromTranscript],
  );

  const { isRecording, isProcessing: isTranscribing, duration, startRecording, stopRecording, resetRecording } =
    useVoice({
      maxDuration: 120,
      onTranscript: handleTranscript,
    });

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording, resetRecording]);

  const handleVerificationComplete = useCallback(async () => {
    // After first round verification, generate export for value moment
    if (step === 'verification') {
      await generateExport('claude', 'general');
    }
    advance();
  }, [step, advance, generateExport]);

  const handleCopy = async () => {
    if (exportResult?.content) {
      await navigator.clipboard.writeText(exportResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {/* Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 max-w-sm"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
              <Sparkles className="h-12 w-12 text-accent mx-auto" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-semibold text-foreground"
            >
              This is your thinking space.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-muted-foreground"
            >
              Speak freely. I'll remember what matters and build a portable context that makes any AI instantly useful.
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              onClick={() => advance()}
              className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-medium flex items-center gap-2 mx-auto"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}

        {/* Prompt */}
        {(step === 'first_prompt' || step === 'second_prompt') && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-8 max-w-sm"
          >
            <p className="text-lg text-foreground/80 leading-relaxed">{currentPrompt}</p>
            <motion.button
              onClick={() => {
                advance(); // -> recording
                handleVoiceToggle();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'w-24 h-24 rounded-full mx-auto',
                'bg-gradient-to-br from-accent to-accent/70',
                'flex items-center justify-center',
                'shadow-lg shadow-accent/20',
              )}
            >
              <Mic className="w-10 h-10 text-white" />
            </motion.button>
            <p className="text-xs text-muted-foreground/50">Tap to speak</p>
          </motion.div>
        )}

        {/* Recording */}
        {step === 'recording' && isRecording && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <motion.button
              onClick={handleVoiceToggle}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className={cn(
                'w-24 h-24 rounded-full mx-auto',
                'bg-gradient-to-br from-red-500 to-pink-600',
                'flex items-center justify-center',
                'shadow-lg shadow-red-500/25',
              )}
            >
              <MicOff className="w-10 h-10 text-white" />
            </motion.button>
            <div className="text-2xl font-bold tabular-nums">{formatTime(duration)}</div>
            <div className="flex items-center justify-center gap-0.5 h-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, Math.random() * 24 + 4, 4] }}
                  transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.4, delay: i * 0.03 }}
                  className="w-0.5 bg-red-400 rounded-full"
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground/50">Tap to stop</p>
          </motion.div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 p-[2px] mx-auto"
            >
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>
            <p className="text-foreground font-medium">Learning about you...</p>
            <p className="text-sm text-muted-foreground">This only takes a moment</p>
          </motion.div>
        )}

        {/* Verification — use existing FactVerificationCard */}
        {step === 'verification' && pendingVerifications.length > 0 && (
          <FactVerificationCard
            facts={pendingVerifications}
            onVerify={verifyFact}
            onReject={rejectFact}
            onDismiss={() => {
              clearPendingVerifications();
              handleVerificationComplete();
            }}
            onComplete={handleVerificationComplete}
          />
        )}

        {/* Verification — no pending facts, auto-advance */}
        {step === 'verification' && pendingVerifications.length === 0 && (
          <motion.div
            key="no-verify"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onAnimationComplete={handleVerificationComplete}
            className="text-center"
          >
            <p className="text-muted-foreground">Processing...</p>
          </motion.div>
        )}

        {/* Value Moment */}
        {step === 'value_moment' && (
          <motion.div
            key="value"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-5 max-w-sm w-full"
          >
            <Sparkles className="h-8 w-8 text-accent mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">
              I now know {extractedFactCount} things about you.
            </h2>
            <p className="text-sm text-muted-foreground">
              Copy this into ChatGPT or Claude. Notice how much better the responses are.
            </p>
            {exportResult?.content && (
              <pre className="text-left text-xs text-foreground/70 bg-foreground/5 rounded-xl p-4 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                {exportResult.content}
              </pre>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className={cn(
                  'flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2',
                  copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-accent text-accent-foreground',
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Context'}
              </button>
              <button
                onClick={() => advance()}
                className="flex-1 py-3 rounded-xl font-medium bg-foreground/5 text-foreground"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-sm"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <Check className="h-12 w-12 text-emerald-400 mx-auto" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground">You're all set.</h2>
            <p className="text-muted-foreground">
              Come back anytime to add more. The more you share, the smarter your AI context becomes.
            </p>
            <button
              onClick={() => {
                completeOnboarding();
                onComplete();
              }}
              className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-medium"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Copy,
  Check,
  ArrowRight,
  Brain,
  Zap,
  MessageSquare,
  Download,
  User,
  Briefcase,
  Target,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import mindmakerIcon from '@/assets/mindmaker-icon.png';
import { useGuidedCapture, type CaptureArea } from '@/hooks/useGuidedCapture';
import { useVoice } from '@/hooks/useVoice';
import { useUserMemory } from '@/hooks/useUserMemory';
import { useMemoryExport } from '@/hooks/useMemoryExport';
import { FactVerificationCard } from '@/components/memory/FactVerificationCard';

interface Props {
  onComplete: () => void;
}

const AREA_ICONS: Record<CaptureArea, typeof User> = {
  identity: User,
  work: Briefcase,
  goals: Target,
};

const AREA_COLORS: Record<CaptureArea, string> = {
  identity: 'bg-primary',
  work: 'bg-accent',
  goals: 'bg-graphite',
};

/**
 * Auto-advances after a short delay when there are no facts to verify.
 * Uses useEffect instead of onAnimationComplete which can fail to fire.
 */
function VerificationAutoAdvance({ onComplete }: { onComplete: () => void }) {
  const called = useRef(false);
  useEffect(() => {
    if (called.current) return;
    const timer = setTimeout(() => {
      if (!called.current) {
        called.current = true;
        onComplete();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="no-verify"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <p className="text-muted-foreground">Processing...</p>
    </motion.div>
  );
}

export function GuidedFirstExperience({ onComplete }: Props) {
  const {
    step,
    currentArea,
    currentPromptData,
    extractedFactCount,
    completedAreas,
    totalAreas,
    areaIndex,
    advance,
    completeOnboarding,
  } = useGuidedCapture();
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
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');

  // Safety timeout: if stuck on 'processing' for >30s (e.g. edge function
  // hangs or network failure), auto-advance to verification so the user isn't
  // stranded on a spinner forever.
  const processingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (step === 'processing') {
      processingTimerRef.current = setTimeout(() => {
        advance();
      }, 30_000);
    }
    return () => clearTimeout(processingTimerRef.current);
  }, [step, advance]);

  const handleTranscript = useCallback(
    async (text: string) => {
      advance();
      const result = await extractFromTranscript(text);
      const count = result?.pending_verifications?.length || 0;
      advance(count);
    },
    [advance, extractFromTranscript],
  );

  const {
    isRecording,
    isProcessing: isTranscribing,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoice({ maxDuration: 120, onTranscript: handleTranscript });

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording, resetRecording]);

  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim()) return;
    advance();
    const result = await extractFromTranscript(textInput.trim());
    const count = result?.pending_verifications?.length || 0;
    advance(count);
    setTextInput('');
    setInputMode('voice');
  }, [textInput, advance, extractFromTranscript]);

  const handleSwitchToText = useCallback(() => {
    setInputMode('text');
    advance();
  }, [advance]);

  const handleVerificationComplete = useCallback(async () => {
    if (completedAreas.length + 1 >= totalAreas) {
      await generateExport('claude', 'general');
    }
    advance();
  }, [completedAreas, totalAreas, advance, generateExport]);

  const handleCopy = async () => {
    if (exportResult?.content) {
      await navigator.clipboard.writeText(exportResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const AreaIcon = AREA_ICONS[currentArea];

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {step !== 'welcome' && step !== 'prompt_intro' && step !== 'complete' && (
        <div className="flex-shrink-0 px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: totalAreas }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: '0%' }}
                  animate={{
                    width:
                      i < completedAreas.length
                        ? '100%'
                        : i === areaIndex && (step === 'verification' || step === 'processing' || step === 'recording')
                          ? '50%'
                          : '0%',
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Area {Math.min(areaIndex + 1, totalAreas)} of {totalAreas}
          </p>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {/* WELCOME */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto shadow-lg shadow-accent/25">
                  <img src={mindmakerIcon} alt="Mindmaker" className="h-8 w-8 object-contain" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Let's build your AI double
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  In about 3 minutes, you'll have a portable digital clone that makes
                  every AI conversation dramatically better.
                </p>
              </motion.div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={() => advance()}
                className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center gap-2 mx-auto shadow-lg shadow-accent/25"
              >
                Let's Go
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}

          {/* INTRO — explain the 3 things we build */}
          {step === 'prompt_intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md space-y-6"
            >
              <h2 className="text-xl font-bold text-foreground text-center">
                Here's what we'll build together
              </h2>
              <div className="space-y-3">
                {[
                  { icon: Brain, title: 'Memory Web', desc: 'Facts about you, your work, your style', color: 'bg-primary' },
                  { icon: Zap, title: '10X Skills Map', desc: 'Strengths to amplify, gaps to close', color: 'bg-accent' },
                  { icon: MessageSquare, title: 'Master Prompts', desc: 'Custom prompts for ChatGPT, Claude, any AI', color: 'bg-graphite' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.15 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      item.color,
                    )}>
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center space-y-3 pt-2"
              >
                <p className="text-xs text-muted-foreground">
                  I'll ask you 3 questions. Talk naturally for 1-2 minutes each.
                </p>
                <button
                  onClick={() => advance()}
                  className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center gap-2 mx-auto"
                >
                  Start First Question
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* PROMPT — show the question with context */}
          {(step === 'prompt_identity' || step === 'prompt_work' || step === 'prompt_goals') && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 max-w-md"
            >
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mx-auto shadow-lg',
                AREA_COLORS[currentArea],
              )}>
                <AreaIcon className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {currentPromptData.title}
                </span>
                <p className="text-lg font-medium text-foreground leading-relaxed">
                  {currentPromptData.prompt}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-left">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  {currentPromptData.hint}
                </p>
              </div>
              <motion.button
                onClick={() => {
                  advance();
                  handleVoiceToggle();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'w-20 h-20 rounded-full mx-auto',
                  AREA_COLORS[currentArea],
                  'flex items-center justify-center',
                  'shadow-lg',
                )}
              >
                <Mic className="w-9 h-9 text-white" />
              </motion.button>
              <div className="flex items-center justify-center gap-3">
                <p className="text-xs text-muted-foreground/50">Tap to speak (1-2 minutes)</p>
                <span className="text-muted-foreground/20">|</span>
                <button
                  onClick={handleSwitchToText}
                  className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Type instead
                </button>
              </div>
            </motion.div>
          )}

          {/* RECORDING - Voice Mode */}
          {step === 'recording' && isRecording && inputMode === 'voice' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                {currentPromptData.title}
              </span>
              <motion.button
                onClick={handleVoiceToggle}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={cn(
                  'w-24 h-24 rounded-full mx-auto',
                  'bg-destructive',
                  'flex items-center justify-center',
                  'shadow-lg shadow-destructive/25',
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
                    transition={{
                      repeat: Infinity,
                      duration: 0.4 + Math.random() * 0.4,
                      delay: i * 0.03,
                    }}
                    className="w-0.5 bg-destructive rounded-full"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground/50">Tap the button when you're done</p>
            </motion.div>
          )}

          {/* RECORDING - Text Mode */}
          {step === 'recording' && inputMode === 'text' && !isTranscribing && (
            <motion.div
              key="text-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md space-y-4"
            >
              <div className="text-center space-y-2">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mx-auto',
                  AREA_COLORS[currentArea],
                )}>
                  <AreaIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent block">
                  {currentPromptData.title}
                </span>
                <p className="text-sm text-muted-foreground">
                  {currentPromptData.prompt}
                </p>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={currentPromptData.hint}
                autoFocus
                rows={5}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-foreground/5 border border-foreground/10',
                  'text-foreground placeholder:text-foreground/30',
                  'focus:outline-none focus:ring-2 focus:ring-accent/30',
                  'resize-none text-sm',
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handleTextSubmit();
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInputMode('voice');
                    setTextInput('');
                    resetRecording();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-foreground/5 text-muted-foreground text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5',
                    'bg-accent text-accent-foreground',
                    !textInput.trim() && 'opacity-50',
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit
                </button>
              </div>
              <button
                onClick={() => {
                  setInputMode('voice');
                  handleVoiceToggle();
                }}
                className="w-full text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center justify-center gap-1"
              >
                <Mic className="w-3 h-3" />
                Switch to voice
              </button>
            </motion.div>
          )}

          {/* TRANSCRIBING - recording stopped, waiting for transcription */}
          {step === 'recording' && !isRecording && inputMode === 'voice' && (
            <motion.div
              key="transcribing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-accent to-accent/30 p-[2px] mx-auto"
              >
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <img src={mindmakerIcon} alt="Mindmaker" className="w-8 h-8 object-contain" />
                </div>
              </motion.div>
              <p className="text-foreground font-medium">Transcribing your response...</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds</p>
            </motion.div>
          )}

          {/* PROCESSING */}
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
                className="w-20 h-20 rounded-full bg-gradient-to-r from-accent to-accent/30 p-[2px] mx-auto"
              >
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <img src={mindmakerIcon} alt="Mindmaker" className="w-8 h-8 object-contain" />
                </div>
              </motion.div>
              <p className="text-foreground font-medium">Extracting facts & patterns...</p>
              <p className="text-sm text-muted-foreground">Building your Memory Web</p>
            </motion.div>
          )}

          {/* VERIFICATION */}
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
          {step === 'verification' && pendingVerifications.length === 0 && (
            <VerificationAutoAdvance onComplete={handleVerificationComplete} />
          )}

          {/* VALUE MOMENT — show what was built + first export */}
          {step === 'value_moment' && (
            <motion.div
              key="value"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-5 max-w-md w-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto shadow-lg">
                <Download className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Your AI double knows {extractedFactCount} things about you
              </h2>
              <p className="text-sm text-muted-foreground">
                Copy this into ChatGPT or Claude right now. Notice how much better the responses are.
              </p>
              {exportResult?.content && (
                <pre className="text-left text-xs text-foreground/70 bg-foreground/5 rounded-xl p-4 max-h-48 overflow-auto whitespace-pre-wrap font-mono border border-border">
                  {exportResult.content}
                </pre>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2',
                    copied
                      ? 'bg-accent/20 text-accent'
                      : 'bg-accent text-accent-foreground shadow-lg shadow-accent/25',
                  )}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
              <button
                onClick={() => advance()}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Go to my dashboard
              </button>
            </motion.div>
          )}

          {/* COMPLETE */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 max-w-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <Check className="h-12 w-12 text-accent mx-auto" />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">Your digital clone is live</h2>
              <p className="text-muted-foreground">
                Come back anytime to narrate more. The more you share, the more powerful your AI context becomes.
              </p>
              <button
                onClick={() => {
                  completeOnboarding();
                  onComplete();
                }}
                className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-semibold shadow-lg shadow-accent/25"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

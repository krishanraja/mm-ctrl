import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  MessageSquare,
  Sparkles,
  Brain,
  Zap,
  Download,
  ChevronRight,
  User,
  Briefcase,
  Target,
  AlertTriangle,
  Settings,
  TrendingUp,
  Shield,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useVoice } from '@/hooks/useVoice';
import { useUserMemory } from '@/hooks/useUserMemory';
import { FactVerificationCard } from '@/components/memory/FactVerificationCard';
import { BottomNav } from './BottomNav';
import { SwipeableCards } from '@/components/mobile/SwipeableCards';
import { useToast } from '@/hooks/use-toast';
import type { FactCategory, PatternType } from '@/types/memory';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const CATEGORY_CONFIG: Record<FactCategory, { icon: typeof User; label: string; gradient: string }> = {
  identity: { icon: User, label: 'Identity', gradient: 'from-violet-500 to-purple-600' },
  business: { icon: Briefcase, label: 'Business', gradient: 'from-blue-500 to-indigo-600' },
  objective: { icon: Target, label: 'Goals', gradient: 'from-emerald-500 to-teal-600' },
  blocker: { icon: AlertTriangle, label: 'Challenges', gradient: 'from-red-500 to-orange-600' },
  preference: { icon: Settings, label: 'Preferences', gradient: 'from-amber-500 to-yellow-600' },
};

const PATTERN_CONFIG: Record<PatternType, { icon: typeof TrendingUp; label: string; color: string }> = {
  strength: { icon: TrendingUp, label: 'Strength', color: 'text-emerald-400 bg-emerald-500/10' },
  preference: { icon: Settings, label: 'Preference', color: 'text-blue-400 bg-blue-500/10' },
  behavior: { icon: Eye, label: 'Behavior', color: 'text-purple-400 bg-purple-500/10' },
  blindspot: { icon: Shield, label: 'Blind Spot', color: 'text-amber-400 bg-amber-500/10' },
  anti_preference: { icon: AlertTriangle, label: 'Avoids', color: 'text-red-400 bg-red-500/10' },
};

export function MobileMemoryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { facts, patterns, stats, delta, isLoading, refresh } = useMemoryWeb();
  const {
    pendingVerifications,
    isExtracting,
    extractFromTranscript,
    verifyFact,
    rejectFact,
    clearPendingVerifications,
  } = useUserMemory();
  const { toast } = useToast();

  const [mode, setMode] = useState<'idle' | 'voice' | 'text'>('idle');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTranscript = useCallback(
    async (text: string) => {
      setIsProcessing(true);
      try {
        const result = await extractFromTranscript(text);
        if (result?.success === false) {
          toast({
            title: 'Processing failed',
            description: result.error || 'Could not extract insights. Please try again.',
            variant: 'destructive',
          });
        } else if (result?.pending_verifications?.length > 0) {
          setShowVerification(true);
        }
        await refresh();
      } catch (err) {
        console.error('Error processing:', err);
        toast({
          title: 'Processing failed',
          description: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
        setMode('idle');
      }
    },
    [extractFromTranscript, refresh, toast],
  );

  const {
    isRecording,
    isProcessing: isTranscribing,
    duration,
    error: voiceError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoice({ maxDuration: 120, onTranscript: handleTranscript });

  const activeProcessing = isProcessing || isExtracting || isTranscribing;

  // Show toast on voice error
  useEffect(() => {
    if (voiceError) {
      toast({
        title: 'Transcription failed',
        description: voiceError.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
      setMode('idle');
    }
  }, [voiceError, toast]);

  // Safety timeout: warn if processing takes > 35s
  useEffect(() => {
    if (activeProcessing) {
      processingTimerRef.current = setTimeout(() => {
        toast({
          title: 'Processing is taking longer than expected',
          description: 'You can cancel and try again.',
          variant: 'destructive',
        });
      }, 35_000);
    } else if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    return () => {
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    };
  }, [activeProcessing, toast]);

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      startRecording();
      setMode('voice');
    }
  }, [isRecording, startRecording, stopRecording, resetRecording]);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await handleTranscript(textInput.trim());
    setTextInput('');
  };

  const handleCancelProcessing = useCallback(() => {
    resetRecording();
    setIsProcessing(false);
    setMode('idle');
    toast({ title: 'Cancelled', description: 'You can try recording again.' });
  }, [resetRecording, toast]);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const categoryDistribution = stats?.category_distribution || {};
  const hasData = facts.length > 0;
  const isVoiceExpanded = isRecording || activeProcessing || mode === 'text';

  return (
    <>
      <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
        {/* Header - compact single line */}
        <header className="flex-shrink-0 px-5 pt-4 pb-1">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-baseline gap-2"
          >
            <h1 className="text-lg font-bold text-foreground">{getGreeting()},</h1>
            <span className="text-lg font-bold text-accent capitalize">{firstName}</span>
          </motion.div>
        </header>

        {/* Health Score - compact inline bar */}
        {hasData && stats && (
          <div className="flex-shrink-0 px-5 py-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <Brain className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.health_score}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums flex-shrink-0">
                {stats.health_score}%
              </span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {stats.total_facts}f &middot; {stats.patterns_count}p
              </span>
              {delta && delta.new_facts > 0 && (
                <span className="text-[10px] text-accent font-medium flex-shrink-0">
                  +{delta.new_facts}
                </span>
              )}
            </motion.div>
          </div>
        )}

        {/* Voice Input Area */}
        <div className={cn('flex-shrink-0 px-5 overflow-hidden', isVoiceExpanded && 'flex-1')}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn('flex flex-col', isVoiceExpanded && 'h-full justify-center')}
          >
            <AnimatePresence mode="wait">
              {mode === 'idle' && !activeProcessing && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 py-3"
                >
                  <p className="text-xs text-foreground/60">
                    {hasData ? 'Voice another thought' : 'Start your Memory Web'}
                  </p>
                  <motion.button
                    onClick={handleVoiceToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'w-14 h-14 rounded-full',
                      'bg-gradient-to-br from-accent to-accent/70',
                      'flex items-center justify-center',
                      'shadow-lg shadow-accent/20',
                    )}
                  >
                    <Mic className="w-6 h-6 text-white" />
                  </motion.button>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-muted-foreground/50">Tap to narrate</p>
                    <span className="text-muted-foreground/20">|</span>
                    <button
                      onClick={() => setMode('text')}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      <MessageSquare className="w-2.5 h-2.5" />
                      Type instead
                    </button>
                  </div>
                </motion.div>
              )}

              {mode === 'voice' && isRecording && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-6"
                >
                  <motion.button
                    onClick={handleVoiceToggle}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/25"
                  >
                    <MicOff className="w-8 h-8 text-white" />
                  </motion.button>
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {formatTime(duration)}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 h-6">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [3, Math.random() * 22 + 3, 3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.4 + Math.random() * 0.4,
                          delay: i * 0.03,
                        }}
                        className="w-0.5 bg-red-400 rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/50">Tap to stop</p>
                </motion.div>
              )}

              {mode === 'text' && !activeProcessing && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-3 py-4"
                >
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Tell me about your role, current projects, goals, or challenges..."
                    autoFocus
                    rows={4}
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
                      onClick={() => { setMode('idle'); setTextInput(''); }}
                      className="flex-1 py-2.5 rounded-xl bg-foreground/5 text-muted-foreground text-sm font-medium"
                    >
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
                </motion.div>
              )}

              {activeProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-4 py-8"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 p-[2px]"
                  >
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-foreground font-medium">
                    {isTranscribing ? 'Processing speech...' : 'Extracting facts & patterns...'}
                  </p>
                  <button
                    onClick={handleCancelProcessing}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Swipeable Content Panel — hidden when voice is expanded */}
        {!isVoiceExpanded && (
          <>
            {hasData && !isLoading && (
              <div className="flex-1 min-h-0 overflow-hidden px-3">
                <SwipeableCards className="h-full" cardClassName="px-2">
                  {/* Panel 1: Memory Web */}
                  <div className="h-full flex flex-col px-2 pt-1">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Brain className="h-3 w-3 text-accent" />
                      Memory Web
                    </h3>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      {(Object.entries(CATEGORY_CONFIG) as [FactCategory, typeof CATEGORY_CONFIG[FactCategory]][])
                        .slice(0, 4)
                        .map(([category, config]) => {
                          const count = categoryDistribution[category] || 0;
                          const Icon = config.icon;
                          return (
                            <motion.div
                              key={category}
                              whileTap={{ scale: 0.97 }}
                              className="rounded-xl border border-border bg-card p-3 flex flex-col items-center justify-center gap-2"
                            >
                              <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center', config.gradient)}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">{config.label}</p>
                                <p className="text-lg font-bold text-foreground">{count}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Panel 2: Skills & Patterns */}
                  <div className="h-full flex flex-col px-2 pt-1 overflow-hidden">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-amber-400" />
                      Skills & Patterns
                    </h3>
                    <div className="flex-1 min-h-0 space-y-1.5 overflow-hidden">
                      {patterns.slice(0, 4).map((p) => {
                        const config = PATTERN_CONFIG[p.pattern_type] || PATTERN_CONFIG.behavior;
                        return (
                          <div key={p.id} className="rounded-xl border border-border bg-card p-2.5">
                            <div className="flex items-start gap-2">
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5', config.color)}>
                                {config.label}
                              </span>
                              <p className="text-xs text-foreground leading-snug line-clamp-2">{p.pattern_text}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 pl-0.5">
                              <span className="text-[9px] text-muted-foreground">{Math.round(p.confidence * 100)}%</span>
                              <span className="text-[9px] text-muted-foreground">{p.evidence_count} evidence</span>
                            </div>
                          </div>
                        );
                      })}
                      {patterns.length === 0 && (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-xs text-muted-foreground/50">No patterns detected yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel 3: Recent Facts */}
                  <div className="h-full flex flex-col px-2 pt-1 overflow-hidden">
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Recent Facts
                    </h3>
                    <div className="flex-1 min-h-0 space-y-1 overflow-hidden">
                      {facts.slice(0, 5).map((f) => (
                        <div key={f.id} className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-card border border-border">
                          <span className="text-[9px] font-semibold text-accent uppercase mt-0.5 flex-shrink-0 w-12">
                            {f.fact_category.slice(0, 4)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground/80 truncate">{f.fact_label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{f.fact_value}</p>
                          </div>
                          {f.verification_status === 'verified' && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                              ✓
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel 4: Quick Actions */}
                  <div className="h-full flex flex-col justify-center gap-3 px-2">
                    <button
                      onClick={() => navigate('/context')}
                      className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-lg shadow-accent/20"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export to Any AI
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate('/memory')}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-foreground/5 text-foreground font-medium text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        View Full Memory Web
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </SwipeableCards>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasData && !activeProcessing && mode === 'idle' && (
              <div className="flex-1 min-h-0 flex items-center justify-center px-5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center space-y-3"
                >
                  <Brain className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Your Memory Web is empty. Voice your first thought to begin.
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Try: &quot;I&apos;m a [role] at [company]. My biggest challenge is...&quot;
                  </p>
                </motion.div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 px-5">
                <div className="h-16 bg-foreground/5 rounded-xl animate-pulse" />
                <div className="h-16 bg-foreground/5 rounded-xl animate-pulse" />
                <div className="h-16 bg-foreground/5 rounded-xl animate-pulse" />
              </div>
            )}
          </>
        )}

        <BottomNav />
      </div>

      <AnimatePresence>
        {showVerification && pendingVerifications.length > 0 && (
          <FactVerificationCard
            facts={pendingVerifications}
            onVerify={verifyFact}
            onReject={rejectFact}
            onDismiss={() => { setShowVerification(false); clearPendingVerifications(); }}
            onComplete={() => { setShowVerification(false); refresh(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

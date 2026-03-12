import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useVoice } from '@/hooks/useVoice';
import { useUserMemory } from '@/hooks/useUserMemory';
import { FactVerificationCard } from '@/components/memory/FactVerificationCard';
import { BottomNav } from './BottomNav';
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

  const [mode, setMode] = useState<'idle' | 'voice' | 'text'>('idle');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleTranscript = useCallback(
    async (text: string) => {
      setIsProcessing(true);
      try {
        const result = await extractFromTranscript(text);
        if (result?.pending_verifications?.length > 0) setShowVerification(true);
        await refresh();
      } catch (err) {
        console.error('Error processing:', err);
      } finally {
        setIsProcessing(false);
        setMode('idle');
      }
    },
    [extractFromTranscript, refresh],
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
      setMode('voice');
    }
  }, [isRecording, startRecording, stopRecording, resetRecording]);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await handleTranscript(textInput.trim());
    setTextInput('');
  };

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const activeProcessing = isProcessing || isExtracting || isTranscribing;
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const categoryDistribution = stats?.category_distribution || {};
  const hasData = facts.length > 0;

  return (
    <>
      <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 px-5 pt-5 pb-2">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-xl font-bold capitalize">{firstName}</h1>
          </motion.div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-5 pb-32 scrollbar-hide">
          <div className="space-y-5 py-3">
            {/* Clone Health Score */}
            {hasData && stats && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-accent/10 via-purple-500/5 to-transparent border border-accent/20 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Your AI Double
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{stats.health_score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.health_score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {stats.total_facts} facts &middot; {stats.patterns_count} patterns
                  </span>
                  {delta && delta.new_facts > 0 && (
                    <span className="text-xs text-accent font-medium">
                      +{delta.new_facts} new {delta.period}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Voice Input Area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <AnimatePresence mode="wait">
                {mode === 'idle' && !activeProcessing && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-4"
                  >
                    <p className="text-sm text-foreground/70">
                      {hasData ? 'Add more to your digital clone' : 'Start building your AI double'}
                    </p>
                    <motion.button
                      onClick={handleVoiceToggle}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'w-16 h-16 rounded-full',
                        'bg-gradient-to-br from-accent to-accent/70',
                        'flex items-center justify-center',
                        'shadow-lg shadow-accent/20',
                      )}
                    >
                      <Mic className="w-7 h-7 text-white" />
                    </motion.button>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground/50">Tap to narrate</p>
                      <span className="text-muted-foreground/20">|</span>
                      <button
                        onClick={() => setMode('text')}
                        className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
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
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    <motion.button
                      onClick={handleVoiceToggle}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/25"
                    >
                      <MicOff className="w-7 h-7 text-white" />
                    </motion.button>
                    <div className="text-lg font-bold tabular-nums text-foreground">
                      {formatTime(duration)}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 h-5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [3, Math.random() * 18 + 3, 3] }}
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
                    className="space-y-3"
                  >
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Tell me about your role, current projects, goals, or challenges..."
                      autoFocus
                      rows={3}
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
                          setMode('idle');
                          setTextInput('');
                        }}
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
                    className="flex flex-col items-center gap-3 py-6"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 p-[2px]"
                    >
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                      </div>
                    </motion.div>
                    <p className="text-sm text-foreground font-medium">
                      {isTranscribing ? 'Processing speech...' : 'Extracting facts & patterns...'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Memory Web Categories */}
            {hasData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Memory Web
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(categoryDistribution) as [FactCategory, number][])
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count]) => {
                      const config = CATEGORY_CONFIG[category];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={category}
                          whileTap={{ scale: 0.97 }}
                          className="rounded-xl border border-border bg-card p-3 flex items-center gap-3"
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                              config.gradient,
                            )}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{config.label}</p>
                            <p className="text-sm font-bold text-foreground">{count}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </motion.div>
            )}

            {/* Skills & Patterns */}
            {patterns.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Skills & Patterns
                  </h3>
                </div>
                <div className="space-y-2">
                  {patterns.slice(0, 5).map((p) => {
                    const config = PATTERN_CONFIG[p.pattern_type] || PATTERN_CONFIG.behavior;
                    const Icon = config.icon;
                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-border bg-card p-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5',
                              config.color,
                            )}
                          >
                            {config.label}
                          </span>
                          <p className="text-sm text-foreground leading-snug">{p.pattern_text}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 pl-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round(p.confidence * 100)}% confidence
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.evidence_count} evidence
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Recent Facts */}
            {hasData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Recent Facts
                </h3>
                <div className="space-y-1.5">
                  {facts.slice(0, 6).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-card border border-border"
                    >
                      <span className="text-[10px] font-semibold text-accent uppercase mt-0.5 flex-shrink-0 w-14">
                        {f.fact_category.slice(0, 4)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground/80 truncate">
                          {f.fact_label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{f.fact_value}</p>
                      </div>
                      {f.verification_status === 'verified' && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            {hasData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <button
                  onClick={() => navigate('/context')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-lg shadow-accent/20"
                >
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export to Any AI
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/memory')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-foreground/5 text-foreground font-medium text-sm"
                >
                  <span>View Full Memory Web</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </motion.div>
            )}

            {/* Empty State */}
            {!isLoading && !hasData && !activeProcessing && mode === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-6 space-y-3"
              >
                <Brain className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Your Memory Web is empty. Start narrating to build your AI double.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Try: "I'm a [role] at [company]. My biggest challenge is..."
                </p>
              </motion.div>
            )}

            {isLoading && (
              <div className="space-y-4 pt-4">
                <div className="h-24 bg-foreground/5 rounded-xl animate-pulse" />
                <div className="h-32 bg-foreground/5 rounded-xl animate-pulse" />
                <div className="h-20 bg-foreground/5 rounded-xl animate-pulse" />
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      <AnimatePresence>
        {showVerification && pendingVerifications.length > 0 && (
          <FactVerificationCard
            facts={pendingVerifications}
            onVerify={verifyFact}
            onReject={rejectFact}
            onDismiss={() => {
              setShowVerification(false);
              clearPendingVerifications();
            }}
            onComplete={() => {
              setShowVerification(false);
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

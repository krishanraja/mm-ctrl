import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useVoice } from '@/hooks/useVoice';
import { useUserMemory } from '@/hooks/useUserMemory';
import { FactVerificationCard } from '@/components/memory/FactVerificationCard';
import { GettingSmarterBanner } from './GettingSmarterBanner';
import { MemoryPulseBar } from './MemoryPulseBar';
import { RecentFactsFeed } from './RecentFactsFeed';
import { PatternInsightCard } from './PatternInsightCard';
import { BottomNav } from './BottomNav';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
        if (result?.pending_verifications?.length > 0) {
          setShowVerification(true);
        }
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
      setMode('voice');
    }
  }, [isRecording, startRecording, stopRecording, resetRecording]);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await handleTranscript(textInput.trim());
    setTextInput('');
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    refresh();
  };

  const firstName = user?.email?.split('@')[0] || '';
  const activeProcessing = isProcessing || isExtracting || isTranscribing;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <>
      <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 px-4 pt-4 pb-1">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-xl font-semibold capitalize">{firstName}</h1>
          </motion.div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide">
          <div className="space-y-5 py-3">
            {/* Getting Smarter Banner */}
            <GettingSmarterBanner delta={delta} />

            {/* Voice Capture Area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <AnimatePresence mode="wait">
                {/* Idle state */}
                {mode === 'idle' && !activeProcessing && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    <p className="text-base text-foreground/70">What's on your mind?</p>
                    <motion.button
                      onClick={handleVoiceToggle}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'w-20 h-20 rounded-full',
                        'bg-gradient-to-br from-accent to-accent/70',
                        'flex items-center justify-center',
                        'shadow-lg shadow-accent/20',
                      )}
                    >
                      <Mic className="w-8 h-8 text-white" />
                    </motion.button>
                    <p className="text-xs text-muted-foreground/50">Tap to speak</p>
                    <button
                      onClick={() => setMode('text')}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      or type
                    </button>
                  </motion.div>
                )}

                {/* Recording state */}
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
                      className={cn(
                        'w-20 h-20 rounded-full',
                        'bg-gradient-to-br from-red-500 to-pink-600',
                        'flex items-center justify-center',
                        'shadow-lg shadow-red-500/25',
                      )}
                    >
                      <MicOff className="w-8 h-8 text-white" />
                    </motion.button>
                    <div className="text-xl font-bold tabular-nums text-foreground">
                      {formatTime(duration)}
                      <span className="text-xs text-foreground/30 ml-2">/ 2:00</span>
                    </div>
                    <div className="flex items-center justify-center gap-0.5 h-6">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                          transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.4, delay: i * 0.03 }}
                          className="w-0.5 bg-red-400 rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground/50">Tap to stop</p>
                  </motion.div>
                )}

                {/* Text input mode */}
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
                      placeholder="Tell me what's on your mind..."
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
                          'flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5',
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

                {/* Processing state */}
                {activeProcessing && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center gap-4 py-6"
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
                      {isTranscribing ? 'Processing speech...' : 'Learning about you...'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Memory Pulse */}
            {!isLoading && <MemoryPulseBar stats={stats} />}

            {/* Recent Facts */}
            {!isLoading && facts.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Latest from your mind
                </h3>
                <RecentFactsFeed facts={facts} maxItems={5} />
              </motion.div>
            )}

            {/* Patterns */}
            {!isLoading && patterns.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Emerging patterns
                </h3>
                <div className="space-y-2">
                  {patterns.slice(0, 3).map((p) => (
                    <PatternInsightCard key={p.id} pattern={p} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            {!isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 pt-2"
              >
                <button
                  onClick={() => navigate('/context')}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-sm font-medium',
                    'bg-accent text-accent-foreground',
                  )}
                >
                  Brief My AI
                </button>
                <button
                  onClick={() => navigate('/memory')}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-sm font-medium',
                    'bg-foreground/5 text-foreground',
                  )}
                >
                  View All
                </button>
              </motion.div>
            )}

            {/* Loading skeletons */}
            {isLoading && (
              <div className="space-y-4 pt-4">
                <div className="h-12 bg-foreground/5 rounded-xl skeleton-shimmer" />
                <div className="h-32 bg-foreground/5 rounded-xl skeleton-shimmer" />
                <div className="h-24 bg-foreground/5 rounded-xl skeleton-shimmer" />
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Fact Verification Overlay */}
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
            onComplete={handleVerificationComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

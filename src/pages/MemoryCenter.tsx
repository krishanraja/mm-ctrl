import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  Shield,
  Download,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  X,
  Sparkles,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemoryErrorBoundary } from '@/components/memory/MemoryErrorBoundary';
import { MemoryList } from '@/components/memory/MemoryList';
import { MemoryDetailSheet } from '@/components/memory/MemoryDetailSheet';
import { AddMemorySheet } from '@/components/memory/AddMemorySheet';
import { PrivacyControlsPanel } from '@/components/memory/PrivacyControlsPanel';
import { ExportImportPanel } from '@/components/memory/ExportImportPanel';
import { FactVerificationCard } from '@/components/memory/FactVerificationCard';
import { MemoryWebVisualization } from '@/components/memory-web/MemoryWebVisualization';
import { useDevice } from '@/hooks/useDevice';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useVoice } from '@/hooks/useVoice';
import { useUserMemory } from '@/hooks/useUserMemory';
import { useToast } from '@/hooks/use-toast';
import { DesktopSidebar } from '@/components/memory-web/DesktopSidebar';
import { BottomNav } from '@/components/memory-web/BottomNav';
import type { UserMemoryFact, MemoryWebFact } from '@/types/memory';

export default function MemoryCenter() {
  const { isMobile } = useDevice();
  const { facts, stats, isLoading, refresh } = useMemoryWeb();
  const {
    pendingVerifications,
    isExtracting,
    extractFromTranscript,
    verifyFact,
    rejectFact,
    clearPendingVerifications,
  } = useUserMemory();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('memories');
  const [mobileView, setMobileView] = useState<'web' | 'list'>('web');
  const [selectedMemory, setSelectedMemory] = useState<UserMemoryFact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<'idle' | 'voice' | 'text'>('idle');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleTranscript = useCallback(
    async (text: string) => {
      setIsProcessing(true);
      try {
        const result = await extractFromTranscript(text);
        if (result?.success === false) {
          toast({
            title: 'Processing failed',
            description: result.error || 'Could not extract insights.',
            variant: 'destructive',
          });
        } else if (result?.pending_verifications?.length > 0) {
          setShowVerification(true);
        }
        await refresh();
      } catch (err) {
        toast({
          title: 'Processing failed',
          description: err instanceof Error ? err.message : 'Something went wrong.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
        setCaptureMode('idle');
      }
    },
    [extractFromTranscript, refresh, toast],
  );

  const {
    isRecording,
    isProcessing: isTranscribing,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoice({ maxDuration: 120, onTranscript: handleTranscript });

  const activeProcessing = isProcessing || isExtracting || isTranscribing;

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      startRecording();
      setCaptureMode('voice');
    }
  }, [isRecording, startRecording, stopRecording, resetRecording]);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await handleTranscript(textInput.trim());
    setTextInput('');
  };

  const handleNodeTap = useCallback((fact: MemoryWebFact) => {
    setSelectedMemory(fact as unknown as UserMemoryFact);
    setIsDetailOpen(true);
  }, []);

  const handleEditMemory = (memory: UserMemoryFact) => {
    setSelectedMemory(memory);
    setIsDetailOpen(true);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Desktop keeps the existing tab-based layout
  if (!isMobile) {
    const desktopContent = (
      <MemoryErrorBoundary>
        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 text-sm text-muted-foreground"
            >
              <span>{stats.total_facts} facts</span>
              <span className="text-foreground/10">|</span>
              <span>{stats.verified_rate}% verified</span>
              <span className="text-foreground/10">|</span>
              <span>
                {stats.temperature_distribution?.hot || 0} hot,{' '}
                {stats.temperature_distribution?.warm || 0} warm
              </span>
            </motion.div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <TabsList className="grid grid-cols-3 h-11">
                <TabsTrigger value="memories" className="text-sm">
                  <Brain className="h-4 w-4 mr-1.5 hidden sm:inline" />
                  All Facts
                </TabsTrigger>
                <TabsTrigger value="privacy" className="text-sm">
                  <Shield className="h-4 w-4 mr-1.5 hidden sm:inline" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="data" className="text-sm">
                  <Download className="h-4 w-4 mr-1.5 hidden sm:inline" />
                  Data
                </TabsTrigger>
              </TabsList>

              {activeTab === 'memories' && (
                <Button onClick={() => setIsAddOpen(true)} size="sm" className="border-0">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            <TabsContent
              value="memories"
              className="mt-4 flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0"
            >
              <MemoryList onEditMemory={handleEditMemory} onAddMemory={() => setIsAddOpen(true)} />
            </TabsContent>
            <TabsContent
              value="privacy"
              className="mt-4 flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0"
            >
              <PrivacyControlsPanel />
            </TabsContent>
            <TabsContent
              value="data"
              className="mt-4 flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0"
            >
              <ExportImportPanel />
            </TabsContent>
          </Tabs>
        </div>

        <MemoryDetailSheet
          memory={selectedMemory}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedMemory(null);
          }}
        />
        <AddMemorySheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      </MemoryErrorBoundary>
    );

    return (
      <div className="min-h-screen bg-background">
        <DesktopSidebar />
        <main className="ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <Brain className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-semibold">Memory Browser</h1>
              </div>
              <p className="text-muted-foreground">
                View, verify, edit, and manage everything your AI knows about you.
              </p>
            </motion.div>
            {desktopContent}
          </div>
        </main>
      </div>
    );
  }

  // ── Mobile: visual web-first experience ──────────────────────────────────

  return (
    <>
      <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 px-4 pt-4 pb-1">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 8px rgba(139,92,246,0.2)',
                      '0 0 16px rgba(16,185,129,0.3)',
                      '0 0 8px rgba(139,92,246,0.2)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center"
                >
                  <Brain className="h-4 w-4 text-accent" />
                </motion.div>
                <h1 className="text-lg font-semibold">Memory Web</h1>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-foreground/5 rounded-lg p-0.5">
                <button
                  onClick={() => setMobileView('web')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    mobileView === 'web'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground',
                  )}
                >
                  Web
                </button>
                <button
                  onClick={() => setMobileView('list')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    mobileView === 'list'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground',
                  )}
                >
                  <List className="h-3 w-3 inline mr-1" />
                  List
                </button>
              </div>
            </div>

            {/* Stats ribbon */}
            {stats && facts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/70"
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  {stats.total_facts} memories
                </span>
                <span>{stats.verified_rate}% verified</span>
                <span>
                  {stats.temperature_distribution?.hot || 0} hot
                </span>
                <motion.span
                  className="text-accent font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {stats.health_score}% health
                </motion.span>
              </motion.div>
            )}
          </motion.div>
        </header>

        {/* Main content */}
        <AnimatePresence mode="wait">
          {mobileView === 'web' ? (
            <motion.div
              key="web"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              {/* Memory Web Visualization */}
              <div className="flex-1 min-h-0 relative">
                <MemoryWebVisualization
                  facts={facts}
                  onNodeTap={handleNodeTap}
                  showEmptyState={!isLoading && facts.length === 0}
                />

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-10 h-10 rounded-full border-2 border-accent/20 border-t-accent"
                    />
                  </div>
                )}
              </div>

              {/* Voice capture overlay — anchored at bottom */}
              <div className="flex-shrink-0 px-4 pb-2">
                <AnimatePresence mode="wait">
                  {captureMode === 'idle' && !activeProcessing && (
                    <motion.div
                      key="capture-idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center justify-center gap-4 py-2"
                    >
                      <motion.button
                        onClick={handleVoiceToggle}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/25"
                      >
                        <Mic className="w-5 h-5 text-white" />
                      </motion.button>
                      <button
                        onClick={() => setCaptureMode('text')}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Type
                      </button>
                    </motion.div>
                  )}

                  {captureMode === 'voice' && isRecording && (
                    <motion.div
                      key="capture-recording"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center gap-3 py-3"
                    >
                      <div className="flex items-center gap-4">
                        <motion.button
                          onClick={handleVoiceToggle}
                          animate={{ scale: [1, 1.06, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                          className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/30"
                        >
                          <MicOff className="w-6 h-6 text-white" />
                        </motion.button>
                        <div className="text-xl font-bold tabular-nums text-foreground">
                          {formatTime(duration)}
                        </div>
                      </div>
                      {/* Mini waveform */}
                      <div className="flex items-center justify-center gap-0.5 h-4">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [2, Math.random() * 14 + 2, 2] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.35 + Math.random() * 0.3,
                              delay: i * 0.025,
                            }}
                            className="w-0.5 bg-red-400/80 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {captureMode === 'text' && !activeProcessing && (
                    <motion.div
                      key="capture-text"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="py-2"
                    >
                      <div className="flex gap-2">
                        <input
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Add a memory..."
                          autoFocus
                          className={cn(
                            'flex-1 px-3 py-2.5 rounded-xl',
                            'bg-foreground/5 border border-foreground/10',
                            'text-foreground placeholder:text-foreground/30',
                            'focus:outline-none focus:ring-2 focus:ring-accent/30',
                            'text-sm',
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTextSubmit();
                            if (e.key === 'Escape') {
                              setCaptureMode('idle');
                              setTextInput('');
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            setCaptureMode('idle');
                            setTextInput('');
                          }}
                          className="px-2 text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleTextSubmit}
                          disabled={!textInput.trim()}
                          className={cn(
                            'px-3 py-2.5 rounded-xl bg-accent text-accent-foreground',
                            !textInput.trim() && 'opacity-40',
                          )}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeProcessing && (
                    <motion.div
                      key="capture-processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-3 py-3"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 p-[1.5px]"
                      >
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                      </motion.div>
                      <p className="text-xs text-foreground/70">
                        {isTranscribing ? 'Transcribing...' : 'Weaving into memory...'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-h-0 overflow-hidden"
            >
              <MemoryErrorBoundary>
                <MemoryList
                  onEditMemory={handleEditMemory}
                  onAddMemory={() => setIsAddOpen(true)}
                />
              </MemoryErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>

      {/* Detail sheet */}
      <MemoryDetailSheet
        memory={selectedMemory}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedMemory(null);
        }}
      />

      {/* Add sheet */}
      <AddMemorySheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Verification overlay */}
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

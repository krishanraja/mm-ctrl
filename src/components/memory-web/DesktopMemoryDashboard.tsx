import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Send,
  Edit3,
  Trash2,
  CheckCircle2,
  Sparkles,
  Brain,
  Zap,
  Download,
  Upload,
  Target,
  User,
  Briefcase,
  AlertTriangle,
  Settings,
  TrendingUp,
  Shield,
  Eye,
  ChevronDown,
  Copy,
  Check,
  Loader2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useToast } from '@/hooks/use-toast';
import { useVoice } from '@/hooks/useVoice';
import { useMemoryExport } from '@/hooks/useMemoryExport';
import { useMarkdownImport } from '@/hooks/useMarkdownImport';
import { DesktopSidebar } from './DesktopSidebar';
import { MemoryWebVisualization } from './MemoryWebVisualization';
import { BriefingCard } from '@/components/dashboard/BriefingCard';
import { BriefingSheet } from '@/components/briefing/BriefingSheet';
import { useTodaysBriefing, useGenerateBriefing } from '@/hooks/useBriefing';
import { useBriefingContext } from '@/contexts/BriefingContext';
import type {
  MemoryWebFact,
  Temperature,
  FactCategory,
  PatternType,
} from '@/types/memory';

const TEMP_PILL_STYLES: Record<Temperature, string> = {
  hot: 'bg-red-500/10 text-red-400',
  warm: 'bg-amber-500/10 text-amber-400',
  cold: 'bg-slate-500/10 text-slate-400',
};

const CATEGORY_CONFIG: Record<FactCategory, { icon: typeof User; label: string; gradient: string; bg: string }> = {
  identity: { icon: User, label: 'Identity', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10 text-violet-400' },
  business: { icon: Briefcase, label: 'Business', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10 text-blue-400' },
  objective: { icon: Target, label: 'Goals', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10 text-emerald-400' },
  blocker: { icon: AlertTriangle, label: 'Challenges', gradient: 'from-red-500 to-orange-600', bg: 'bg-red-500/10 text-red-400' },
  preference: { icon: Settings, label: 'Preferences', gradient: 'from-amber-500 to-yellow-600', bg: 'bg-amber-500/10 text-amber-400' },
};

const PATTERN_CONFIG: Record<PatternType, { label: string; color: string }> = {
  strength: { label: 'Strength', color: 'bg-emerald-500/10 text-emerald-400' },
  preference: { label: 'Preference', color: 'bg-blue-500/10 text-blue-400' },
  behavior: { label: 'Behavior', color: 'bg-purple-500/10 text-purple-400' },
  blindspot: { label: 'Blind Spot', color: 'bg-amber-500/10 text-amber-400' },
  anti_preference: { label: 'Avoids', color: 'bg-red-500/10 text-red-400' },
};

function FactCard({
  fact,
  onEdit,
  onDelete,
  onVerify,
}: {
  fact: MemoryWebFact;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onVerify?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[fact.fact_category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card hover:border-accent/30 transition-colors group cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {fact.fact_label}
          </h4>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {fact.verification_status !== 'verified' && (
              <button
                onClick={(e) => { e.stopPropagation(); onVerify?.(fact.id); }}
                className="p-1 rounded hover:bg-secondary text-emerald-500"
                title="Verify"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(fact.id); }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground"
              title="Edit"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(fact.id); }}
              className="p-1 rounded hover:bg-secondary text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{fact.fact_value}</p>
        <div className="flex items-center flex-wrap gap-1.5 mt-3">
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', config?.bg)}>
            {fact.fact_category}
          </span>
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', TEMP_PILL_STYLES[fact.temperature])}>
            {fact.temperature}
          </span>
          {fact.verification_status === 'verified' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
              verified
            </span>
          )}
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-border space-y-1.5">
                {fact.fact_context && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Context:</span> {fact.fact_context}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Confidence:</span> {Math.round(fact.confidence_score * 100)}%
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function DesktopMemoryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    facts,
    patterns,
    decisions,
    stats,
    budget,
    delta,
    isLoading,
    editFact,
    deleteFact,
    verifyFact,
    submitInput,
  } = useMemoryWeb();
  const { exportResult, isExporting, generateExport, copyToClipboard } = useMemoryExport();
  const { briefing: todaysBriefing, loading: briefingLoading, refetch: refetchBriefing } = useTodaysBriefing();
  const { setBriefing, setSheetOpen, playback } = useBriefingContext();
  const { generate, generating, phase } = useGenerateBriefing();

  // Sync briefing into context
  useEffect(() => {
    if (todaysBriefing) setBriefing(todaysBriefing);
  }, [todaysBriefing, setBriefing]);

  const handlePlayBriefing = () => {
    if (todaysBriefing) {
      setBriefing(todaysBriefing);
      setSheetOpen(true);
    }
  };

  const handleGenerateBriefing = async () => {
    const briefingId = await generate();
    if (briefingId) {
      // Refetch to get the briefing data, then show the card
      await refetchBriefing();
    }
  };

  const { isRecording, startRecording, stopRecording } = useVoice({
    onTranscript: (transcript) => setInputText(transcript),
  });

  const { triggerImport, handleFiles, isImporting, fileInputProps } = useMarkdownImport();

  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickExportCopied, setQuickExportCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only leave if we're exiting the container (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';
  const hasData = facts.length > 0;

  const handleSubmit = async () => {
    if (!inputText.trim() || isSubmitting) return;
    const text = inputText.trim();
    setInputText('');
    setIsSubmitting(true);
    try {
      const result = await submitInput(text);
      if (result?.success) {
        toast({ title: 'Processed', description: result.error || 'Your input has been added to your Memory Web.' });
      } else {
        toast({ title: 'Processing failed', description: result?.error || 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Something went wrong', description: 'Could not process your input. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickExport = async () => {
    await generateExport('claude', 'general');
    const ok = await copyToClipboard();
    if (ok) {
      setQuickExportCopied(true);
      setTimeout(() => setQuickExportCopied(false), 2000);
    }
  };

  const strengthPatterns = patterns.filter((p) => p.pattern_type === 'strength');
  const blindspotPatterns = patterns.filter((p) => p.pattern_type === 'blindspot');
  const otherPatterns = patterns.filter((p) => p.pattern_type !== 'strength' && p.pattern_type !== 'blindspot');

  return (
    <div
      className="min-h-screen bg-background relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input {...fileInputProps} />

      {/* Drag-and-drop overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onDragOver={handleDragOver}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-4 p-12 rounded-3xl border-2 border-dashed border-accent/50 bg-accent/5"
            >
              <Upload className="h-12 w-12 text-accent" />
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">Drop your file to import</p>
                <p className="text-sm text-muted-foreground mt-1">Supports .md and .txt files</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Importing overlay */}
      <AnimatePresence>
        {isImporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-4 p-12"
            >
              <Loader2 className="h-10 w-10 text-accent animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">Extracting memories...</p>
                <p className="text-sm text-muted-foreground mt-1">AI is reading your document</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DesktopSidebar />

      <main className="ml-64 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-foreground"
              >
                {greeting}{firstName ? `, ${firstName}` : ''}
              </motion.h1>
              {delta && delta.new_facts > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-muted-foreground mt-1"
                >
                  <span className="text-accent font-medium">+{delta.new_facts} facts</span>
                  {delta.new_patterns > 0 && <>, <span className="text-accent font-medium">+{delta.new_patterns} patterns</span></>}
                  {' '}{delta.period}
                </motion.p>
              )}
            </div>

            {/* Quick Export Button */}
            {hasData && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleQuickExport}
                disabled={isExporting}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  quickExportCopied
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20',
                )}
              >
                {quickExportCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {quickExportCopied ? 'Copied!' : isExporting ? 'Generating...' : 'Quick Export'}
              </motion.button>
            )}
          </div>

          {/* Input Bar - Voice, Text, Import */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'flex-shrink-0 p-2 rounded-lg transition-colors',
                isRecording
                  ? 'bg-red-500/10 text-red-400 animate-pulse'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
              )}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={triggerImport}
              disabled={isImporting}
              className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-secondary text-muted-foreground hover:text-foreground"
              title="Import markdown or text file"
            >
              <Upload className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-border flex-shrink-0" />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasData
                ? 'Type a thought, or drop a markdown file anywhere...'
                : 'Tell me about your role, company, and goals - or drop a .md file...'}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isSubmitting}
              className={cn(
                'flex-shrink-0 p-2 rounded-lg transition-colors',
                isSubmitting ? 'text-accent animate-pulse cursor-wait' :
                inputText.trim() ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground/40 cursor-not-allowed',
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          {/* Briefing Card */}
          {todaysBriefing && !briefingLoading && (
            <BriefingCard
              briefing={todaysBriefing}
              hasListened={playback.hasListened}
              onPlay={handlePlayBriefing}
            />
          )}
          {!todaysBriefing && !briefingLoading && hasData && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-accent/20 bg-accent/5 p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Your Daily Briefing</p>
                  <p className="text-xs text-muted-foreground">
                    {generating
                      ? phase === 'scanning' ? 'Scanning today\'s news...'
                        : phase === 'personalising' ? 'Finding what matters to you...'
                        : 'Preparing your briefing...'
                      : 'Personalised AI news, in your voice'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateBriefing}
                disabled={generating}
                className="relative w-[160px] py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors overflow-hidden text-center"
              >
                {generating && (
                  <motion.div
                    className="absolute inset-0 bg-accent-foreground/15 rounded-xl"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 15, ease: "linear" }}
                    style={{ transformOrigin: "left" }}
                  />
                )}
                <span className="relative z-10">
                  {generating
                    ? phase === 'scanning' ? 'Scanning...'
                      : phase === 'personalising' ? 'Curating...'
                      : 'Preparing...'
                    : 'Generate Briefing'}
                </span>
              </button>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && hasData && (
            <>
              {/* Main Dashboard Grid: Viz + Stats side by side */}
              <div className="grid grid-cols-4 gap-5">
                {/* Memory Web Visualization - takes 3/4 */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="col-span-3 rounded-2xl border border-border bg-card overflow-hidden"
                >
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Memory Web
                    </h3>
                    <span className="text-[10px] text-muted-foreground/50">Click a node to explore</span>
                  </div>
                  <div className="h-[calc(100vh-320px)] min-h-[420px] max-h-[700px] relative">
                    <MemoryWebVisualization facts={facts} />
                  </div>
                </motion.div>

                {/* Stats Column - takes 1/3 */}
                <div className="space-y-4">
                  {/* Clone Health */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-gradient-to-br from-accent/10 via-purple-500/5 to-transparent border border-accent/20 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-accent" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                          Health
                        </span>
                      </div>
                      <span className="text-3xl font-bold text-foreground">{stats?.health_score || 0}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats?.health_score || 0}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                      <span>{stats?.total_facts || 0} facts</span>
                      <span>{stats?.verified_count || 0} verified</span>
                      <span>{stats?.patterns_count || 0} patterns</span>
                      <span>{stats?.decisions_count || 0} decisions</span>
                    </div>
                  </motion.div>

                  {/* Category breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Coverage
                    </h3>
                    <div className="space-y-2.5">
                      {(Object.entries(stats?.category_distribution || {}) as [FactCategory, number][])
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, count]) => {
                          const config = CATEGORY_CONFIG[cat];
                          if (!config) return null;
                          const max = Math.max(...Object.values(stats?.category_distribution || { x: 1 }));
                          const pct = max > 0 ? (count / max) * 100 : 0;
                          return (
                            <div key={cat} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-20">{config.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className={cn('h-full rounded-full bg-gradient-to-r', config.gradient)}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8 }}
                                />
                              </div>
                              <span className="text-xs font-bold text-foreground w-6 text-right">{count}</span>
                            </div>
                          );
                        })}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Skills & Patterns Section */}
              {patterns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Skills & Patterns
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Strengths Column */}
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" /> Strengths to 10X
                      </h4>
                      <div className="space-y-2">
                        {strengthPatterns.length > 0 ? strengthPatterns.slice(0, 4).map((p) => (
                          <div key={p.id} className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                            <p className="text-xs text-foreground leading-relaxed">{p.pattern_text}</p>
                            <span className="text-[10px] text-emerald-400 mt-1 block">
                              {Math.round(p.confidence * 100)}% confidence
                            </span>
                          </div>
                        )) : (
                          <p className="text-xs text-muted-foreground/50 py-4 text-center">
                            Share more about your successes to discover strengths
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Blind Spots Column */}
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                        <Shield className="h-3 w-3" /> Blind Spots
                      </h4>
                      <div className="space-y-2">
                        {blindspotPatterns.length > 0 ? blindspotPatterns.slice(0, 4).map((p) => (
                          <div key={p.id} className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                            <p className="text-xs text-foreground leading-relaxed">{p.pattern_text}</p>
                            <span className="text-[10px] text-amber-400 mt-1 block">
                              {Math.round(p.confidence * 100)}% confidence
                            </span>
                          </div>
                        )) : (
                          <p className="text-xs text-muted-foreground/50 py-4 text-center">
                            Narrate more to uncover blind spots
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Other Patterns Column */}
                    <div>
                      <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1.5">
                        <Eye className="h-3 w-3" /> Behaviors & Preferences
                      </h4>
                      <div className="space-y-2">
                        {otherPatterns.length > 0 ? otherPatterns.slice(0, 4).map((p) => {
                          const config = PATTERN_CONFIG[p.pattern_type] || PATTERN_CONFIG.behavior;
                          return (
                            <div key={p.id} className="rounded-lg border border-purple-500/10 bg-purple-500/5 p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold', config.color)}>
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{p.pattern_text}</p>
                            </div>
                          );
                        }) : (
                          <p className="text-xs text-muted-foreground/50 py-4 text-center">
                            More narration reveals your patterns
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Facts Grid */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Memory Web Facts
                  </h2>
                  <span className="text-xs text-muted-foreground">{facts.length} total</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {facts.slice(0, 18).map((fact) => (
                    <FactCard
                      key={fact.id}
                      fact={fact}
                      onEdit={editFact}
                      onDelete={deleteFact}
                      onVerify={verifyFact}
                    />
                  ))}
                </div>
                {facts.length > 18 && (
                  <button
                    onClick={() => navigate('/memory')}
                    className="w-full mt-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    View all {facts.length} facts →
                  </button>
                )}
              </motion.div>

              {/* Full Export CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-gradient-to-r from-accent/10 via-purple-500/10 to-emerald-500/10 border border-accent/20 p-6 text-center"
              >
                <Download className="h-6 w-6 text-accent mx-auto mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">
                  Export Your Context
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  One click to ChatGPT, Claude, Gemini, Cursor, or any AI tool.
                </p>
                <button
                  onClick={() => navigate('/context')}
                  className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-lg shadow-accent/20 hover:bg-accent/90 transition-colors"
                >
                  Go to Export Center
                </button>
              </motion.div>
            </>
          )}

          {/* Empty State */}
          {!isLoading && !hasData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 space-y-6"
            >
              <Brain className="h-16 w-16 text-muted-foreground/15 mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Your Memory Web is empty</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Start by voicing your thoughts about your role, company, goals, and challenges. Use the input above.
                The more you share, the smarter your AI context gets.
              </p>
              <p className="text-xs text-muted-foreground/50">
                Try: "I'm a VP of Engineering at a Series B startup. My biggest challenge is..."
              </p>

              {/* Import CTA */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <div className="h-px w-8 bg-border" />
                  or jumpstart with existing notes
                  <div className="h-px w-8 bg-border" />
                </div>
                <div>
                  <button
                    onClick={triggerImport}
                    disabled={isImporting}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      'border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10',
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    Import a markdown file
                  </button>
                  <p className="text-xs text-muted-foreground/50 mt-2">
                    Drop a .md or .txt file anywhere on this page
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Briefing Sheet (shared between mobile and desktop) */}
      <BriefingSheet />
    </div>
  );
}

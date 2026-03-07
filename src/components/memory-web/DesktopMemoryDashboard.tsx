/**
 * DesktopMemoryDashboard
 * Full desktop dashboard: sidebar + main content + intelligence panel.
 * Focused on VISIBILITY, CONTROL, and BEAUTIFUL VISUALIZATIONS.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Send,
  Edit3,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useVoice } from '@/hooks/useVoice';
import { DesktopSidebar } from './DesktopSidebar';
import { IntelligencePanel } from './IntelligencePanel';
import { MemoryHealthViz } from './MemoryHealthViz';
import { CategoryChart } from './CategoryChart';
import type {
  MemoryWebFact,
  Temperature,
  FactCategory,
} from '@/types/memory';

const TEMP_PILL_STYLES: Record<Temperature, string> = {
  hot: 'bg-red-500/10 text-red-400',
  warm: 'bg-amber-500/10 text-amber-400',
  cold: 'bg-slate-500/10 text-slate-400',
};

const CATEGORY_BADGE_STYLES: Record<FactCategory, string> = {
  identity: 'bg-violet-500/10 text-violet-400',
  business: 'bg-blue-500/10 text-blue-400',
  objective: 'bg-emerald-500/10 text-emerald-400',
  blocker: 'bg-red-500/10 text-red-400',
  preference: 'bg-amber-500/10 text-amber-400',
};

const SOURCE_BADGE_STYLES: Record<string, string> = {
  voice: 'bg-violet-500/10 text-violet-400',
  form: 'bg-blue-500/10 text-blue-400',
  linkedin: 'bg-sky-500/10 text-sky-400',
  calendar: 'bg-green-500/10 text-green-400',
  enrichment: 'bg-orange-500/10 text-orange-400',
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card hover:border-accent/30 transition-colors group cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {fact.fact_label}
          </h4>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {fact.verification_status !== 'verified' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVerify?.(fact.id);
                }}
                className="p-1 rounded hover:bg-secondary text-emerald-500"
                title="Verify"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(fact.id);
              }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground"
              title="Edit"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(fact.id);
              }}
              className="p-1 rounded hover:bg-secondary text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Value */}
        <p className="text-sm text-foreground leading-relaxed">
          {fact.fact_value}
        </p>

        {/* Badges */}
        <div className="flex items-center flex-wrap gap-1.5 mt-3">
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              CATEGORY_BADGE_STYLES[fact.fact_category] || 'bg-secondary text-muted-foreground'
            )}
          >
            {fact.fact_category}
          </span>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              SOURCE_BADGE_STYLES[fact.source_type] || 'bg-secondary text-muted-foreground'
            )}
          >
            {fact.source_type}
          </span>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              TEMP_PILL_STYLES[fact.temperature]
            )}
          >
            {fact.temperature}
          </span>
          {fact.verification_status === 'verified' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400">
              verified
            </span>
          )}
          {fact.verification_status === 'inferred' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-500/10 text-yellow-400">
              inferred
            </span>
          )}
        </div>

        {/* Expanded detail */}
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
                    <span className="font-medium">Context:</span>{' '}
                    {fact.fact_context}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Confidence:</span>{' '}
                  {Math.round(fact.confidence_score * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(fact.created_at).toLocaleDateString()}
                </p>
                {fact.verified_at && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Verified:</span>{' '}
                    {new Date(fact.verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function DesktopMemoryDashboard() {
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
    confirmPattern,
    dismissPattern,
    supersedeDecision,
    reverseDecision,
    submitInput,
  } = useMemoryWeb();

  const { isRecording, startRecording, stopRecording } = useVoice({
    onTranscript: (transcript) => {
      setInputText(transcript);
    },
  });

  const [inputText, setInputText] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    submitInput(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DesktopSidebar />

      {/* Intelligence Panel (right) */}
      <IntelligencePanel
        patterns={patterns}
        decisions={decisions}
        stats={stats}
        onConfirmPattern={confirmPattern}
        onDismissPattern={dismissPattern}
        onSupersedeDecision={supersedeDecision}
        onReverseDecision={reverseDecision}
      />

      {/* Main Content */}
      <main className="ml-64 mr-80 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Greeting + Getting Smarter banner */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold text-foreground"
            >
              {greeting}
              {firstName ? `, ${firstName}` : ''}
            </motion.h1>

            {delta && (delta.new_facts > 0 || delta.new_patterns > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-3 flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/10 px-4 py-2.5"
              >
                <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">Getting smarter:</span>{' '}
                  {delta.new_facts > 0 &&
                    `${delta.new_facts} new fact${delta.new_facts > 1 ? 's' : ''}`}
                  {delta.new_facts > 0 && delta.new_patterns > 0 && ', '}
                  {delta.new_patterns > 0 &&
                    `${delta.new_patterns} new pattern${delta.new_patterns > 1 ? 's' : ''}`}{' '}
                  this {delta.period}
                </p>
              </motion.div>
            )}
          </div>

          {/* Voice Input Bar */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                'flex-shrink-0 p-2 rounded-lg transition-colors',
                isRecording
                  ? 'bg-red-500/10 text-red-400 animate-pulse'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              )}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Mic className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim()}
              className={cn(
                'flex-shrink-0 p-2 rounded-lg transition-colors',
                inputText.trim()
                  ? 'text-accent hover:bg-accent/10'
                  : 'text-muted-foreground/40 cursor-not-allowed'
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* Memory Health Visualization */}
              <MemoryHealthViz stats={stats} budget={budget} />

              {/* Recent Facts — 2-column grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    Recent Facts
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {facts.length} total
                  </span>
                </div>
                {facts.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No facts captured yet. Use voice or text to tell
                      Mindmaker about yourself.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {facts.slice(0, 12).map((fact) => (
                      <FactCard
                        key={fact.id}
                        fact={fact}
                        onEdit={editFact}
                        onDelete={deleteFact}
                        onVerify={verifyFact}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Category Distribution */}
              <CategoryChart facts={facts} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
  Lock,
  Sparkles,
  PenTool,
  Layers,
  FileText,
  Target,
  Mail,
  Calendar,
  Layout,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEdge } from '@/hooks/useEdge';
import { useEdgeSubscription } from '@/hooks/useEdgeSubscription';
import { EdgePaywall } from './EdgePaywall';
import { DraftSheet } from './DraftSheet';
import { ArtifactPreview } from './ArtifactPreview';
import { FeedbackButtons } from './FeedbackButtons';
import type {
  FeedbackType,
  EdgeStrength,
  EdgeWeakness,
  CapabilityCardDef,
  EdgeCapability,
  ActionType,
} from '@/types/edge';

// ===== Icon resolver from string names used in capability metadata =====

const ICON_MAP: Record<string, typeof FileText> = {
  FileText,
  Target,
  Mail,
  Calendar,
  Layout,
  Layers,
  BookOpen,
  TrendingUp,
};

function resolveIcon(name: string) {
  return ICON_MAP[name] || HelpCircle;
}

// ===== Capability card builder =====

function buildCapabilityCards(
  strengths: EdgeStrength[],
  weaknesses: EdgeWeakness[],
): CapabilityCardDef[] {
  const cards: CapabilityCardDef[] = [];

  strengths.forEach((s) => {
    s.capabilities.forEach((cap) => {
      const meta = {
        systemize: { label: 'Systemize It', description: 'Turn your instinct into a repeatable framework', icon: 'Layers' },
        teach: { label: 'Teach It', description: 'Create a doc to share how you think about this', icon: 'BookOpen' },
        lean_into: { label: 'Lean Into It', description: 'Find missions that leverage this strength', icon: 'TrendingUp' },
      }[cap];
      if (!meta) return;
      cards.push({
        id: `${s.key}-${cap}`,
        title: `${meta.label}: ${s.label}`,
        description: meta.description,
        icon: meta.icon,
        color: 'emerald',
        actionType: 'sharpen',
        capability: cap,
        targetKey: s.key,
        isPaid: cap !== 'lean_into',
      });
    });
  });

  weaknesses.forEach((w) => {
    w.capabilities.forEach((cap) => {
      const meta = {
        board_memo: { label: 'Board Memo', description: 'Draft a polished board memo from your key points', icon: 'FileText' },
        strategy_doc: { label: 'Strategy Doc', description: 'Build a strategy document with your context baked in', icon: 'Target' },
        email: { label: 'Email', description: 'Draft an email in your communication style', icon: 'Mail' },
        meeting_agenda: { label: 'Meeting Agenda', description: 'Prepare a meeting agenda with relevant context', icon: 'Calendar' },
        template: { label: 'Template', description: 'Pre-filled template with your actual facts', icon: 'Layout' },
      }[cap];
      if (!meta) return;
      cards.push({
        id: `${w.key}-${cap}`,
        title: `${meta.label}: ${w.label}`,
        description: meta.description,
        icon: meta.icon,
        color: 'amber',
        actionType: 'cover',
        capability: cap,
        targetKey: w.key,
        isPaid: true,
      });
    });
  });

  return cards;
}

// ===== Sub-components =====

function EdgeOnboarding({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
        <Zap className="h-8 w-8 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Discover Your Edge</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          We will analyze your Memory Web to identify your leadership strengths,
          weaknesses, and intelligence gaps -- then give you tools to amplify them.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onComplete}
        className="px-8 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-lg shadow-accent/20 hover:bg-accent/90 transition-colors"
      >
        Synthesize My Edge Profile
      </motion.button>
      <p className="text-xs text-muted-foreground/60">
        Takes about 15 seconds. Uses your existing Memory Web data.
      </p>
    </motion.div>
  );
}

function EdgeProfileCard({
  strengths,
  weaknesses,
  onFeedback,
}: {
  strengths: EdgeStrength[];
  weaknesses: EdgeWeakness[];
  onFeedback: (type: FeedbackType, key: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      {/* Strengths */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Strengths to Sharpen
          </h3>
        </div>
        <div className="space-y-2">
          {strengths.map((s) => (
            <div
              key={s.key}
              className="group rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  <FeedbackButtons targetKey={s.key} type="strength" onFeedback={onFeedback} />
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {Math.round(s.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.summary}</p>
            </div>
          ))}
          {strengths.length === 0 && (
            <p className="text-xs text-muted-foreground/50 py-2 text-center">
              No strengths identified yet
            </p>
          )}
        </div>
      </div>

      {/* Weaknesses */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Weaknesses to Cover
          </h3>
        </div>
        <div className="space-y-2">
          {weaknesses.map((w) => (
            <div
              key={w.key}
              className="group rounded-lg border border-amber-500/10 bg-amber-500/5 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{w.label}</span>
                <div className="flex items-center gap-2">
                  <FeedbackButtons targetKey={w.key} type="weakness" onFeedback={onFeedback} />
                  <span className="text-[10px] text-amber-400 font-medium">
                    {Math.round(w.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{w.summary}</p>
            </div>
          ))}
          {weaknesses.length === 0 && (
            <p className="text-xs text-muted-foreground/50 py-2 text-center">
              No weaknesses identified yet
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SmartProbeCard({
  prompt,
  impact,
  onAddContext,
}: {
  prompt: string;
  impact: string;
  onAddContext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
          Intelligence Gap
        </h3>
      </div>
      <p className="text-sm text-foreground font-medium mb-1">{prompt}</p>
      <p className="text-xs text-muted-foreground mb-3">{impact}</p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddContext}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
      >
        <ChevronRight className="h-3 w-3" />
        Add Context
      </motion.button>
    </motion.div>
  );
}

function CapabilityCard({
  card,
  hasAccess,
  onSelect,
}: {
  card: CapabilityCardDef;
  hasAccess: boolean;
  onSelect: (card: CapabilityCardDef) => void;
}) {
  const Icon = resolveIcon(card.icon);
  const isLocked = card.isPaid && !hasAccess;

  const badgeColor = card.actionType === 'sharpen'
    ? 'bg-emerald-500/10 text-emerald-400'
    : 'bg-amber-500/10 text-amber-400';

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(card)}
      className={cn(
        'w-full text-left rounded-xl border bg-card p-4 transition-colors group',
        isLocked
          ? 'border-border hover:border-accent/20'
          : 'border-border hover:border-accent/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              card.actionType === 'sharpen'
                ? 'bg-emerald-500/10'
                : 'bg-amber-500/10',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                card.actionType === 'sharpen' ? 'text-emerald-400' : 'text-amber-400',
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-foreground truncate">
                {card.title}
              </span>
              {isLocked && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
          </div>
        </div>
        <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-1', badgeColor)}>
          {card.actionType === 'sharpen' ? 'Sharpen' : 'Cover'}
        </span>
      </div>
    </motion.button>
  );
}

// ===== Main EdgeView Component =====

export default function EdgeView() {
  const {
    profile,
    strengths,
    weaknesses,
    intelligenceGaps,
    topGap,
    hasProfile,
    isLoading,
    isSynthesizing,
    synthesize,
    submitFeedback,
  } = useEdge();

  const { hasAccess } = useEdgeSubscription();
  const navigate = useNavigate();

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallCapability, setPaywallCapability] = useState<string | undefined>();

  // DraftSheet state
  const [draftSheetOpen, setDraftSheetOpen] = useState(false);
  const [activeCapability, setActiveCapability] = useState<EdgeCapability | null>(null);
  const [activeTargetKey, setActiveTargetKey] = useState('');
  const [activeActionType, setActiveActionType] = useState<ActionType>('cover');

  // ArtifactPreview state
  const [artifactPreviewOpen, setArtifactPreviewOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedActionId, setGeneratedActionId] = useState<string | null>(null);

  const capabilityCards = useMemo(
    () => buildCapabilityCards(strengths, weaknesses),
    [strengths, weaknesses],
  );

  const handleCapabilitySelect = useCallback(
    (card: CapabilityCardDef) => {
      if (card.isPaid && !hasAccess) {
        setPaywallCapability(card.title);
        setPaywallOpen(true);
        return;
      }
      setActiveCapability(card.capability);
      setActiveTargetKey(card.targetKey);
      setActiveActionType(card.actionType);
      setDraftSheetOpen(true);
    },
    [hasAccess],
  );

  const handleGenerated = useCallback(
    (result: { actionId: string; content: string; title: string }) => {
      setDraftSheetOpen(false);
      setGeneratedContent(result.content);
      setGeneratedTitle(result.title);
      setGeneratedActionId(result.actionId);
      setArtifactPreviewOpen(true);
    },
    [],
  );

  const handleQuickAction = useCallback(
    (action: 'draft' | 'framework') => {
      if (!hasAccess) {
        setPaywallCapability(action === 'draft' ? 'Drafting' : 'Frameworks');
        setPaywallOpen(true);
        return;
      }
      if (action === 'framework' && strengths.length > 0) {
        // Open DraftSheet with systemize capability for the top strength
        setActiveCapability('systemize');
        setActiveTargetKey(strengths[0].key);
        setActiveActionType('sharpen');
        setDraftSheetOpen(true);
      } else if (action === 'draft' && weaknesses.length > 0) {
        // Open DraftSheet with the first cover capability of top weakness
        const firstCap = weaknesses[0].capabilities[0] || 'email';
        setActiveCapability(firstCap);
        setActiveTargetKey(weaknesses[0].key);
        setActiveActionType('cover');
        setDraftSheetOpen(true);
      }
    },
    [hasAccess, strengths, weaknesses],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Synthesizing state
  if (isSynthesizing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
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
        <p className="text-sm text-foreground font-medium">Synthesizing your Edge profile...</p>
        <p className="text-xs text-muted-foreground">Analyzing strengths, weaknesses, and gaps</p>
      </motion.div>
    );
  }

  // First-time / no profile: show onboarding
  if (!hasProfile) {
    return <EdgeOnboarding onComplete={synthesize} />;
  }

  // Full Edge view
  return (
    <>
      <div className="space-y-6">
        {/* Profile Card: Strengths + Weaknesses */}
        <EdgeProfileCard strengths={strengths} weaknesses={weaknesses} onFeedback={submitFeedback} />

        {/* Smart Probe: Top intelligence gap */}
        {topGap && (
          <SmartProbeCard
            prompt={topGap.prompt}
            impact={topGap.impact}
            onAddContext={() => navigate('/dashboard')}
          />
        )}

        {/* Capability Cards */}
        {capabilityCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Capabilities
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {capabilityCards.map((card) => (
                <CapabilityCard
                  key={card.id}
                  card={card}
                  hasAccess={hasAccess}
                  onSelect={handleCapabilitySelect}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <button
            onClick={() => handleQuickAction('draft')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all',
              'bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90',
            )}
          >
            <PenTool className="h-4 w-4" />
            Draft Something
          </button>
          <button
            onClick={() => handleQuickAction('framework')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all',
              'bg-foreground/5 text-foreground hover:bg-foreground/10',
            )}
          >
            <Layers className="h-4 w-4" />
            Build a Framework
          </button>
        </motion.div>
      </div>

      <EdgePaywall
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        capability={paywallCapability}
      />

      <DraftSheet
        isOpen={draftSheetOpen}
        onClose={() => setDraftSheetOpen(false)}
        capability={activeCapability}
        targetKey={activeTargetKey}
        actionType={activeActionType}
        onGenerated={handleGenerated}
      />

      <ArtifactPreview
        isOpen={artifactPreviewOpen}
        onClose={() => setArtifactPreviewOpen(false)}
        content={generatedContent}
        title={generatedTitle}
        actionId={generatedActionId}
      />
    </>
  );
}

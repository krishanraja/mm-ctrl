import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  PenTool,
  Mail,
  Layers,
  FileText,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEdgeSubscription } from '@/hooks/useEdgeSubscription';
import { renderMarkdown } from '@/lib/renderMarkdown';
import { EDGE_PRO_PRICE_LABEL } from '@/constants/billing';

interface EdgePaywallProps {
  isOpen: boolean;
  onClose: () => void;
  capability?: string;
}

// Sample artifacts shown as blurred previews to demonstrate value
export const SAMPLE_ARTIFACTS: Record<string, string> = {
  board_memo: `## Executive Summary\n\nOur product portfolio delivered **23% revenue growth** this quarter, exceeding the board-approved target by 4 points.\n\n### Key Decisions Required\n\n- Approve $2.4M expansion into enterprise segment\n- Ratify the revised go-to-market timeline for Q4\n- Review updated risk framework for international markets`,
  strategy_doc: `## Strategic Direction: Q4 2026\n\n### Market Position\n\nWe hold **second position** in the mid-market segment with 18% share. The gap to leader has narrowed from 12 to 7 points.\n\n### Priority Initiatives\n\n1. Accelerate enterprise pipeline with dedicated BDR team\n2. Launch self-serve tier to capture SMB demand\n3. Expand partner ecosystem from 12 to 25 integrations`,
  email: `**Subject: Alignment on Q4 Priorities**\n\nHi team,\n\nFollowing our strategy review, I want to share three priorities I'd like us to rally around for Q4.\n\n1. **Customer retention** - we need to move NRR from 108% to 115%\n2. **Pipeline velocity** - cut average deal cycle from 47 to 35 days\n3. **Team capacity** - backfill the two open roles by end of October`,
  meeting_agenda: `## Leadership Team Weekly - Oct 14\n\n### Pre-read\n- Q3 financial close summary (attached)\n- Customer churn analysis draft\n\n### Agenda (60 min)\n\n1. **[10 min]** Q3 close highlights - CFO\n2. **[15 min]** Churn deep-dive and action plan - VP CS\n3. **[15 min]** Q4 hiring plan approval - VP People\n4. **[10 min]** Enterprise deal review - CRO\n5. **[10 min]** Open items and next steps`,
  template: `## Weekly Update Template\n\n**Week of:** [date]\n\n### Wins\n- [highlight 1]\n- [highlight 2]\n\n### Blockers\n- [blocker and proposed resolution]\n\n### Key Metrics\n| Metric | Target | Actual | Status |\n|--------|--------|--------|--------|\n| Pipeline | $X | $Y | On track |`,
  systemize: `## Framework: High-Trust Team Building\n\n### The 4-Layer Model\n\nBased on your demonstrated pattern of building high-performing teams, here is your instinct codified:\n\n1. **Safety First** - establish psychological safety before pushing for performance\n2. **Clarity of Ownership** - every initiative has exactly one DRI\n3. **Rhythm over Rules** - weekly standups, monthly retros, quarterly planning`,
  teach: `## Teaching Doc: Strategic Thinking\n\n### How I Approach Big-Picture Decisions\n\nWhen I face a strategic decision, I follow a pattern that has served me well:\n\n1. **Frame the decision** - write down the actual question in one sentence\n2. **Map the stakeholders** - who is affected and what do they need?\n3. **Identify the reversibility** - is this a one-way or two-way door?`,
};

// Match a paywall capability string to a sample key
function findSampleKey(capability?: string): string | null {
  if (!capability) return null;
  const lower = capability.toLowerCase();
  if (lower.includes('board') || lower.includes('memo')) return 'board_memo';
  if (lower.includes('strategy')) return 'strategy_doc';
  if (lower.includes('email')) return 'email';
  if (lower.includes('meeting') || lower.includes('agenda')) return 'meeting_agenda';
  if (lower.includes('template')) return 'template';
  if (lower.includes('systemize') || lower.includes('framework')) return 'systemize';
  if (lower.includes('teach')) return 'teach';
  if (lower.includes('draft')) return 'email';
  return 'strategy_doc'; // default fallback
}

const BENEFITS = [
  { icon: PenTool, text: 'Unlimited drafting: emails, memos, strategy docs' },
  { icon: Mail, text: 'Email delivery of generated artifacts' },
  { icon: Layers, text: 'Framework generation from your strengths' },
  { icon: FileText, text: 'All artifact types: agendas, templates, board memos' },
];

const PRICE = EDGE_PRO_PRICE_LABEL;

function PaywallContent({
  capability,
  onClose,
  onSubscribe,
  isProcessing,
}: {
  capability?: string;
  onClose: () => void;
  onSubscribe: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Header icon */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20">
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Unlock Edge Pro</h3>
          {capability && (
            <p className="text-xs text-muted-foreground">
              Required for: {capability}
            </p>
          )}
        </div>
      </div>

      {/* Blurred sample artifact preview */}
      {(() => {
        const sampleKey = findSampleKey(capability);
        const sampleContent = sampleKey ? SAMPLE_ARTIFACTS[sampleKey] : null;
        if (!sampleContent) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative rounded-xl border border-border overflow-hidden"
          >
            <div
              className="p-4 max-h-32 overflow-hidden text-xs"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(sampleContent) }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            <div className="absolute bottom-0 inset-x-0 h-16 backdrop-blur-[3px] bg-background/50 flex items-end justify-center pb-3">
              <span className="text-[11px] text-accent font-medium">Unlock to generate the full artifact</span>
            </div>
          </motion.div>
        );
      })()}

      {/* Benefits */}
      <div className="space-y-3">
        {BENEFITS.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{benefit.text}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Price */}
      <div className="text-center py-2">
        <span className="text-3xl font-bold text-foreground">{PRICE}</span>
        <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
      </div>

      {/* CTA */}
      <div className="space-y-2">
        <Button
          onClick={onSubscribe}
          disabled={isProcessing}
          className="w-full gap-2"
          size="lg"
        >
          <Lock className="h-4 w-4" />
          {isProcessing ? 'Redirecting...' : 'Start Edge Pro'}
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          Maybe later
        </Button>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Secure checkout via Stripe. Cancel anytime from your account.
      </p>
    </div>
  );
}

export const EdgePaywall = React.memo<EdgePaywallProps>(({ isOpen, onClose, capability }) => {
  const isMobile = useIsMobile();
  const { subscribe, isProcessing } = useEdgeSubscription();

  const handleSubscribe = useCallback(async () => {
    const url = await subscribe();
    if (url) {
      window.location.href = url;
    }
  }, [subscribe]);

  // Mobile: Bottom sheet via Sheet component
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Unlock Edge Pro</SheetTitle>
            <SheetDescription>Upgrade to access all Edge capabilities</SheetDescription>
          </SheetHeader>
          <PaywallContent
            capability={capability}
            onClose={onClose}
            onSubscribe={handleSubscribe}
            isProcessing={isProcessing}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Unlock Edge Pro</DialogTitle>
          <DialogDescription>Upgrade to access all Edge capabilities</DialogDescription>
        </DialogHeader>
        <PaywallContent
          capability={capability}
          onClose={onClose}
          onSubscribe={handleSubscribe}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
});

EdgePaywall.displayName = 'EdgePaywall';

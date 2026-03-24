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

interface EdgePaywallProps {
  isOpen: boolean;
  onClose: () => void;
  capability?: string;
}

const BENEFITS = [
  { icon: PenTool, text: 'Unlimited drafting: emails, memos, strategy docs' },
  { icon: Mail, text: 'Email delivery of generated artifacts' },
  { icon: Layers, text: 'Framework generation from your strengths' },
  { icon: FileText, text: 'All artifact types: agendas, templates, board memos' },
];

const PRICE = '$29/mo';

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

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, ClipboardList, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRevealOnMount } from '@/hooks/useRevealOnMount';
import type { IntelligenceGap, GapResolution } from '@/types/edge';

interface Props {
  gap: IntelligenceGap;
  onDismiss: () => void;
  onAction: (gap: IntelligenceGap) => void;
}

const RESOLUTION_CONFIG: Record<GapResolution, { icon: typeof Mic; label: string }> = {
  voice_capture: { icon: Mic, label: 'Answer by voice' },
  diagnostic: { icon: ClipboardList, label: 'Run diagnostic' },
  md_upload: { icon: Upload, label: 'Upload context' },
  quick_confirm: { icon: ClipboardList, label: 'Quick confirm' },
};

export function SmartProbeCard({ gap, onDismiss, onAction }: Props) {
  const config = RESOLUTION_CONFIG[gap.resolution];
  const Icon = config.icon;
  const containerRef = useRef<HTMLDivElement>(null);
  useRevealOnMount(containerRef);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-card to-purple-500/5 border-indigo-500/10">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="Dismiss prompt"
        >
          <X className="h-4 w-4" />
        </button>

        <CardContent className="p-4 sm:p-5 space-y-3 pr-10">
          {/* Prompt text */}
          <p className="text-sm text-foreground leading-relaxed">{gap.prompt}</p>

          {/* Impact hint */}
          <p className="text-[10px] text-muted-foreground">{gap.impact}</p>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-2 border-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
            onClick={() => onAction(gap)}
          >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

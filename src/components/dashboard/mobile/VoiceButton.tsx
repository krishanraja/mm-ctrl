/**
 * VoiceButton Component
 * 
 * Floating voice button for quick access on mobile.
 */

import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/lib/haptics';

interface VoiceButtonProps {
  onClick: () => void;
}

export function VoiceButton({ onClick }: VoiceButtonProps) {
  return (
    <Button
      onClick={() => {
        haptics.medium();
        onClick();
      }}
      size="lg"
      className="fixed bottom-28 right-6 z-40 h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
    >
      <Mic className="h-7 w-7" />
    </Button>
  );
}

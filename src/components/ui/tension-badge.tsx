import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TensionBadgeProps {
  summaryLine: string;
  isLocked?: boolean;
}

export const TensionBadge = React.memo<TensionBadgeProps>(({ 
  summaryLine,
  isLocked = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isLocked) {
    return (
      <Badge variant="outline" className="gap-1 text-xs opacity-50">
        <Zap className="h-3 w-3" />
        Tension (Locked)
      </Badge>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Badge 
          variant="outline" 
          className="gap-1 cursor-pointer hover:bg-accent transition-colors"
        >
          <Zap className="h-3 w-3" />
          Tension
          {isOpen ? (
            <ChevronUp className="h-3 w-3 ml-1" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" />
          )}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-xs leading-relaxed">{summaryLine}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

TensionBadge.displayName = 'TensionBadge';

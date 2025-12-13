import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Thinking...", className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="relative">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-accent/20" />
      </div>
      <p className="mt-6 text-muted-foreground text-lg">{message}</p>
    </div>
  );
}

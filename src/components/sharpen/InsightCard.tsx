import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  variant?: 'default' | 'highlight' | 'action';
  className?: string;
}

export function InsightCard({ 
  icon, 
  title, 
  children, 
  variant = 'default',
  className 
}: InsightCardProps) {
  return (
    <div 
      className={cn(
        'rounded-xl p-5 transition-all duration-300',
        variant === 'default' && 'bg-card border border-border',
        variant === 'highlight' && 'bg-accent/5 border border-accent/20',
        variant === 'action' && 'bg-primary/5 border border-primary/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div 
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            variant === 'default' && 'bg-muted text-muted-foreground',
            variant === 'highlight' && 'bg-accent/20 text-accent-foreground',
            variant === 'action' && 'bg-primary/10 text-primary'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            className={cn(
              'font-semibold text-sm mb-2',
              variant === 'default' && 'text-muted-foreground',
              variant === 'highlight' && 'text-foreground',
              variant === 'action' && 'text-primary'
            )}
          >
            {title}
          </h3>
          <div className="text-foreground text-base leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

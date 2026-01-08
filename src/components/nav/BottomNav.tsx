import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Brain, Mic, History, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { to: '/today', label: 'Today', icon: <Brain className="h-5 w-5" /> },
  { to: '/capture', label: 'Capture', icon: <Mic className="h-5 w-5" /> },
  { to: '/timeline', label: 'Timeline', icon: <History className="h-5 w-5" /> },
  { to: '/baseline', label: 'Baseline', icon: <BarChart3 className="h-5 w-5" /> },
];

/**
 * BottomNav
 * 
 * Mindmaker Control: No visible tab bar on mobile.
 * Desktop can have subtle sidebar - mobile must not.
 * 
 * Primary navigation is:
 * - Vertical scroll
 * - Contextual back gesture
 * - Long-press for secondary actions
 */
export function BottomNav() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // No visible nav on mobile - this is intentional
  // Executives do not explore software. They check it.
  if (isMobile) {
    return null;
  }

  // Desktop: subtle sidebar nav
  return (
    <nav
      aria-label="Primary"
      className="fixed left-0 top-0 bottom-0 z-40 w-16 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 hidden md:flex flex-col items-center py-6"
    >
      <div className="flex flex-col gap-2 mt-auto mb-auto">
        {NAV.map((item) => {
          const isActive =
            location.pathname === item.to || location.pathname.startsWith(item.to + '/');

          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              {item.icon}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

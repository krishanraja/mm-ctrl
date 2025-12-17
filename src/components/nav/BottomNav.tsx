import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Brain, Mic, History, BarChart3 } from 'lucide-react';

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
 * - Mobile-first navigation for the “ongoing loop”.
 * - Intentionally small: 4 destinations, all thumb-accessible.
 */
export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto max-w-4xl px-2 pb-safe-bottom">
        <div className="grid grid-cols-4 gap-1 py-2">
          {NAV.map((item) => {
            const isActive =
              location.pathname === item.to || location.pathname.startsWith(item.to + '/');

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                {item.icon}
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}


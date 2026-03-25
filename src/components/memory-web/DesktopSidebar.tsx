import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Zap, Brain, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', search: '', icon: Home, label: 'Home' },
  { path: '/dashboard', search: '?view=edge', icon: Zap, label: 'Edge' },
  { path: '/memory', search: '', icon: Brain, label: 'Memory Web' },
  { path: '/context', search: '', icon: Download, label: 'Export to AI' },
];

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col z-40">
      <div className="px-6 py-5 border-b border-border">
        <img
          src="/mindmaker-full-logo.png"
          alt="Mindmaker"
          className="h-5 w-auto"
        />
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const fullPath = item.path + item.search;
          const isActive =
            (item.search
              ? location.pathname + location.search === fullPath
              : location.pathname === item.path && !location.search) ||
            (item.path !== '/dashboard' && !item.search && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.label}
              onClick={() => {
                if (location.pathname === item.path) {
                  // Same pathname - use setSearchParams to update query without full navigate
                  setSearchParams(item.search ? new URLSearchParams(item.search) : {});
                } else {
                  navigate({ pathname: item.path, search: item.search });
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium',
                'transition-colors duration-150',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px]',
                  isActive ? 'text-accent' : 'text-muted-foreground',
                )}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium',
            'transition-colors duration-150',
            location.pathname === '/settings'
              ? 'bg-accent/10 text-accent'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </button>
      </div>
    </aside>
  );
}

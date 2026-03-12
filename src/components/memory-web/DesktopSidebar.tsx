import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Lightbulb, Brain, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/think', icon: Lightbulb, label: 'Think' },
  { path: '/memory', icon: Brain, label: 'Memory Web' },
  { path: '/context', icon: Download, label: 'Export to AI' },
];

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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

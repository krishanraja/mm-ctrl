import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Lightbulb, Brain, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/think', icon: Lightbulb, label: 'Think' },
  { path: '/memory', icon: Brain, label: 'Memory' },
  { path: '/context', icon: Download, label: 'Export' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 pb-safe bg-background/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full',
                'transition-colors duration-200 min-h-[44px]',
                isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-accent')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { Plus, ArrowUpRight } from 'lucide-react';
import { CtrlLogo } from '@/components/landing/CtrlLogo';

interface AppHeaderProps {
  /**
   * Retained for compatibility. The profile button no longer renders in the
   * header on any platform; Profile is reachable via the global FAB menu
   * (long-press the mic, tap Profile) which opens the Settings sheet.
   */
  showProfile?: boolean;
  onAdd?: () => void;
  onExport?: () => void;
}

/**
 * Shared app header: small favicon icon + CTRL logo in top-left.
 * Used on all authenticated mobile pages.
 * Optionally renders Add / Export action buttons. Keep this bar minimal so
 * the viewport stays readable under browser chrome at 360px widths.
 */
export function AppHeader({ onAdd, onExport }: AppHeaderProps) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <img src="/mindmaker-favicon.png" alt="" className="h-6 w-6" />
        <CtrlLogo className="h-3.5 w-auto translate-x-0.5" />
      </div>
      <div className="flex items-center gap-1.5">
        {onExport && (
          <button
            onClick={onExport}
            className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors"
            aria-label="Export to AI"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/90 transition-colors"
            aria-label="Add memory"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

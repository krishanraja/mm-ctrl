import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { CtrlLogo } from '@/components/landing/CtrlLogo';

/**
 * Shared app header: small favicon icon + CTRL logo in top-left.
 * Used on all authenticated mobile pages.
 */
export function AppHeader({ showProfile = true }: { showProfile?: boolean }) {
  const navigate = useNavigate();

  return (
    <header className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <img src="/mindmaker-favicon.png" alt="" className="h-6 w-6" />
        <CtrlLogo className="h-3.5 w-auto translate-x-0.5" />
      </div>
      {showProfile && (
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors"
          aria-label="Profile"
        >
          <User className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}

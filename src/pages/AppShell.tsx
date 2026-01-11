import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BottomNav } from '@/components/nav/BottomNav';
import { ensureAnonSession } from '@/utils/ensureAnonSession';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * AppShell
 * 
 * Mindmaker Control:
 * - Wraps the "ongoing loop" routes
 * - Ensures we have an identity (Supabase anon session) so future writes can be RLS-safe
 * - No bottom nav on mobile - navigation via vertical scroll and back gestures
 * - Desktop: subtle sidebar nav
 */
export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { userId } = await ensureAnonSession();
      if (!isMounted) return;

      // If auth is unavailable for some reason, send user back to the landing experience.
      if (!userId) {
        console.warn('⚠️ AppShell: could not establish session, redirecting to landing');
        navigate('/', { replace: true });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Hide nav on certain routes
  const showNav = !['/', '/coach'].includes(location.pathname);

  return (
    <div className="h-[var(--mobile-vh)] bg-background overflow-hidden flex flex-col">
      {/* Content area: no bottom padding on mobile (no nav), left padding on desktop for sidebar */}
      <div className={`flex-1 overflow-y-auto ${showNav && !isMobile ? 'md:pl-16' : undefined}`}>
        <Outlet />
      </div>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}

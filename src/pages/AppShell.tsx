import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BottomNav } from '@/components/nav/BottomNav';
import { ensureAnonSession } from '@/utils/ensureAnonSession';

/**
 * AppShell
 * - Wraps the “ongoing loop” routes.
 * - Ensures we have an identity (Supabase anon session) so future writes can be RLS-safe.
 * - Provides a consistent mobile-first frame + bottom navigation.
 */
export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Hide nav on the landing route (shouldn’t happen, but keep safe)
  const showNav = !['/', '/coach'].includes(location.pathname);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Content area: leave room for bottom nav on mobile */}
      <div className={showNav ? 'pb-20' : undefined}>
        <Outlet />
      </div>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}


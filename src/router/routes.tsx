/**
 * Route Definitions
 * 
 * Centralized route configuration.
 */

import { Navigate, RouteObject } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Today from '@/pages/Today';
import Pulse from '@/pages/Pulse';
import Voice from '@/pages/Voice';
import { AuthScreen } from '@/components/auth/AuthScreen';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/signin',
    element: (
      <div className="h-[var(--mobile-vh)] flex items-center justify-center bg-background p-4">
        <AuthScreen />
      </div>
    ),
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/today',
    element: <Today />,
  },
  {
    path: '/pulse',
    element: <Pulse />,
  },
  {
    path: '/voice',
    element: <Voice />,
  },
  // /timeline and /profile were unimplemented "coming soon" stubs that
  // shipped as bare divs. Redirect rather than 404 so any existing
  // bookmarks / email links land somewhere useful: timeline → briefing
  // (closest functional surface), profile → settings/account.
  {
    path: '/timeline',
    element: <Navigate to="/briefing" replace />,
  },
  {
    path: '/profile',
    element: <Navigate to="/dashboard?section=account" replace />,
  },
];

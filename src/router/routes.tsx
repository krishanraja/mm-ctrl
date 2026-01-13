/**
 * Route Definitions
 * 
 * Centralized route configuration.
 */

import { RouteObject } from 'react-router-dom';
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
  {
    path: '/timeline',
    element: <div>Timeline (coming soon)</div>,
  },
  {
    path: '/profile',
    element: <div>Profile (coming soon)</div>,
  },
];

// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Diagnostic from '@/pages/Diagnostic'
import Dashboard from '@/pages/Dashboard'
import Voice from '@/pages/Voice'
import Pulse from '@/pages/Pulse'
import Today from '@/pages/Today'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import Auth from '@/pages/Auth'
import { RequireAuth } from '@/components/auth/RequireAuth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/diagnostic',
    element: <Diagnostic />,
  },
  {
    path: '/dashboard',
    element: <RequireAuth><Dashboard /></RequireAuth>,
  },
  {
    path: '/voice',
    element: <Voice />,
  },
  {
    path: '/pulse',
    element: <RequireAuth><Pulse /></RequireAuth>,
  },
  {
    path: '/today',
    element: <RequireAuth><Today /></RequireAuth>,
  },
  {
    path: '/profile',
    element: <RequireAuth><Profile /></RequireAuth>,
  },
  {
    path: '/settings',
    element: <RequireAuth><Settings /></RequireAuth>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

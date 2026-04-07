import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { RequireAuth } from '@/components/auth/RequireAuth'

const Landing = lazy(() => import('@/pages/Landing'))
const Auth = lazy(() => import('@/pages/Auth'))
const AuthCallback = lazy(() => import('@/pages/AuthCallback'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const MemoryCenter = lazy(() => import('@/pages/MemoryCenter'))
const ContextExport = lazy(() => import('@/pages/ContextExport'))
const Settings = lazy(() => import('@/pages/Settings'))
const Compliance = lazy(() => import('@/pages/Compliance'))
const Profile = lazy(() => import('@/pages/Profile'))
const Booking = lazy(() => import('@/pages/Booking'))
const BriefingPage = lazy(() => import('@/pages/BriefingPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function LoadingPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00D9B6]" />
    </div>
  )
}

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingPage />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <LazyWrapper><Landing /></LazyWrapper>,
  },
  {
    path: '/auth',
    element: <LazyWrapper><Auth /></LazyWrapper>,
  },
  {
    path: '/auth/callback',
    element: <LazyWrapper><AuthCallback /></LazyWrapper>,
  },
  {
    path: '/booking',
    element: <LazyWrapper><Booking /></LazyWrapper>,
  },

  // Authenticated routes
  {
    path: '/dashboard',
    element: <LazyWrapper><RequireAuth><Dashboard /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/think',
    element: <Navigate to="/dashboard?view=edge" replace />,
  },
  {
    path: '/memory',
    element: <LazyWrapper><RequireAuth><MemoryCenter /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/context',
    element: <LazyWrapper><RequireAuth><ContextExport /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/briefing',
    element: <LazyWrapper><RequireAuth><BriefingPage /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/settings',
    element: <LazyWrapper><RequireAuth><Settings /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/compliance',
    element: <LazyWrapper><RequireAuth><Compliance /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/profile',
    element: <LazyWrapper><RequireAuth><Profile /></RequireAuth></LazyWrapper>,
  },

  // Legacy redirects
  {
    path: '/today',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/pulse',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/voice',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/diagnostic',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <LazyWrapper><NotFound /></LazyWrapper>,
  },
])

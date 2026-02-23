// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { RequireAuth } from '@/components/auth/RequireAuth'

// Lazy load pages for better initial load performance
const Landing = lazy(() => import('@/pages/Landing'))
const Diagnostic = lazy(() => import('@/pages/Diagnostic'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Voice = lazy(() => import('@/pages/Voice'))
const Pulse = lazy(() => import('@/pages/Pulse'))
const Today = lazy(() => import('@/pages/Today'))
const Profile = lazy(() => import('@/pages/Profile'))
const Auth = lazy(() => import('@/pages/Auth'))
const MemoryCenter = lazy(() => import('@/pages/MemoryCenter'))
const MissionCheckIn = lazy(() => import('@/pages/MissionCheckIn'))
const MissionHistory = lazy(() => import('@/pages/MissionHistory'))

// Loading component shown while lazy-loaded pages are loading
function LoadingPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00D9B6]"></div>
    </div>
  )
}

// Wrapper to provide Suspense boundary for lazy-loaded components
function LazyWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingPage />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LazyWrapper><Landing /></LazyWrapper>,
  },
  {
    path: '/auth',
    element: <LazyWrapper><Auth /></LazyWrapper>,
  },
  {
    path: '/diagnostic',
    element: <LazyWrapper><Diagnostic /></LazyWrapper>,
  },
  {
    path: '/dashboard',
    element: <LazyWrapper><RequireAuth><Dashboard /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/voice',
    element: <LazyWrapper><Voice /></LazyWrapper>,
  },
  {
    path: '/pulse',
    element: <LazyWrapper><RequireAuth><Pulse /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/today',
    element: <LazyWrapper><RequireAuth><Today /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/profile',
    element: <LazyWrapper><RequireAuth><Profile /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/memory',
    element: <LazyWrapper><RequireAuth><MemoryCenter /></RequireAuth></LazyWrapper>,
  },
  {
    path: '/mission-check-in',
    element: <LazyWrapper><MissionCheckIn /></LazyWrapper>,
  },
  {
    path: '/missions/history',
    element: <LazyWrapper><RequireAuth><MissionHistory /></RequireAuth></LazyWrapper>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

/**
 * App Component
 * Main app with splash screen, routing, and providers.
 */

import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { OfflineIndicator } from '@/components/ui/offline-indicator'
import { SplashScreen } from '@/components/ui/splash-screen'
import { initMobileViewport } from '@/utils/mobileViewport'
import { router } from '@/router'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    return !sessionStorage.getItem('mindmaker-splash-shown')
  })

  // Initialize mobile viewport utility
  useEffect(() => {
    const cleanup = initMobileViewport()
    return cleanup
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem('mindmaker-splash-shown', 'true')
    setShowSplash(false)
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <RouterProvider router={router} />
          <Toaster />
          <OfflineIndicator />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

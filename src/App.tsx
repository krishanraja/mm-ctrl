/**
 * App Component
 * 
 * Main app component with routing and providers.
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { initMobileViewport } from '@/utils/mobileViewport';
import { router } from '@/router';
import '@/index.css';

const queryClient = new QueryClient();

export default function App() {
  // Initialize mobile viewport utility
  useEffect(() => {
    const cleanup = initMobileViewport();
    return cleanup;
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
          <OfflineIndicator />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

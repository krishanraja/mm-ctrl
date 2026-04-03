import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status.
 * Returns true when online, false when offline.
 * All browser API access is wrapped in try-catch to prevent crashes
 * in private browsing mode or restricted environments.
 */
export function useOfflineDetection(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    try {
      if (typeof window !== 'undefined' && 'navigator' in window) {
        return navigator.onLine;
      }
    } catch {
      // Ignore errors in restricted environments
    }
    return true; // Assume online if we can't detect
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    try {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    } catch {
      // Silently ignore if addEventListener is unavailable
    }

    return () => {
      try {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      } catch {
        // Silently ignore
      }
    };
  }, []);

  return isOnline;
}

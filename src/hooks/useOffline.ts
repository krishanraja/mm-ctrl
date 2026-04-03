/**
 * useOffline Hook
 *
 * Offline detection and action queuing.
 * All browser API access is wrapped in try-catch to prevent crashes
 * in private browsing mode or restricted environments.
 */

import { useState, useEffect } from 'react';

function getIsOffline(): boolean {
  try {
    return !navigator.onLine;
  } catch {
    return false; // Assume online if detection fails
  }
}

export function useOffline() {
  const [isOffline, setIsOffline] = useState(getIsOffline);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

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

  return { isOffline };
}

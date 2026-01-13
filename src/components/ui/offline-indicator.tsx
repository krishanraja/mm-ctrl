/**
 * OfflineIndicator Component
 * 
 * Shows offline status and queues actions.
 */

import { WifiOff } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOffline } = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 text-yellow-900 px-4 py-2 text-center text-sm font-medium"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Actions will be queued.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

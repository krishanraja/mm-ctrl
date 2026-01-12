import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

export function OfflineIndicator() {
  const isOnline = useOfflineDetection();

  if (isOnline) return null;

  return (
    <Alert className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md border-destructive bg-destructive/10">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Some features may not work until you reconnect.
      </AlertDescription>
    </Alert>
  );
}

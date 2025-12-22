import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RateLimitFeedbackProps {
  error: string;
  retryAfter?: number; // seconds until retry is allowed
  onRetry?: () => void;
  className?: string;
}

/**
 * Rate Limit Feedback Component
 * 
 * User-friendly feedback when rate limits are hit.
 * Shows countdown timer and retry button.
 */
export const RateLimitFeedback: React.FC<RateLimitFeedbackProps> = ({
  error,
  retryAfter = 60,
  onRetry,
  className = '',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(retryAfter);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    setSecondsRemaining(retryAfter);
    setCanRetry(false);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setCanRetry(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className={`bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 rounded-full shrink-0">
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Too many requests
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {error || "You've made too many requests. Please wait before trying again."}
          </p>
          
          {!canRetry && secondsRemaining > 0 && (
            <div className="flex items-center gap-2 mt-3 text-sm text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span>Try again in {formatTime(secondsRemaining)}</span>
            </div>
          )}

          {canRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to detect rate limit errors
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    // Check for 429 status
    if (e.status === 429 || e.code === 429) return true;
    // Check for rate limit message
    if (typeof e.message === 'string' && e.message.toLowerCase().includes('rate limit')) return true;
  }
  
  if (typeof error === 'string') {
    return error.toLowerCase().includes('rate limit') || error.includes('429');
  }
  
  return false;
}

/**
 * Parse retry-after from error or response
 */
export function parseRetryAfter(error: unknown): number {
  if (!error) return 60;
  
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.retryAfter === 'number') return e.retryAfter;
    if (e.headers && typeof e.headers === 'object') {
      const headers = e.headers as Record<string, string>;
      if (headers['retry-after']) {
        return parseInt(headers['retry-after'], 10) || 60;
      }
    }
  }
  
  return 60; // Default 60 seconds
}

export default RateLimitFeedback;



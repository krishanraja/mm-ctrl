/**
 * Lightweight error tracking utility.
 *
 * Captures errors with context and stores them in Supabase for visibility.
 * Can be replaced with Sentry/LogRocket by swapping the `report` implementation.
 *
 * Usage:
 *   import { errorTracker } from '@/lib/errorTracking';
 *   errorTracker.capture(error, { component: 'Dashboard', action: 'loadFacts' });
 */

import { supabase } from '@/integrations/supabase/client';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

interface TrackedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  url: string;
  timestamp: string;
  userAgent: string;
}

const ERROR_QUEUE: TrackedError[] = [];
const MAX_QUEUE_SIZE = 50;
const FLUSH_INTERVAL_MS = 10_000;
let flushTimer: ReturnType<typeof setInterval> | null = null;

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

async function flushErrors(): Promise<void> {
  if (ERROR_QUEUE.length === 0) return;

  const batch = ERROR_QUEUE.splice(0, ERROR_QUEUE.length);

  try {
    await supabase.from('client_errors').insert(
      batch.map((e) => ({
        error_message: e.message,
        error_stack: e.stack?.slice(0, 4000),
        component: e.context.component ?? null,
        action: e.context.action ?? null,
        user_id: e.context.userId ?? null,
        extra: e.context.extra ?? null,
        url: e.url,
        user_agent: e.userAgent,
        created_at: e.timestamp,
      }))
    );
  } catch {
    // If the table doesn't exist or insert fails, log to console as fallback.
    // This prevents error tracking from itself causing errors.
    if (import.meta.env.DEV) {
      console.warn('[errorTracker] Failed to flush errors to Supabase. Falling back to console.');
      batch.forEach((e) => console.error('[tracked]', e.message, e.context));
    }
  }
}

export const errorTracker = {
  /**
   * Capture an error with optional context.
   */
  capture(error: unknown, context: ErrorContext = {}): void {
    const { message, stack } = normalizeError(error);

    // Always log in dev
    if (import.meta.env.DEV) {
      console.error(`[errorTracker] ${message}`, context);
    }

    const tracked: TrackedError = {
      message,
      stack,
      context,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    ERROR_QUEUE.push(tracked);

    // Prevent unbounded growth
    if (ERROR_QUEUE.length > MAX_QUEUE_SIZE) {
      ERROR_QUEUE.splice(0, ERROR_QUEUE.length - MAX_QUEUE_SIZE);
    }

    // Start flush timer if not running
    if (!flushTimer) {
      flushTimer = setInterval(() => {
        flushErrors();
      }, FLUSH_INTERVAL_MS);
    }
  },

  /**
   * Immediately flush queued errors (e.g., before page unload).
   */
  flush(): void {
    flushErrors();
  },

  /**
   * Install global error handlers for uncaught errors and unhandled rejections.
   */
  install(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      errorTracker.capture(event.error ?? event.message, {
        component: 'window',
        action: 'uncaughtError',
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      errorTracker.capture(event.reason, {
        component: 'window',
        action: 'unhandledRejection',
      });
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      errorTracker.flush();
    });
  },
};

/**
 * Haptic Feedback Utilities
 * 
 * Provides haptic feedback for mobile devices.
 * Gracefully degrades on devices that don't support it.
 */

import { HAPTIC_PATTERNS } from '@/core/constants';

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback
 */
export const haptic = (pattern: number | number[] = HAPTIC_PATTERNS.medium): void => {
  if (!isHapticSupported()) {
    return;
  }

  try {
    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern);
    } else {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    // Silently fail if haptics aren't available
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Predefined haptic patterns
 */
export const haptics = {
  light: () => haptic(HAPTIC_PATTERNS.light),
  medium: () => haptic(HAPTIC_PATTERNS.medium),
  heavy: () => haptic(HAPTIC_PATTERNS.heavy),
  success: () => haptic(HAPTIC_PATTERNS.success),
  error: () => haptic(HAPTIC_PATTERNS.error),
};

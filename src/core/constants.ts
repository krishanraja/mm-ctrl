/**
 * Core Constants
 * 
 * Single source of truth for breakpoints, configuration, and constants.
 */

/**
 * Mobile/Desktop Breakpoint
 * 
 * Devices with width < 768px are considered mobile.
 * Devices with width >= 768px are considered desktop.
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Viewport Height Buffer
 * 
 * Percentage to subtract from viewport height to account for browser chrome
 * (address bars, safe area insets, etc.)
 */
export const VIEWPORT_HEIGHT_BUFFER = 0.05; // 5%

/**
 * Voice Recording Limits
 */
export const QUICK_VOICE_DURATION = 30; // seconds
export const WEEKLY_CHECKIN_DURATION = 120; // seconds

/**
 * Animation Durations (ms)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 700,
};

/**
 * Haptic Feedback Patterns
 */
export const HAPTIC_PATTERNS = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 20],
  error: [50, 50, 50],
};

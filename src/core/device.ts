/**
 * Device Detection Utilities
 * 
 * Unified device detection using media queries for reliability.
 * Single source of truth for mobile/desktop detection.
 */

import { MOBILE_BREAKPOINT } from './constants';

/**
 * Check if current viewport is mobile
 * Uses window.innerWidth for initial check (SSR-safe)
 */
export const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Check if current viewport is desktop
 */
export const isDesktopViewport = (): boolean => {
  return !isMobileViewport();
};

/**
 * Get mobile breakpoint media query
 */
export function getMobileMediaQuery(): string {
  return `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
}

/**
 * Get desktop breakpoint media query
 */
export function getDesktopMediaQuery(): string {
  return `(min-width: ${MOBILE_BREAKPOINT}px)`;
}

/**
 * Mobile Viewport Utility System
 * 
 * Calculates actual mobile viewport height accounting for browser chrome
 * (address bars, safe area insets) and provides CSS custom property for use
 * throughout the application.
 * 
 * This solves the 3-5% overflow issue where 100dvh doesn't account for
 * dynamic browser chrome that shows/hides on scroll.
 */

/**
 * Get the actual mobile viewport height
 * Uses visualViewport API when available for most accurate measurement
 */
export const getMobileViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0;
  
  // Use visual viewport if available (more accurate, accounts for keyboard/chrome)
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  
  // Fallback: window.innerHeight (excludes chrome when hidden)
  return window.innerHeight;
};

/**
 * Set CSS custom property for viewport height
 * This allows components to use var(--mobile-vh) instead of 100dvh
 */
export const setViewportHeight = (): void => {
  const vh = getMobileViewportHeight();
  document.documentElement.style.setProperty('--mobile-vh', `${vh}px`);
};

/**
 * Initialize mobile viewport tracking
 * Sets initial value and listens for resize/orientation changes
 * 
 * @returns Cleanup function to remove event listeners
 */
export const initMobileViewport = (): (() => void) => {
  // Set initial value
  setViewportHeight();
  
  // Update on window resize
  window.addEventListener('resize', setViewportHeight);
  
  // Update on orientation change
  window.addEventListener('orientationchange', setViewportHeight);
  
  // Use visual viewport API if available (more accurate for mobile)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportHeight);
    window.visualViewport.addEventListener('scroll', setViewportHeight);
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', setViewportHeight);
    window.removeEventListener('orientationchange', setViewportHeight);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', setViewportHeight);
      window.visualViewport.removeEventListener('scroll', setViewportHeight);
    }
  };
};

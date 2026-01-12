/**
 * Haptic feedback utility for mobile interactions
 * Provides tactile feedback patterns for different interaction types
 */
export const haptic = {
  /**
   * Light tap - for button presses, checkbox toggles
   */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  /**
   * Medium tap - for slider value changes, voice button press
   */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  /**
   * Double tap - for important actions (add business line, complete step)
   */
  double: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
};

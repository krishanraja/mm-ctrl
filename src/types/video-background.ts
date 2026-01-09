/**
 * Video Background Configuration Types
 * 
 * Type-safe configuration for video backgrounds with validation.
 * Ensures correct z-index values and overlay opacity to prevent
 * architectural issues that block video visibility.
 */

/**
 * Video background configuration interface
 * 
 * @property videoSrc - Path to video file
 * @property overlayOpacity - Overlay opacity (0-1 range, typically 0.5 for 50%)
 * @property zIndexVideo - Must be -20 (base layer)
 * @property zIndexOverlay - Must be -10 (above video, below content)
 * @property autoplay - Whether video should autoplay (default: true)
 * @property loop - Whether video should loop (default: true)
 * @property muted - Whether video should be muted (default: true)
 */
export interface VideoBackgroundConfig {
  videoSrc: string;
  overlayOpacity: number; // 0-1 range
  zIndexVideo: -20; // Enforced value - base layer
  zIndexOverlay: -10; // Enforced value - above video, below content
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

/**
 * Validates video background configuration
 * 
 * Ensures:
 * - Overlay opacity is between 0 and 1
 * - Z-index values are correct (-20 for video, -10 for overlay)
 * 
 * @param config - Video background configuration
 * @returns true if valid, false otherwise
 */
export function validateVideoBackground(config: VideoBackgroundConfig): boolean {
  if (config.overlayOpacity < 0 || config.overlayOpacity > 1) {
    console.error('❌ VideoBackground: Overlay opacity must be between 0 and 1');
    return false;
  }
  if (config.zIndexVideo !== -20) {
    console.error('❌ VideoBackground: Video z-index must be -20 (base layer)');
    return false;
  }
  if (config.zIndexOverlay !== -10) {
    console.error('❌ VideoBackground: Overlay z-index must be -10 (above video, below content)');
    return false;
  }
  return true;
}

/**
 * Default video background configuration
 */
export const DEFAULT_VIDEO_BACKGROUND_CONFIG: VideoBackgroundConfig = {
  videoSrc: '/Mindmaker for Leaders - background video.mp4',
  overlayOpacity: 0.5, // 50% black overlay
  zIndexVideo: -20,
  zIndexOverlay: -10,
  autoplay: true,
  loop: true,
  muted: true,
};

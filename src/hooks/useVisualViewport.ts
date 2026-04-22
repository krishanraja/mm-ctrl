import { useEffect, useState } from 'react';

/**
 * Tracks the visual viewport so we can lift fixed UI above the on-screen
 * keyboard on iOS Safari and Chrome Android.
 *
 * `keyboardHeight` is the number of pixels the keyboard is currently
 * obscuring. When no keyboard is open it returns 0.
 *
 * Usage:
 *   const { keyboardHeight } = useVisualViewport();
 *   <SheetContent style={{ paddingBottom: keyboardHeight }}>
 */
export function useVisualViewport() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window === 'undefined'
      ? 0
      : window.visualViewport?.height ?? window.innerHeight,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const layoutHeight = window.innerHeight;
      const visibleHeight = vv.height;
      // Account for offsetTop so keyboard height is correct when the
      // viewport is also panned (rare, but happens with iOS form zoom).
      const obscured = Math.max(
        0,
        layoutHeight - (visibleHeight + vv.offsetTop),
      );
      setKeyboardHeight(obscured);
      setViewportHeight(visibleHeight);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return {
    keyboardHeight,
    viewportHeight,
    isKeyboardOpen: keyboardHeight > 60,
  };
}

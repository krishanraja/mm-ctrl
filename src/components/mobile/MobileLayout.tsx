import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { initMobileViewport } from '@/utils/mobileViewport';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MobileLayout
 * 
 * Wrapper component that ensures no-scroll behavior on mobile devices.
 * Uses the mobile viewport utility system to account for browser chrome
 * and safe area insets.
 * 
 * Usage:
 * ```tsx
 * <MobileLayout>
 *   <YourContent />
 * </MobileLayout>
 * ```
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  className 
}) => {
  // Initialize viewport utility (idempotent - safe to call multiple times)
  useEffect(() => {
    const cleanup = initMobileViewport();
    return cleanup;
  }, []);

  return (
    <div 
      className={cn(
        "h-[var(--mobile-vh)] overflow-hidden flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
};

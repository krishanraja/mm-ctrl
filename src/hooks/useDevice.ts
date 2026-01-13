// src/hooks/useDevice.ts
import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

export function useDevice() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Use matchMedia for better performance
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    checkDevice() // Initial check
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return { isMobile, isDesktop: !isMobile }
}

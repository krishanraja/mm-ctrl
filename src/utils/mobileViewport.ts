// src/utils/mobileViewport.ts
export function initMobileViewport(): () => void {
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  setVH()
  window.addEventListener('resize', setVH)
  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100) // Delay for orientation change
  })
  
  // Prevent overscroll bounce on iOS
  document.body.style.overscrollBehavior = 'none'
  
  return () => {
    window.removeEventListener('resize', setVH)
    window.removeEventListener('orientationchange', setVH)
  }
}

// CSS usage: height: calc(var(--vh, 1vh) * 100);
// Tailwind class: h-[calc(var(--vh,1vh)*100)]

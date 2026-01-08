import { createContext, useContext, useEffect } from 'react'

/**
 * Mindmaker Control: Dark mode only
 * No theme switching - executives don't configure, they check.
 */

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeProviderState = {
  theme: 'dark'
}

const initialState: ThemeProviderState = {
  theme: 'dark',
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Force dark mode on mount - no toggles, no preferences
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
  }, [])

  return (
    <ThemeProviderContext.Provider {...props} value={initialState}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
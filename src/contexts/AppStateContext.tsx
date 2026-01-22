// src/contexts/AppStateContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'

type AppState = 'LOADING' | 'SPLASH' | 'READY'

interface AppStateContextType {
  appState: AppState
  advanceToSplash: () => void
  advanceToReady: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>('LOADING')

  const advanceToSplash = () => {
    console.log('🎬 App state: LOADING → SPLASH')
    setAppState('SPLASH')
  }

  const advanceToReady = () => {
    console.log('✅ App state: SPLASH → READY')
    setAppState('READY')
  }

  return (
    <AppStateContext.Provider value={{ appState, advanceToSplash, advanceToReady }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}

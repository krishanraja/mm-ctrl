import { createContext, useCallback, useContext, useState } from 'react'

export type SettingsSection =
  | 'account'
  | 'profile'
  | 'briefing'
  | 'briefing-interests'
  | 'notifications'
  | 'privacy'
  | 'preferences'
  | 'edge-pro'
  | 'manifesto'

interface SettingsSheetContextValue {
  open: boolean
  section: SettingsSection | null
  openSheet: () => void
  closeSheet: () => void
  openTo: (section: SettingsSection) => void
  setSection: (section: SettingsSection | null) => void
}

const SettingsSheetContext = createContext<SettingsSheetContextValue | null>(null)

export function SettingsSheetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<SettingsSection | null>(null)

  const openSheet = useCallback(() => {
    setSection(null)
    setOpen(true)
  }, [])

  const closeSheet = useCallback(() => {
    setOpen(false)
    setSection(null)
  }, [])

  const openTo = useCallback((next: SettingsSection) => {
    setSection(next)
    setOpen(true)
  }, [])

  return (
    <SettingsSheetContext.Provider
      value={{ open, section, openSheet, closeSheet, openTo, setSection }}
    >
      {children}
    </SettingsSheetContext.Provider>
  )
}

export function useSettingsSheet() {
  const ctx = useContext(SettingsSheetContext)
  if (!ctx) throw new Error('useSettingsSheet must be used within SettingsSheetProvider')
  return ctx
}

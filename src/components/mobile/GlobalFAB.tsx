import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Mic, Radio, Settings as SettingsIcon, UserCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { useGenerateBriefing } from '@/hooks/useBriefing'
import { useBriefingContext } from '@/contexts/BriefingContext'
import { useSettingsSheet } from '@/contexts/SettingsSheetContext'

const LONG_PRESS_MS = 220

export function GlobalFAB() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const { generate, generating } = useGenerateBriefing()
  const { setSheetOpen, playback } = useBriefingContext()
  const { openSheet, openTo } = useSettingsSheet()

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handlePressStart = useCallback(() => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setMenuOpen(true)
      haptics.light()
    }, LONG_PRESS_MS)
  }, [])

  const handlePressEnd = useCallback(() => {
    clearLongPress()
    if (didLongPress.current) return
    // Short tap opens the menu too; long-press is just a faster route.
    // This avoids navigating to the legacy /voice redirect.
    setMenuOpen(true)
  }, [])

  const handleTalkToCtrl = () => {
    setMenuOpen(false)
    navigate('/dashboard')
  }

  const handleBriefMe = async () => {
    setMenuOpen(false)
    const briefingId = await generate()
    if (briefingId) {
      setSheetOpen(true)
    }
  }

  const handleSettings = () => {
    setMenuOpen(false)
    openSheet()
  }

  const handleProfile = () => {
    setMenuOpen(false)
    openTo('profile')
  }

  const briefingPlaying = playback.isPlaying

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
              className="fixed right-4 z-40 min-w-[220px] bg-background border border-border rounded-xl shadow-xl overflow-hidden"
              role="menu"
            >
              <FabMenuItem
                icon={MessageSquare}
                label="Talk to ctrl"
                onClick={handleTalkToCtrl}
              />
              <FabMenuItem
                icon={Radio}
                label={generating ? 'Generating...' : 'Brief me now'}
                accent
                disabled={generating}
                onClick={handleBriefMe}
              />
              <FabMenuItem icon={SettingsIcon} label="Settings" onClick={handleSettings} />
              <FabMenuItem icon={UserCircle} label="Profile" onClick={handleProfile} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={clearLongPress}
        aria-label={menuOpen ? 'Close menu' : 'Open voice and actions menu'}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
        whileTap={{ scale: 0.94 }}
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
        className={cn(
          'fixed right-4 z-40 w-14 h-14 rounded-full',
          'flex items-center justify-center',
          'text-accent-foreground shadow-lg shadow-accent/25',
          generating ? 'bg-accent/80' : 'bg-accent',
          generating ? '' : 'fab-pulse',
        )}
      >
        {generating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="w-6 h-6 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full"
          />
        ) : (
          <>
            <Mic className="h-6 w-6" />
            {briefingPlaying && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-background border-2 border-accent"
              />
            )}
          </>
        )}
      </motion.button>
    </>
  )
}

interface FabMenuItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  accent?: boolean
  disabled?: boolean
}

function FabMenuItem({ icon: Icon, label, onClick, accent, disabled }: FabMenuItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
        'hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed',
        'border-b border-border last:border-b-0',
      )}
    >
      <Icon className={cn('w-4 h-4', accent ? 'text-accent' : 'text-muted-foreground')} />
      <span className={cn('text-sm font-medium', accent && 'text-accent')}>{label}</span>
    </button>
  )
}

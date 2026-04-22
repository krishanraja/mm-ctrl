import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, X } from 'lucide-react'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { useSettingsSheet } from '@/contexts/SettingsSheetContext'
import { SettingsList, SETTINGS_SECTION_LABELS } from './SettingsList'
import { SettingsSectionView } from './SettingsSectionView'

export function SettingsSheet() {
  const { open, section, closeSheet, setSection } = useSettingsSheet()

  return (
    <Drawer open={open} onOpenChange={(next) => (next ? null : closeSheet())}>
      <DrawerContent className="h-[92svh] max-h-[92svh] p-0">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            {section && (
              <button
                onClick={() => setSection(null)}
                className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Back to settings"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <DrawerTitle className="text-base font-semibold truncate">
              {section ? SETTINGS_SECTION_LABELS[section] : 'Settings'}
            </DrawerTitle>
          </div>
          <button
            onClick={closeSheet}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide">
          <AnimatePresence mode="wait" initial={false}>
            {section ? (
              <motion.div
                key={`section-${section}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
                className="px-4 py-4"
              >
                <SettingsSectionView section={section} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
              >
                <SettingsList onSelect={setSection} />
                <div className="h-[env(safe-area-inset-bottom,0px)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

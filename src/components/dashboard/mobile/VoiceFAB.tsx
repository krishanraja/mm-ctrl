import * as React from "react"
import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Mic, Radio, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"
import { useGenerateBriefing } from "@/hooks/useBriefing"
import { useBriefingContext } from "@/contexts/BriefingContext"
import { GeneratingOverlay } from "@/components/briefing/GeneratingOverlay"

export function VoiceFAB() {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const didLongPress = useRef(false)
  const { generate, generating, phase } = useGenerateBriefing()
  const { setBriefing, setSheetOpen } = useBriefingContext()

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setShowMenu(true)
      haptics.light()
    }, 200)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!didLongPress.current) {
      navigate('/voice')
    }
  }, [navigate])

  const handleTalkToCtrl = () => {
    setShowMenu(false)
    navigate('/voice')
  }

  const handleBriefMe = async () => {
    setShowMenu(false)
    const briefingId = await generate()
    if (briefingId) {
      // Refetch will happen via useTodaysBriefing, then open sheet
      // For now, just open the sheet (it will show generating state)
      setSheetOpen(true)
    }
  }

  return (
    <>
      {/* Menu overlay */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 z-30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fixed right-4 z-40 bg-background border border-border rounded-xl shadow-lg overflow-hidden"
              style={{ bottom: "calc(80px + env(safe-area-inset-bottom))" }}
            >
              <button
                onClick={handleTalkToCtrl}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted transition-colors text-left"
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Talk to ctrl</span>
              </button>
              <div className="border-t border-border" />
              <button
                onClick={handleBriefMe}
                disabled={generating}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted transition-colors text-left"
              >
                <Radio className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">
                  {generating ? "Generating..." : "Brief me now"}
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed right-4 z-40 bottom-nav-clearance",
          "w-14 h-14 rounded-full",
          generating ? "bg-accent/80" : "bg-accent",
          "text-accent-foreground",
          "flex items-center justify-center",
          "shadow-lg shadow-accent/25",
          generating ? "" : "fab-pulse"
        )}
      >
        {generating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-6 h-6 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full"
          />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </motion.button>
    </>
  )
}

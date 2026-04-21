import { AnimatePresence, motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { useBriefingVoiceCommands } from '@/hooks/useBriefingVoiceCommands'

/**
 * Mic button for the briefing player. Tap to start listening for a single
 * playback command ("pause", "skip", "faster"...). Uses Web Speech API
 * directly so the ElevenLabs audio stream is untouched.
 */
export function BriefingVoiceButton() {
  const { supported, listening, lastCommand, start, stop } = useBriefingVoiceCommands()

  if (!supported) return null

  const handleClick = () => {
    haptics.light()
    if (listening) stop()
    else start()
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        aria-label={listening ? 'Stop listening' : 'Voice command'}
        aria-pressed={listening}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
          listening
            ? 'bg-accent text-accent-foreground shadow-md shadow-accent/30'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
        )}
      >
        {listening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </motion.button>
      <AnimatePresence>
        {lastCommand && (
          <motion.span
            key={lastCommand}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {lastCommand}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

// src/pages/Voice.tsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceRecorder } from "@/components/voice/VoiceRecorder"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth/AuthProvider"
import { useDevice } from "@/hooks/useDevice"

export default function Voice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isMobile } = useDevice()

  const handleTranscript = async (transcript: string) => {
    if (!user?.id) return

    try {
      await api.generateInsight(transcript, user.id)
      navigate('/dashboard')
    } catch (error) {
      console.error('Error generating insight:', error)
    }
  }

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header - Apple-level typography */}
      <div className="flex-shrink-0 p-6 sm:p-8 md:p-10 border-b border-border/40 flex items-center gap-4 sm:gap-6">
        <Button variant="ghost" size="icon-lg" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">Voice Entry</h1>
      </div>

      {/* Content - Apple-level spacing */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 sm:p-8 md:p-10">
        <div className="w-full max-w-4xl">
          <VoiceRecorder onTranscript={handleTranscript} />
        </div>
      </div>
    </div>
  )
}

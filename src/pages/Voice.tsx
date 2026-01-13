import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { VoiceRecorder } from "@/components/voice/VoiceRecorder"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"

export default function Voice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const handleTranscript = async (transcript: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to submit your response.",
        variant: "destructive",
      })
      return
    }

    try {
      await api.generateInsight(transcript, user.id)
      toast({
        title: "Success",
        description: "Your insight has been generated!",
      })
      navigate('/dashboard')
    } catch (error) {
      console.error('Error generating insight:', error)
      toast({
        title: "Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-4 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Voice Entry</h1>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <VoiceRecorder onTranscript={handleTranscript} />
        </motion.div>
      </main>
    </div>
  )
}

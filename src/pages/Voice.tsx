import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Home } from "lucide-react"
import { motion } from "framer-motion"
import { VoiceMemoryCapture } from "@/components/memory/VoiceMemoryCapture"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function Voice() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const handleComplete = async (transcript: string) => {
    toast({
      title: "Got it!",
      description: "We've learned more about you. Let's continue.",
    })
    
    // Navigate to dashboard if authenticated, otherwise to diagnostic
    if (user?.id) {
      navigate('/dashboard')
    } else {
      navigate('/diagnostic')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <img 
          src="/mindmaker-full-logo.png" 
          alt="Mindmaker" 
          className="h-6 w-auto"
        />
        <button
          onClick={() => navigate('/')}
          className="p-2 -mr-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <Home className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <VoiceMemoryCapture 
            onComplete={handleComplete}
            promptText="Tell me about your work and what's challenging you right now"
            placeholder="I'm a VP of Engineering at a Series B startup. My biggest challenge is..."
            showVerification={true}
          />
        </motion.div>
      </main>

      {/* Footer hint */}
      <footer className="flex-shrink-0 px-4 sm:px-6 py-4">
        <p className="text-xs text-center text-muted-foreground">
          We'll extract key facts and ask you to verify the important ones
        </p>
      </footer>
    </div>
  )
}

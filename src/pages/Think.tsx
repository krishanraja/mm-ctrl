import * as React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Lightbulb, Compass, MessageSquare, FileText, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDevice } from "@/hooks/useDevice"
import { useAuth } from "@/components/auth/AuthProvider"
import { DesktopSidebar } from "@/components/memory-web/DesktopSidebar"
import { BottomNav } from "@/components/memory-web/BottomNav"
import { useTeamInstructionsTool } from "@/components/team-instructions/TeamInstructionsCard"

interface ToolDef {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  route?: string
  action?: () => void
}

function ThinkContent() {
  const navigate = useNavigate()
  const { tool: teamInstructionsTool, sheet: teamInstructionsSheet } = useTeamInstructionsTool()

  const tools: ToolDef[] = [
    {
      id: 'decision',
      title: 'Decision Advisor',
      description: 'Think through a decision with full context',
      icon: Compass,
      color: 'from-blue-500 to-cyan-500',
      route: '/voice',
    },
    {
      id: 'meeting',
      title: 'Meeting Prep',
      description: 'Walk in prepared',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      route: '/voice',
    },
    teamInstructionsTool,
    {
      id: 'capture',
      title: 'Stream of Consciousness',
      description: 'Speak freely. It organizes itself.',
      icon: Brain,
      color: 'from-emerald-500 to-teal-500',
      route: '/dashboard',
    },
  ]

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Thinking Tools</h2>
          <p className="text-sm text-muted-foreground">
            Tools that think with your context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {tools.map((tool, i) => {
            const Icon = tool.icon
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => tool.action ? tool.action() : tool.route && navigate(tool.route)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-2xl",
                  "bg-foreground/5 hover:bg-foreground/10",
                  "transition-colors text-left group"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  "bg-gradient-to-br", tool.color
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {teamInstructionsSheet}
    </>
  )
}

export default function Think() {
  const { isMobile } = useDevice()

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopSidebar />
        <main className="ml-64 p-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-1">
                <Lightbulb className="h-6 w-6 text-amber-400" />
                <h1 className="text-2xl font-semibold">Think</h1>
              </div>
              <p className="text-muted-foreground">
                Tools that think with your context.
              </p>
            </motion.div>
            <ThinkContent />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <header className="flex-shrink-0 px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-semibold">Think</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Tools that think with your context
          </p>
        </motion.div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 flex flex-col justify-center">
        <ThinkContent />
      </main>

      <BottomNav />
    </div>
  )
}

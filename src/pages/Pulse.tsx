import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { StrategicPulse } from "@/components/pulse/StrategicPulse"
import { useDevice } from "@/hooks/useDevice"
import { Sidebar } from "@/components/dashboard/desktop/Sidebar"

export default function Pulse() {
  const navigate = useNavigate()
  const { isMobile } = useDevice()

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Strategic Pulse</h1>
            <StrategicPulse />
          </div>
        </main>
      </div>
    )
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
        <h1 className="text-lg font-semibold">Strategic Pulse</h1>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 pb-20 scrollbar-hide">
        <StrategicPulse />
      </main>
    </div>
  )
}

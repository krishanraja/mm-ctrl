// src/pages/Diagnostic.tsx
import * as React from "react"
import { useEffect } from "react"
import { DiagnosticFlow } from "@/components/diagnostic/DiagnosticFlow"

export default function Diagnostic() {
  // Light mode for diagnostic
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <DiagnosticFlow />
    </div>
  )
}

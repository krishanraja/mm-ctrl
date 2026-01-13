import * as React from "react"
import { DiagnosticFlow } from "@/components/diagnostic/DiagnosticFlow"

export default function Diagnostic() {
  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <DiagnosticFlow />
    </div>
  )
}

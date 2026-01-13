// src/components/auth/RequireAuth.tsx
import * as React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthProvider"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="h-screen-safe flex items-center justify-center">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }
  
  return <>{children}</>
}

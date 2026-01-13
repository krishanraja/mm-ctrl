// src/pages/Profile.tsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth/AuthProvider"
import { useDevice } from "@/hooks/useDevice"

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { isMobile } = useDevice()

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header - Apple-level typography */}
      <div className="flex-shrink-0 p-6 sm:p-8 md:p-10 border-b border-border/40 flex items-center gap-4 sm:gap-6">
        <Button variant="ghost" size="icon-lg" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">Profile</h1>
      </div>

      {/* Content - Apple-level spacing */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10">
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
              <p className="text-lg sm:text-xl font-medium">{user?.email}</p>
            </div>
            <Button variant="destructive" size="lg" onClick={signOut} className="w-full h-14 text-lg font-semibold">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

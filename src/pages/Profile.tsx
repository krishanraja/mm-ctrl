import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, User, LogOut, Moon, Sun } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/AuthProvider"
import { useTheme } from "@/components/ui/theme-provider"
import { useDevice } from "@/hooks/useDevice"
import { Sidebar } from "@/components/dashboard/desktop/Sidebar"

function ProfileContent() {
  const { user, signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="space-y-4">
      {/* Account Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Email
            </p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {resolvedTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="text-sm">Dark Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${resolvedTheme === 'dark' ? 'bg-accent' : 'bg-secondary'}
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${resolvedTheme === 'dark' ? 'left-6' : 'left-1'}
                `}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        onClick={signOut}
        className="w-full"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { isMobile } = useDevice()

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Profile</h1>
            <ProfileContent />
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
        <h1 className="text-lg font-semibold">Profile</h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden p-4 flex flex-col justify-center">
        <ProfileContent />
      </main>
    </div>
  )
}

// src/components/dashboard/desktop/Sidebar.tsx
import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, BarChart3, Target, Mic, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/landing/Logo"

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/pulse', icon: BarChart3, label: 'Pulse' },
  { path: '/today', icon: Target, label: 'Today' },
  { path: '/voice', icon: Mic, label: 'Voice' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="w-72 flex-shrink-0 bg-card border-r border-border/40 h-screen overflow-y-auto">
      <div className="p-8 sm:p-10 border-b border-border/40">
        <Logo />
      </div>
      <nav className="p-6 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 text-left font-semibold",
                isActive
                  ? "bg-accent/10 text-accent border-l-4 border-accent shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-base">{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="p-6 border-t border-border/40">
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 font-semibold"
        >
          <Settings className="h-6 w-6" />
          <span className="text-base">Settings</span>
        </button>
      </div>
    </aside>
  )
}

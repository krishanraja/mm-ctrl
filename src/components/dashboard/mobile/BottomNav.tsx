// src/components/dashboard/mobile/BottomNav.tsx
import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, BarChart3, Target, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/pulse', icon: BarChart3, label: 'Pulse' },
  { path: '/today', icon: Target, label: 'Today' },
  { path: '/voice', icon: Mic, label: 'Voice' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 pb-safe bg-background/98 backdrop-blur-xl border-t border-border/40 z-50 shadow-[0_-2px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-full px-2 sm:px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 flex-1 h-full rounded-2xl transition-all duration-200 min-h-[44px]",
                isActive
                  ? "text-accent bg-accent/10 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
              <span className="text-xs sm:text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

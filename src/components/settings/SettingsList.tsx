import { ChevronRight, User, UserCircle, Radio, Bell, Shield, Sliders, Zap, Scroll } from 'lucide-react'
import type { SettingsSection } from '@/contexts/SettingsSheetContext'

interface SettingsRow {
  section: SettingsSection
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const ROWS: SettingsRow[] = [
  { section: 'account', label: 'Account', description: 'Email, password, sign out', icon: User },
  { section: 'profile', label: 'Profile', description: 'Work context and background', icon: UserCircle },
  { section: 'briefing-interests', label: 'Interests', description: 'Beats, people, companies', icon: Scroll },
  { section: 'briefing', label: 'Briefing rules', description: 'Voice directives for your daily brief', icon: Radio },
  { section: 'notifications', label: 'Notifications', description: 'Delivery and quiet hours', icon: Bell },
  { section: 'privacy', label: 'Privacy & data', description: 'Export, retention, consent', icon: Shield },
  { section: 'preferences', label: 'Preferences', description: 'Theme, units, appearance', icon: Sliders },
  { section: 'edge-pro', label: 'Edge Pro', description: 'Subscription and billing', icon: Zap },
  { section: 'manifesto', label: 'Manifesto', description: 'Your operating principles', icon: Scroll },
]

interface SettingsListProps {
  onSelect: (section: SettingsSection) => void
}

export function SettingsList({ onSelect }: SettingsListProps) {
  return (
    <div className="divide-y divide-border">
      {ROWS.map(({ section, label, description, icon: Icon }) => (
        <button
          key={section}
          onClick={() => onSelect(section)}
          className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[56px] hover:bg-muted/50 active:bg-muted transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}

export const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  account: 'Account',
  profile: 'Profile',
  'briefing-interests': 'Interests',
  briefing: 'Briefing rules',
  notifications: 'Notifications',
  privacy: 'Privacy & data',
  preferences: 'Preferences',
  'edge-pro': 'Edge Pro',
  manifesto: 'Manifesto',
}

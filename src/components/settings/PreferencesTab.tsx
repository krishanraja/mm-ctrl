// src/components/settings/PreferencesTab.tsx
import { useTheme } from '@/components/ui/theme-provider'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function PreferencesTab() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Theme</label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Language & Region</h3>
        <p className="text-sm text-gray-400">Coming soon</p>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Accessibility</h3>
        <p className="text-sm text-gray-400">Accessibility settings coming soon</p>
      </div>
    </div>
  )
}

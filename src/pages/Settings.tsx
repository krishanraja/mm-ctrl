// src/pages/Settings.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountTab } from '@/components/settings/AccountTab'
import { WorkContextTab } from '@/components/settings/WorkContextTab'
import { PrivacyDataTab } from '@/components/settings/PrivacyDataTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { PreferencesTab } from '@/components/settings/PreferencesTab'
import { EdgeProTab } from '@/components/settings/EdgeProTab'
import { ManifestoTab } from '@/components/settings/ManifestoTab'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/memory-web/BottomNav'
import { DesktopSidebar } from '@/components/memory-web/DesktopSidebar'
import { AppHeader } from '@/components/memory-web/AppHeader'
import { useDevice } from '@/hooks/useDevice'

function SettingsTabs() {
  return (
    <Tabs defaultValue="work" className="flex-1 flex flex-col overflow-hidden min-h-0">
      <TabsList className="flex-shrink-0 flex flex-nowrap overflow-x-auto scrollbar-hide w-full bg-secondary px-1 gap-0.5">
        <TabsTrigger value="account" className="text-xs whitespace-nowrap flex-shrink-0">Account</TabsTrigger>
        <TabsTrigger value="work" className="text-xs whitespace-nowrap flex-shrink-0">Work</TabsTrigger>
        <TabsTrigger value="privacy" className="text-xs whitespace-nowrap flex-shrink-0">Privacy</TabsTrigger>
        <TabsTrigger value="notifications" className="text-xs whitespace-nowrap flex-shrink-0">Notifications</TabsTrigger>
        <TabsTrigger value="preferences" className="text-xs whitespace-nowrap flex-shrink-0">Preferences</TabsTrigger>
        <TabsTrigger value="edge-pro" className="text-xs whitespace-nowrap flex-shrink-0">Edge Pro</TabsTrigger>
        <TabsTrigger value="manifesto" className="text-xs whitespace-nowrap flex-shrink-0">Manifesto</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0 mt-4">
        <AccountTab />
      </TabsContent>

      <TabsContent value="work" className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0 mt-4">
        <WorkContextTab />
      </TabsContent>

      <TabsContent value="privacy" className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0 mt-4">
        <PrivacyDataTab />
      </TabsContent>

      <TabsContent value="notifications" className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0 mt-4">
        <NotificationsTab />
      </TabsContent>

      <TabsContent value="preferences" className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0 mt-4">
        <PreferencesTab />
      </TabsContent>

      <TabsContent value="edge-pro" className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0 mt-4">
        <EdgeProTab />
      </TabsContent>

      <TabsContent value="manifesto" className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0 mt-4">
        <ManifestoTab />
      </TabsContent>
    </Tabs>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { isMobile } = useDevice()

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopSidebar />
        <main className="ml-64 min-h-screen">
          <div className="max-w-3xl mx-auto px-8 py-8">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <SettingsTabs />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <AppHeader />

      <div className="flex-shrink-0 px-4 pb-2">
        <h1 className="text-base font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-4">
        <SettingsTabs />
      </div>

      <BottomNav />
    </div>
  )
}

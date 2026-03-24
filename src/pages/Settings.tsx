// src/pages/Settings.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountTab } from '@/components/settings/AccountTab'
import { WorkContextTab } from '@/components/settings/WorkContextTab'
import { PrivacyDataTab } from '@/components/settings/PrivacyDataTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { PreferencesTab } from '@/components/settings/PreferencesTab'
import { EdgeProTab } from '@/components/settings/EdgeProTab'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-4">
        <Tabs defaultValue="work" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="flex-shrink-0 flex overflow-x-auto scrollbar-hide w-full bg-secondary">
            <TabsTrigger value="account" className="text-xs whitespace-nowrap">Account</TabsTrigger>
            <TabsTrigger value="work" className="text-xs whitespace-nowrap">Work</TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs whitespace-nowrap">Privacy</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs whitespace-nowrap">Notifs</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs whitespace-nowrap">Prefs</TabsTrigger>
            <TabsTrigger value="edge-pro" className="text-xs whitespace-nowrap">Edge Pro</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  )
}

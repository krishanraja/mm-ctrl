// src/pages/Settings.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountTab } from '@/components/settings/AccountTab'
import { WorkContextTab } from '@/components/settings/WorkContextTab'
import { PrivacyDataTab } from '@/components/settings/PrivacyDataTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { PreferencesTab } from '@/components/settings/PreferencesTab'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="work" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-gray-900">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="work">Work Context</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountTab />
          </TabsContent>

          <TabsContent value="work">
            <WorkContextTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyDataTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

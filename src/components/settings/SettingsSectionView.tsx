import { AccountTab } from './AccountTab'
import { WorkContextTab } from './WorkContextTab'
import { PrivacyDataTab } from './PrivacyDataTab'
import { NotificationsTab } from './NotificationsTab'
import { PreferencesTab } from './PreferencesTab'
import { EdgeProTab } from './EdgeProTab'
import { ManifestoTab } from './ManifestoTab'
import { BriefingDirectivesTab } from './BriefingDirectivesTab'
import { BriefingInterestsTab } from './BriefingInterestsTab'
import type { SettingsSection } from '@/contexts/SettingsSheetContext'

interface SettingsSectionViewProps {
  section: SettingsSection
}

export function SettingsSectionView({ section }: SettingsSectionViewProps) {
  switch (section) {
    case 'account':
      return <AccountTab />
    case 'profile':
      return <WorkContextTab />
    case 'briefing-interests':
      return <BriefingInterestsTab />
    case 'briefing':
      return <BriefingDirectivesTab />
    case 'notifications':
      return <NotificationsTab />
    case 'privacy':
      return <PrivacyDataTab />
    case 'preferences':
      return <PreferencesTab />
    case 'edge-pro':
      return <EdgeProTab />
    case 'manifesto':
      return <ManifestoTab />
    default:
      return null
  }
}

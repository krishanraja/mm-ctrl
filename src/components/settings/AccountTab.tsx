// src/components/settings/AccountTab.tsx
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function AccountTab() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div className="pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-2">Profile photo coming soon</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Security</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Password</label>
            <p className="text-gray-500 text-sm mb-2">••••••••</p>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

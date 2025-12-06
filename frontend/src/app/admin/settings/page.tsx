'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { 
  Settings, 
  Save, 
  Globe, 
  Bell, 
  Shield,
  Mail,
  Database,
  Cloud,
  Server,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'

const SETTINGS_CATEGORIES = [
  { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
  { id: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Server className="h-4 w-4" /> },
]

export default function AdminSettingsPage() {
  const [activeCategory, setActiveCategory] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'UTOPIA Real Estate',
    siteDescription: 'Find your dream property in Ethiopia',
    defaultCurrency: 'ETB',
    defaultLanguage: 'en',
    timezone: 'Africa/Addis_Ababa',
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    defaultFromEmail: 'noreply@utopia-realestate.com',
    
    // Notification Settings
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enablePushNotifications: true,
    notifyNewUsers: true,
    notifyNewProperties: true,
    
    // Security Settings
    requireEmailVerification: true,
    requirePhoneVerification: false,
    enableTwoFactorAuth: false,
    sessionTimeout: '24',
    maxLoginAttempts: '5',
    
    // Maintenance Settings
    maintenanceMode: false,
    allowUserRegistration: true,
    allowPropertyListing: true,
    cacheEnabled: true,
  })

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearCache = () => {
    toast.success('Cache cleared successfully')
  }

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      toast.success('Settings reset to defaults')
    }
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Site Name</label>
          <Input
            value={settings.siteName}
            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Default Currency</label>
          <Select
            placeholder="Select currency"
            options={[
              { value: 'ETB', label: 'ETB - Ethiopian Birr' },
              { value: 'USD', label: 'USD - US Dollar' },
            ]}
            value={settings.defaultCurrency}
            onValueChange={(value) => setSettings({...settings, defaultCurrency: value})}
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Site Description</label>
        <Input
          value={settings.siteDescription}
          onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Default Language</label>
          <Select
            placeholder="Select language"
            options={[
              { value: 'en', label: 'English' },
              { value: 'am', label: 'Amharic' },
            ]}
            value={settings.defaultLanguage}
            onValueChange={(value) => setSettings({...settings, defaultLanguage: value})}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Timezone</label>
          <Select
            placeholder="Select timezone"
            options={[
              { value: 'Africa/Addis_Ababa', label: 'Addis Ababa (GMT+3)' },
              { value: 'UTC', label: 'UTC' },
            ]}
            value={settings.timezone}
            onValueChange={(value) => setSettings({...settings, timezone: value})}
          />
        </div>
      </div>
    </div>
  )

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">SMTP Host</label>
          <Input
            value={settings.smtpHost}
            onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">SMTP Port</label>
          <Input
            value={settings.smtpPort}
            onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
          />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">SMTP Username</label>
          <Input
            type="email"
            value={settings.smtpUsername}
            onChange={(e) => setSettings({...settings, smtpUsername: e.target.value})}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">SMTP Password</label>
          <Input
            type="password"
            value={settings.smtpPassword}
            onChange={(e) => setSettings({...settings, smtpPassword: e.target.value})}
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Default From Email</label>
        <Input
          type="email"
          value={settings.defaultFromEmail}
          onChange={(e) => setSettings({...settings, defaultFromEmail: e.target.value})}
        />
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">Send email notifications to users</p>
          </div>
          <Switch
            checked={settings.enableEmailNotifications}
            onCheckedChange={(checked) => setSettings({...settings, enableEmailNotifications: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">SMS Notifications</p>
            <p className="text-sm text-muted-foreground">Send SMS notifications to users</p>
          </div>
          <Switch
            checked={settings.enableSMSNotifications}
            onCheckedChange={(checked) => setSettings({...settings, enableSMSNotifications: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-sm text-muted-foreground">Send push notifications to users</p>
          </div>
          <Switch
            checked={settings.enablePushNotifications}
            onCheckedChange={(checked) => setSettings({...settings, enablePushNotifications: checked})}
          />
        </div>
      </div>
      <div className="border-t pt-6">
        <h3 className="mb-4 font-medium">Notification Triggers</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New User Registration</p>
              <p className="text-sm text-muted-foreground">Notify admins when new users register</p>
            </div>
            <Switch
              checked={settings.notifyNewUsers}
              onCheckedChange={(checked) => setSettings({...settings, notifyNewUsers: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Property Listing</p>
              <p className="text-sm text-muted-foreground">Notify admins when new properties are listed</p>
            </div>
            <Switch
              checked={settings.notifyNewProperties}
              onCheckedChange={(checked) => setSettings({...settings, notifyNewProperties: checked})}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Require Email Verification</p>
            <p className="text-sm text-muted-foreground">Users must verify their email before using the platform</p>
          </div>
          <Switch
            checked={settings.requireEmailVerification}
            onCheckedChange={(checked) => setSettings({...settings, requireEmailVerification: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Require Phone Verification</p>
            <p className="text-sm text-muted-foreground">Users must verify their phone number</p>
          </div>
          <Switch
            checked={settings.requirePhoneVerification}
            onCheckedChange={(checked) => setSettings({...settings, requirePhoneVerification: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
          </div>
          <Switch
            checked={settings.enableTwoFactorAuth}
            onCheckedChange={(checked) => setSettings({...settings, enableTwoFactorAuth: checked})}
          />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Session Timeout (hours)</label>
          <Input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Max Login Attempts</label>
          <Input
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => setSettings({...settings, maxLoginAttempts: e.target.value})}
          />
        </div>
      </div>
    </div>
  )

  const renderMaintenanceSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Maintenance Mode</p>
            <p className="text-sm text-muted-foreground">Put the site in maintenance mode</p>
          </div>
          <Switch
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
          />
        </div>
        {settings.maintenanceMode && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                Maintenance Mode Active
              </p>
            </div>
            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
              The site is in maintenance mode. Regular users will see a maintenance page.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Allow User Registration</p>
            <p className="text-sm text-muted-foreground">Allow new users to register</p>
          </div>
          <Switch
            checked={settings.allowUserRegistration}
            onCheckedChange={(checked) => setSettings({...settings, allowUserRegistration: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Allow Property Listing</p>
            <p className="text-sm text-muted-foreground">Allow users to list new properties</p>
          </div>
          <Switch
            checked={settings.allowPropertyListing}
            onCheckedChange={(checked) => setSettings({...settings, allowPropertyListing: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Cache Enabled</p>
            <p className="text-sm text-muted-foreground">Enable system caching for better performance</p>
          </div>
          <Switch
            checked={settings.cacheEnabled}
            onCheckedChange={(checked) => setSettings({...settings, cacheEnabled: checked})}
          />
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="mb-4 font-medium">System Actions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Clear Cache</p>
                  <p className="text-sm text-muted-foreground">Clear all cached data</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={handleClearCache}
              >
                Clear Cache
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                  <RefreshCw className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Reset Settings</p>
                  <p className="text-sm text-muted-foreground">Reset all settings to defaults</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={handleResetSettings}
              >
                Reset Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderSettingsContent = () => {
    switch (activeCategory) {
      case 'general':
        return renderGeneralSettings()
      case 'email':
        return renderEmailSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'security':
        return renderSecuritySettings()
      case 'maintenance':
        return renderMaintenanceSettings()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <nav className="space-y-1 p-4">
              {SETTINGS_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.icon}
                  {category.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {SETTINGS_CATEGORIES.find(c => c.id === activeCategory)?.icon}
              {SETTINGS_CATEGORIES.find(c => c.id === activeCategory)?.label} Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderSettingsContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
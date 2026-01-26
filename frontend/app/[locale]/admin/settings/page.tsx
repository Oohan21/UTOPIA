// src/app/admin/settings/page.tsx - FIXED
'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Shield, Mail, Globe, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Default settings to use while loading or if API fails
const defaultSettings = {
  site_name: 'UTOPIA Real Estate',
  site_description: 'Ethiopian Real Estate Platform',
  contact_email: 'admin@utopia.com',
  contact_phone: '+251911223344',
  currency: 'ETB',
  default_language: 'en',
  maintenance_mode: false,
  registration_enabled: true,
  property_auto_approval: false,
  max_properties_per_user: 10,
  property_expiry_days: 90,
  commission_rate: 2.5,
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSystemSettings();
      setSettings({ ...defaultSettings, ...data });
    } catch (err) {
      setError('Failed to load settings. Using default values.');
      console.error(err);
      // Keep using default settings
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminApi.updateSystemSettings(settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchSettings} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.site_name || ''}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input
                    id="currency"
                    value={settings.currency || ''}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Site Description</Label>
                <Textarea
                  id="description"
                  value={settings.site_description || ''}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contact_phone || ''}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="registrationEnabled">Registration Enabled</Label>
                  <p className="text-sm text-gray-500">
                    Allow new users to register on the platform
                  </p>
                </div>
                <Switch
                  id="registrationEnabled"
                  checked={settings.registration_enabled || false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, registration_enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoApproval">Property Auto-Approval</Label>
                  <p className="text-sm text-gray-500">
                    Automatically approve new property listings
                  </p>
                </div>
                <Switch
                  id="autoApproval"
                  checked={settings.property_auto_approval || false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, property_auto_approval: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxProperties">Max Properties Per User</Label>
                <Input
                  id="maxProperties"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.max_properties_per_user || 10}
                  onChange={(e) => setSettings({
                    ...settings,
                    max_properties_per_user: parseInt(e.target.value) || 10
                  })}
                />
              </div>
              <div>
                <Label htmlFor="propertyExpiry">Property Expiry (Days)</Label>
                <Input
                  id="propertyExpiry"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.property_expiry_days || 90}
                  onChange={(e) => setSettings({
                    ...settings,
                    property_expiry_days: parseInt(e.target.value) || 90
                  })}
                />
              </div>
              <div>
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.commission_rate || 2.5}
                  onChange={(e) => setSettings({
                    ...settings,
                    commission_rate: parseFloat(e.target.value) || 2.5
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">
                    Put the site in maintenance mode (only admins can access)
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenance_mode || false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenance_mode: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.session_timeout || 30}
                  onChange={(e) => setSettings({
                    ...settings,
                    session_timeout: parseInt(e.target.value) || 30
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  id="twoFactor"
                  checked={settings.two_factor_enabled || false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, two_factor_enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                  <p className="text-sm text-gray-500">
                    Restrict admin access to specific IPs
                  </p>
                </div>
                <Switch
                  id="ipWhitelist"
                  checked={settings.ip_whitelist_enabled || false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, ip_whitelist_enabled: checked })
                  }
                />
              </div>
              {settings.ip_whitelist_enabled && (
                <div>
                  <Label htmlFor="allowedIPs">Allowed IP Addresses (comma-separated)</Label>
                  <Textarea
                    id="allowedIPs"
                    value={settings.allowed_ips || ''}
                    onChange={(e) => setSettings({ ...settings, allowed_ips: e.target.value })}
                    placeholder="192.168.1.1, 10.0.0.1"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtp_host || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtp_port || 587}
                    onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPass">SMTP Password</Label>
                  <Input
                    id="smtpPass"
                    type="password"
                    value={settings.smtp_pass || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                    placeholder="Your SMTP password"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useTLS">Use TLS</Label>
                  <p className="text-sm text-gray-500">
                    Enable TLS encryption for email
                  </p>
                </div>
                <Switch
                  id="useTLS"
                  checked={settings.smtp_use_tls || true}
                  onCheckedChange={(checked) => setSettings({ ...settings, smtp_use_tls: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Send email notifications to users
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.email_notifications_enabled || true}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_notifications_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Cache Management</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Clear cached data to free up memory
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await adminApi.clearCache();
                        toast.success('Cache cleared successfully');
                      } catch (err) {
                        toast.error('Failed to clear cache');
                      }
                    }}
                  >
                    Clear Cache
                  </Button>
                </div>

                <div>
                  <Label>Database Backup</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Download a backup of the database
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const blob = await adminApi.backupDatabase();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `backup-${new Date().toISOString().split('T')[0]}.sql`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        toast.success('Backup downloaded');
                      } catch (err) {
                        toast.error('Failed to download backup');
                      }
                    }}
                  >
                    Download Backup
                  </Button>
                </div>

                <div>
                  <Label>System Health Check</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Run diagnostic tests on the system
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const result = await adminApi.runSystemCheck();
                        toast.success('System check completed');
                        console.log('System check result:', result);
                      } catch (err) {
                        toast.error('System check failed');
                      }
                    }}
                  >
                    Run System Check
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label className="text-red-600">Danger Zone</Label>
                <p className="text-sm text-gray-500 mb-4">
                  These actions are irreversible
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure? This will delete all test data.')) {
                      // Handle data purge
                      toast.success('Test data purged');
                    }
                  }}
                >
                  Purge Test Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

  );
};

export default AdminSettings;
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Save, Database, Shield, Bell, Globe, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteName: 'IsoDisplay',
    siteUrl: '',
    adminEmail: '',
    timezone: 'UTC',
    defaultPlaylistDuration: 30,
    maintenanceMode: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!user.permissions?.includes('SYSTEM_SETTINGS')) {
      router.push('/unauthorized');
      return;
    }
    // TODO: Fetch settings
    setLoading(false);
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  const handleSave = async () => {
    // TODO: Save settings
    console.log('Saving settings:', settings);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
          <p className="text-white/70">Configure global system settings and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Globe className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h2 className="text-xl font-semibold text-white">General Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName" className="text-white/70">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="siteUrl" className="text-white/70">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="adminEmail" className="text-white/70">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone" className="text-white/70">Timezone</Label>
                  <Input
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Palette className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h2 className="text-xl font-semibold text-white">Display Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultDuration" className="text-white/70">
                    Default Content Duration (seconds)
                  </Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={settings.defaultPlaylistDuration}
                    onChange={(e) => setSettings({ ...settings, defaultPlaylistDuration: parseInt(e.target.value) })}
                    className="mt-1 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Shield className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h2 className="text-xl font-semibold text-white">Security Settings</h2>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Maintenance Mode</h3>
                  <p className="text-white/50 text-sm">Enable to show maintenance message to users</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-brand-orange-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Database className="w-5 h-5 text-brand-orange-500 mr-2" />
                <h2 className="text-xl font-semibold text-white">Database</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">Backup Database</h3>
                    <p className="text-white/50 text-sm">Create a backup of the database</p>
                  </div>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Create Backup
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">Clear Cache</h3>
                    <p className="text-white/50 text-sm">Clear all cached data</p>
                  </div>
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Clear Cache
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
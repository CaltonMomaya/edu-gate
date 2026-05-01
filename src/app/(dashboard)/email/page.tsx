'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Mail, Save, Loader2 } from 'lucide-react';

export default function EmailSettingsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [settings, setSettings] = useState({
    host: '',
    port: '587',
    secure: false,
    user: '',
    password: '',
    from: '',
    enabled: false,
  });

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: school } = await supabase.from('schools').select('email_settings').eq('id', userData.school_id).single();
    if (school?.email_settings) {
      setSettings(prev => ({ ...prev, ...school.email_settings }));
    }
  }

  async function saveSettings() {
    setIsLoading(true);
    const { error } = await supabase.from('schools').update({
      email_settings: settings,
    }).eq('id', schoolId);
    setIsLoading(false);
    if (error) toast.error('Failed to save');
    else toast.success('Email settings saved!');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Email Settings</h1><p className="text-slate-500">Configure SMTP for outgoing emails</p></div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><Mail className="h-5 w-5 inline mr-2 text-blue-600" />SMTP Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>SMTP Host</Label><Input value={settings.host} onChange={e => setSettings({ ...settings, host: e.target.value })} placeholder="smtp.gmail.com" /></div>
            <div className="space-y-2"><Label>Port</Label><Input value={settings.port} onChange={e => setSettings({ ...settings, port: e.target.value })} placeholder="587" /></div>
          </div>
          <div className="flex items-center space-x-2"><Switch checked={settings.secure} onCheckedChange={v => setSettings({ ...settings, secure: v })} /><Label>Use SSL/TLS</Label></div>
          <div className="space-y-2"><Label>Email User</Label><Input value={settings.user} onChange={e => setSettings({ ...settings, user: e.target.value })} placeholder="noreply@school.com" /></div>
          <div className="space-y-2"><Label>Email Password</Label><Input type="password" value={settings.password} onChange={e => setSettings({ ...settings, password: e.target.value })} placeholder="••••••••" /></div>
          <div className="space-y-2"><Label>From Address</Label><Input value={settings.from} onChange={e => setSettings({ ...settings, from: e.target.value })} placeholder="noreply@school.com" /></div>
          <div className="flex items-center space-x-2"><Switch checked={settings.enabled} onCheckedChange={v => setSettings({ ...settings, enabled: v })} /><Label>Enable Email Notifications</Label></div>
          <Button onClick={saveSettings} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

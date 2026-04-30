'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bell, Mail, MessageSquare, Save, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [prefs, setPrefs] = useState({
    paymentEmail: true, paymentSms: false,
    leaveEmail: true, leaveSms: true,
    overdueEmail: true, overdueSms: true,
    examEmail: true, examSms: false,
  });

  useEffect(() => { loadPrefs(); }, []);

  async function loadPrefs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: school } = await supabase.from('schools').select('notification_prefs').eq('id', userData.school_id).single();
    if (school?.notification_prefs && Object.keys(school.notification_prefs).length > 0) {
      setPrefs(prev => ({ ...prev, ...school.notification_prefs }));
    }
  }

  async function savePreferences() {
    setIsLoading(true);
    const { error } = await supabase.from('schools').update({
      notification_prefs: prefs,
    }).eq('id', schoolId);
    setIsLoading(false);
    
    if (error) toast.error('Failed to save');
    else toast.success('Preferences saved! Changes take effect immediately.');
  }

  const toggle = (key: string) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Notification Preferences</h1><p className="text-slate-500">Control when and how you receive alerts</p></div>
      
      {[
        { title: 'Payment Alerts', desc: 'When a payment is recorded', key: 'payment' },
        { title: 'Leave Alerts', desc: 'When a student is released', key: 'leave' },
        { title: 'Overdue Alerts', desc: 'Books, equipment, fee arrears', key: 'overdue' },
        { title: 'Exam Alerts', desc: 'When results are published', key: 'exam' },
      ].map(section => (
        <Card key={section.key} className="border-0 shadow-sm">
          <CardHeader><CardTitle>{section.title}</CardTitle><CardDescription>{section.desc}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /><span>Email</span></div>
              <Switch checked={prefs[`${section.key}Email` as keyof typeof prefs]} onCheckedChange={() => toggle(`${section.key}Email`)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-emerald-600" /><span>SMS</span></div>
              <Switch checked={prefs[`${section.key}Sms` as keyof typeof prefs]} onCheckedChange={() => toggle(`${section.key}Sms`)} />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={savePreferences} className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Preferences
      </Button>
    </div>
  );
}

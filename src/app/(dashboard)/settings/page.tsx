'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Building2, Mail, MapPin, Hash, Save } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [school, setSchool] = useState({
    name: '',
    email: '',
    po_box: '',
    school_code: '',
    phone: '',
  });
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    loadSchool();
  }, []);

  async function loadSchool() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data } = await supabase
      .from('schools').select('*').eq('id', userData.school_id).single();
    if (data) {
      setSchool({
        name: data.name || '',
        email: data.email || '',
        po_box: data.po_box || '',
        school_code: data.school_code || '',
        phone: data.phone || '',
      });
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('schools')
      .update({
        name: school.name,
        email: school.email,
        po_box: school.po_box,
        phone: school.phone,
      })
      .eq('id', schoolId);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Settings saved!');
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">School Settings</h1>
        <p className="text-slate-500 mt-1">Update your school information</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>School Profile</CardTitle>
          <CardDescription>This information appears on leave sheets and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="space-y-2">
              <Label><Building2 className="h-3 w-3 inline mr-1" /> School Name</Label>
              <Input value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><Mail className="h-3 w-3 inline mr-1" /> Email</Label>
                <Input value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={school.phone} onChange={(e) => setSchool({ ...school, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><MapPin className="h-3 w-3 inline mr-1" /> P.O Box</Label>
                <Input value={school.po_box} onChange={(e) => setSchool({ ...school, po_box: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label><Hash className="h-3 w-3 inline mr-1" /> School Code</Label>
                <Input value={school.school_code} disabled className="bg-slate-50" />
                <p className="text-xs text-slate-400">School code cannot be changed</p>
              </div>
            </div>
            <Separator />
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-emerald-600">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

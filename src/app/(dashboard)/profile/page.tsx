'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Shield, Lock, Save, KeyRound, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState({ full_name: '', email: '', role: '', school: '' });
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('*, schools(name)').eq('id', user.id).single();
    if (userData) {
      setProfile({
        full_name: userData.full_name || '',
        email: userData.email || '',
        role: userData.role || '',
        school: userData.schools?.name || '',
      });
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault(); setIsSaving(true);
    const { error } = await supabase.from('users').update({ full_name: profile.full_name }).eq('email', profile.email);
    setIsSaving(false);
    if (error) toast.error('Failed to update');
    else toast.success('Profile updated!');
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    if (passwords.newPass.length < 8) { toast.error('Minimum 8 characters'); return; }
    setIsChanging(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    setIsChanging(false);
    if (error) toast.error(error.message);
    else { toast.success('Password changed!'); setPasswords({ newPass: '', confirm: '' }); }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">My Profile</h1><p className="text-slate-500">Manage your account</p></div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><User className="h-5 w-5 inline text-blue-600 mr-2" />Personal Info</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} /></div>
            <div className="space-y-2"><Label><Mail className="h-3 w-3 inline mr-1" />Email</Label><Input value={profile.email} disabled className="bg-slate-50" /></div>
            <div className="flex gap-4">
              <Badge className="text-sm px-3 py-1 capitalize"><Shield className="h-3 w-3 mr-1" />{profile.role.replace('_', ' ')}</Badge>
              <span className="text-sm text-slate-500">{profile.school}</span>
            </div>
            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><Lock className="h-5 w-5 inline text-amber-600 mr-2" />Change Password</CardTitle><CardDescription>Enter new password</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2"><Label>New Password</Label><Input type="password" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} placeholder="Min. 8 characters" /></div>
            <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} /></div>
            <Button type="submit" variant="outline" disabled={isChanging}>{isChanging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}Change Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

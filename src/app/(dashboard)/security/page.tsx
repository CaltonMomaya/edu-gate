'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Shield, Key, Lock, Clock, AlertTriangle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function SecurityPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => { loadSession(); }, []);

  async function loadSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSessionInfo({
        email: session.user.email,
        lastSignIn: session.user.last_sign_in_at,
        createdAt: session.user.created_at,
        provider: session.user.app_metadata?.provider || 'email',
      });
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    }
  }

  async function handleLogoutAll() {
    if (!confirm('Sign out from all devices? You will need to log in again.')) return;
    setIsLoading(true);
    await supabase.auth.signOut({ scope: 'global' });
    toast.success('Signed out from all devices');
    window.location.href = '/login';
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Security</h1>
        <p className="text-slate-500">Manage your account security and sessions</p>
      </div>

      {/* Session Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-600" />Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium">{sessionInfo.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Login Provider</span><Badge variant="outline" className="capitalize">{sessionInfo.provider}</Badge></div>
          <div className="flex justify-between"><span className="text-slate-500">Last Sign In</span><span className="text-sm">{sessionInfo.lastSignIn ? new Date(sessionInfo.lastSignIn).toLocaleString() : 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Account Created</span><span className="text-sm">{sessionInfo.createdAt ? new Date(sessionInfo.createdAt).toLocaleDateString() : 'N/A'}</span></div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-amber-600" />Change Password</CardTitle>
          <CardDescription>Use a strong password you haven't used before</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2 text-slate-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-purple-600" />Session Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">Sign out from all devices and browsers where you're currently logged in.</p>
          <Button variant="outline" className="text-red-600 border-red-200" onClick={handleLogoutAll} disabled={isLoading}>
            <AlertTriangle className="mr-2 h-4 w-4" />Sign Out All Devices
          </Button>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="border-0 shadow-sm bg-blue-50">
        <CardContent className="p-4 space-y-2 text-sm text-slate-600">
          <p className="font-medium text-blue-700">🔒 Security Tips</p>
          <p><CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />Use a strong password with letters, numbers, and symbols</p>
          <p><CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />Never share your login credentials with anyone</p>
          <p><CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />Sign out when using shared devices</p>
          <p><CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />Your data is encrypted and isolated per school</p>
        </CardContent>
      </Card>
    </div>
  );
}

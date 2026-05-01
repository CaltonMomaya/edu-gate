'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Shield, Key, Globe, Clock, History, Lock, 
  Smartphone, CheckCircle, XCircle, Loader2 
} from 'lucide-react';
import * as OTPAuth from 'otpauth';

export default function AdvancedSecurityPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    // Load 2FA status
    const { data: security } = await supabase.from('school_security').select('*').eq('school_id', userData.school_id).single();
    if (security) {
      setTwoFactorEnabled(security.two_factor_enabled || false);
      setTwoFactorSecret(security.two_factor_secret || '');
      setIpWhitelist(security.ip_whitelist || []);
    }

    // Load sessions (mock data for demo)
    setSessions([
      { id: '1', device: 'Chrome - Windows', ip: '192.168.1.1', lastActive: new Date().toISOString(), current: true },
      { id: '2', device: 'Safari - iPhone', ip: '192.168.1.2', lastActive: new Date(Date.now() - 86400000).toISOString(), current: false },
    ]);

    // Load login history (mock data for demo)
    setLoginHistory([
      { timestamp: new Date().toISOString(), ip: '192.168.1.1', status: 'success', location: 'Nairobi, KE' },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), ip: '192.168.1.2', status: 'failed', location: 'Mombasa, KE' },
    ]);
  }

  async function setupTwoFactor() {
    if (twoFactorEnabled) {
      toast.info('2FA is already enabled');
      return;
    }
    setIsLoading(true);
    const secret = new OTPAuth.Secret({ size: 20 });
    const secretStr = secret.base32;
    setTwoFactorSecret(secretStr);
    await supabase.from('school_security').upsert({
      school_id: schoolId,
      two_factor_secret: secretStr,
      two_factor_enabled: false,
    }, { onConflict: 'school_id' });
    toast.success('2FA setup initiated! Check the secret below.');
    setIsLoading(false);
  }

  async function enableTwoFactor() {
    if (!twoFactorCode || !twoFactorSecret) {
      toast.error('Enter the verification code');
      return;
    }
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'EDU GATE',
        label: 'School',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(twoFactorSecret),
      });
      const isValid = totp.validate({ token: twoFactorCode });
      if (!isValid) {
        toast.error('Invalid code. Try again.');
        return;
      }
      await supabase.from('school_security').upsert({
        school_id: schoolId,
        two_factor_enabled: true,
        two_factor_secret: twoFactorSecret,
      }, { onConflict: 'school_id' });
      setTwoFactorEnabled(true);
      toast.success('2FA enabled successfully!');
    } catch (error) {
      toast.error('Failed to enable 2FA');
    }
  }

  async function disableTwoFactor() {
    if (!confirm('Disable 2FA? This reduces security.')) return;
    await supabase.from('school_security').upsert({
      school_id: schoolId,
      two_factor_enabled: false,
      two_factor_secret: '',
    }, { onConflict: 'school_id' });
    setTwoFactorEnabled(false);
    setTwoFactorSecret('');
    toast.success('2FA disabled');
  }

  async function addIpToWhitelist() {
    if (!newIp) { toast.error('Enter IP address'); return; }
    const updated = [...ipWhitelist, newIp];
    await supabase.from('school_security').upsert({
      school_id: schoolId,
      ip_whitelist: updated,
    }, { onConflict: 'school_id' });
    setIpWhitelist(updated);
    setNewIp('');
    toast.success(`IP ${newIp} whitelisted`);
  }

  async function removeIpFromWhitelist(ip: string) {
    const updated = ipWhitelist.filter(i => i !== ip);
    await supabase.from('school_security').upsert({
      school_id: schoolId,
      ip_whitelist: updated,
    }, { onConflict: 'school_id' });
    setIpWhitelist(updated);
    toast.success(`IP ${ip} removed`);
  }

  async function revokeSession(sessionId: string) {
    if (!confirm('Revoke this session?')) return;
    setSessions(sessions.filter(s => s.id !== sessionId));
    toast.success('Session revoked');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" /> Advanced Security
        </h1>
        <p className="text-slate-500">Manage 2FA, IP whitelist, and sessions</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 2FA Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-600" /> Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              {twoFactorEnabled 
                ? '2FA is enabled. Your account is protected with an additional verification step.'
                : 'Add an extra layer of security to your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status</p>
                <Badge className={twoFactorEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                  {twoFactorEnabled ? 'Enabled ✅' : 'Disabled ❌'}
                </Badge>
              </div>
              {!twoFactorEnabled ? (
                <Button onClick={setupTwoFactor} disabled={isLoading}>Setup 2FA</Button>
              ) : (
                <Button variant="outline" onClick={disableTwoFactor}>Disable 2FA</Button>
              )}
            </div>

            {twoFactorSecret && !twoFactorEnabled && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-2">Secret key (use with authenticator app):</p>
                <div className="flex justify-center p-4 bg-white rounded border">
                  <p className="text-xs font-mono break-all">{twoFactorSecret}</p>
                </div>
                <p className="text-xs text-slate-500 mt-2">Enter the verification code to enable 2FA:</p>
                <div className="flex gap-2 mt-2">
                  <Input value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value)} placeholder="000000" maxLength={6} className="text-center text-2xl" />
                  <Button onClick={enableTwoFactor}>Enable</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IP Whitelist Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" /> IP Whitelist
            </CardTitle>
            <CardDescription>Only allow access from these IP addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.1" />
              <Button onClick={addIpToWhitelist}>Add IP</Button>
            </div>
            <div className="space-y-2">
              {ipWhitelist.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">No IPs whitelisted</p>
              ) : (
                ipWhitelist.map(ip => (
                  <div key={ip} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm">{ip}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeIpFromWhitelist(ip)} className="text-red-500">Remove</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Management Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" /> Active Sessions
            </CardTitle>
            <CardDescription>Manage devices where you're logged in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No active sessions</p>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{s.device}</p>
                    <p className="text-xs text-slate-500">{s.ip} · Last active: {new Date(s.lastActive).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.current ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Current</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => revokeSession(s.id)} className="text-red-500">Revoke</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Login History Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-600" /> Login History
            </CardTitle>
            <CardDescription>Recent login attempts to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loginHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No login history</p>
              ) : (
                loginHistory.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{log.location}</span>
                      <span className="text-xs text-slate-500">{log.ip}</span>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    <Badge className={log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                      {log.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

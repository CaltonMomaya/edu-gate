'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Shield, Users, School, CreditCard, MessageSquare, Loader2, Lock, 
  CheckCircle, XCircle, AlertTriangle, Bell, Send, Plus, Calendar,
  DollarSign, TrendingUp, Clock, Database, Settings, RefreshCw, Menu, X
} from 'lucide-react';

export default function AdminPage() {
  const supabase = createClient();
  const [code, setCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real data
  const [stats, setStats] = useState({
    total: 0, active: 0, trial: 0, suspended: 0, dormant: 0,
    totalSms: 0, totalStudents: 0, totalTeachers: 0, revenue: 0
  });
  const [schools, setSchools] = useState([]);
  const [dueSchools, setDueSchools] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('admin_auth');
    if (saved === '40151982Nairobi') {
      setAuthenticated(true);
      loadRealData();
    }
    setIsLoading(false);
  }, []);

  async function handleLogin() {
    if (code === '40151982Nairobi') {
      setAuthenticated(true);
      localStorage.setItem('admin_auth', code);
      await loadRealData();
      toast.success('Welcome Admin!');
    } else {
      toast.error('Invalid code');
    }
  }

  async function loadRealData() {
    const { count: total } = await supabase.from('schools').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('schools').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');
    const { count: trial } = await supabase.from('schools').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial');
    const { count: suspended } = await supabase.from('schools').select('*', { count: 'exact', head: true }).eq('subscription_status', 'suspended');
    const { count: dormant } = await supabase.from('schools').select('*', { count: 'exact', head: true }).eq('subscription_status', 'dormant');
    
    const { data: smsData } = await supabase.from('schools').select('sms_balance');
    const totalSms = smsData?.reduce((sum, s) => sum + (s.sms_balance || 0), 0) || 0;
    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: totalTeachers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    const { data: txData } = await supabase.from('transactions').select('amount_kes').eq('status', 'completed');
    const revenue = txData?.reduce((sum, t) => sum + (t.amount_kes || 0), 0) || 0;

    setStats({ total, active, trial, suspended, dormant, totalSms, totalStudents, totalTeachers, revenue });

    const { data: allSchools } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    if (allSchools) setSchools(allSchools);

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const due = allSchools?.filter(s => {
      if (!s.subscription_expires_at) return false;
      const expDate = new Date(s.subscription_expires_at);
      return expDate < sevenDaysFromNow;
    }) || [];
    setDueSchools(due);

    const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
    if (notifData) setNotifications(notifData);
  }

  async function toggleSchoolStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await supabase.from('schools').update({ subscription_status: newStatus }).eq('id', id);
    toast.success(`School ${newStatus}`);
    loadRealData();
  }

  async function markAsPaid(id: string) {
    await supabase.from('schools').update({ 
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }).eq('id', id);
    toast.success('School marked as paid (30 days)');
    loadRealData();
  }

  async function markAsUnpaid(id: string) {
    await supabase.from('schools').update({ 
      subscription_status: 'not_paid',
      subscription_expires_at: new Date(0).toISOString()
    }).eq('id', id);
    toast.success('School marked as unpaid');
    loadRealData();
  }

  async function extendSubscription(id: string, months: number) {
    const { data: school } = await supabase.from('schools').select('subscription_expires_at').eq('id', id).single();
    const currentExpiry = school?.subscription_expires_at ? new Date(school.subscription_expires_at) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + months * 30 * 24 * 60 * 60 * 1000);
    await supabase.from('schools').update({ subscription_expires_at: newExpiry.toISOString() }).eq('id', id);
    toast.success(`Extended ${months} months`);
    loadRealData();
  }

  async function topUpSms(schoolId: string, amount: number) {
    if (schoolId === 'all') {
      const { data: allSchools } = await supabase.from('schools').select('id, sms_balance');
      for (const s of allSchools || []) {
        await supabase.from('schools').update({ sms_balance: (s.sms_balance || 0) + amount }).eq('id', s.id);
      }
      toast.success(`Added ${amount} SMS credits to all schools`);
    } else {
      const { data: school } = await supabase.from('schools').select('sms_balance').eq('id', schoolId).single();
      const currentBalance = school?.sms_balance || 0;
      await supabase.from('schools').update({ sms_balance: currentBalance + amount }).eq('id', schoolId);
      toast.success(`Added ${amount} SMS credits`);
    }
    loadRealData();
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-96 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" /> Admin Access
            </CardTitle>
            <p className="text-sm text-red-500">You are not allowed to access this page</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="password" 
              placeholder="Enter access code" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              className="pr-0" 
            />
            <Button onClick={handleLogin} className="w-full bg-blue-600">
              <Shield className="mr-2 h-4 w-4" /> Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" /> Super Admin Command Centre
          </h1>
          <Button variant="outline" onClick={() => { localStorage.removeItem('admin_auth'); setAuthenticated(false); }}>
            Logout
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={activeTab === 'dashboard' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('dashboard')}>
            <TrendingUp className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant={activeTab === 'schools' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('schools')}>
            <School className="mr-2 h-4 w-4" /> Schools
          </Button>
          <Button variant={activeTab === 'due' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('due')}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Due Schools
          </Button>
          <Button variant={activeTab === 'sms' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('sms')}>
            <MessageSquare className="mr-2 h-4 w-4" /> SMS Management
          </Button>
          <Button variant={activeTab === 'notify' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('notify')}>
            <Bell className="mr-2 h-4 w-4" /> Notify
          </Button>
          <Button variant={activeTab === 'settings' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('settings')}>
            <Settings className="mr-2 h-4 w-4" /> System Settings
          </Button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.total}</p><p className="text-xs">Total Schools</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{stats.active}</p><p className="text-xs">Active</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{stats.trial}</p><p className="text-xs">Trial</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.suspended}</p><p className="text-xs">Suspended</p></CardContent></Card>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{stats.totalSms}</p><p className="text-xs">Total SMS</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-indigo-600">{stats.totalStudents}</p><p className="text-xs">Total Students</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-pink-600">{stats.totalTeachers}</p><p className="text-xs">Total Teachers</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">KES {stats.revenue.toLocaleString()}</p><p className="text-xs">Revenue</p></CardContent></Card>
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <Card>
            <CardHeader><CardTitle><School className="mr-2 h-5 w-5 inline" /> All Schools</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left p-2">School</th><th className="text-left p-2">Status</th><th className="text-left p-2">SMS</th><th className="text-left p-2">Expires</th><th className="text-left p-2">Actions</th></tr></thead>
                  <tbody>
                    {schools.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${s.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : s.subscription_status === 'trial' ? 'bg-amber-100 text-amber-700' : s.subscription_status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                            {s.subscription_status || 'not_paid'}
                          </span>
                        </td>
                        <td className="p-2">{s.sms_balance || 0}</td>
                        <td className="p-2 text-xs">{s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-2 flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(s.id)}>
                            Mark as Paid
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markAsUnpaid(s.id)}>
                            Mark as Unpaid
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleSchoolStatus(s.id, s.subscription_status)}>
                            {s.subscription_status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => extendSubscription(s.id, 1)}>
                            +1 Month
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => topUpSms(s.id, 100)}>
                            +100 SMS
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

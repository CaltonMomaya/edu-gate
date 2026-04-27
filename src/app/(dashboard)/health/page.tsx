'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Activity, Database, Users, CreditCard, MessageSquare, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function HealthPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadHealth(); }, []);

  async function loadHealth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    const sid = userData.school_id;

    const [students, payments, books, sms, staff, clearance] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('library_books').select('id', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('sms_log').select('id', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('school_id', sid),
      supabase.from('student_clearance').select('id', { count: 'exact', head: true }).not('status', 'eq', 'cleared'),
    ]);

    const { data: school } = await supabase.from('schools').select('subscription_status, subscription_expires_at, sms_balance').eq('id', sid).single();

    setStats({
      students: students.count || 0,
      payments: payments.count || 0,
      books: books.count || 0,
      smsSent: sms.count || 0,
      staff: staff.count || 0,
      pendingClearance: clearance.count || 0,
      subscription: school?.subscription_status || 'unknown',
      expiresAt: school?.subscription_expires_at,
      smsBalance: school?.sms_balance || 0,
    });
    setIsLoading(false);
  }

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const healthItems = [
    { label: 'Students', value: stats.students, icon: Users, color: 'text-blue-600' },
    { label: 'Staff', value: stats.staff, icon: Users, color: 'text-purple-600' },
    { label: 'Payments', value: stats.payments, icon: CreditCard, color: 'text-emerald-600' },
    { label: 'Books', value: stats.books, icon: Database, color: 'text-teal-600' },
    { label: 'SMS Sent', value: stats.smsSent, icon: MessageSquare, color: 'text-amber-600' },
    { label: 'Pending Clearance', value: stats.pendingClearance, icon: AlertTriangle, color: 'text-red-600' },
  ];

  const daysLeft = stats.expiresAt ? Math.ceil((new Date(stats.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">System Health</h1><p className="text-slate-500">Overview of your school's data</p></div>
        <Badge className={stats.subscription === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
          {stats.subscription === 'active' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
          {stats.subscription} · {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {healthItems.map(item => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
              <p className="text-3xl font-bold text-slate-800">{item.value}</p>
              <p className="text-sm text-slate-500">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Quick Health Check</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Database Connection', status: 'ok', message: 'Connected' },
            { label: 'Student Records', status: stats.students > 0 ? 'ok' : 'warn', message: stats.students > 0 ? `${stats.students} students registered` : 'No students yet' },
            { label: 'Fee Structures', status: stats.payments > 0 ? 'ok' : 'warn', message: stats.payments > 0 ? `${stats.payments} payments recorded` : 'No payments yet' },
            { label: 'SMS Credits', status: stats.smsBalance > 0 ? 'ok' : 'warn', message: `${stats.smsBalance} credits remaining` },
            { label: 'Subscription', status: stats.subscription === 'active' ? 'ok' : 'error', message: stats.subscription === 'active' ? 'Active' : 'Needs renewal' },
          ].map(check => (
            <div key={check.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">{check.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">{check.message}</span>
                {check.status === 'ok' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> :
                 check.status === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                 <AlertTriangle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

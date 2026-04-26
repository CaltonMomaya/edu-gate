'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, GraduationCap, DollarSign, AlertCircle, BookOpen, 
  TrendingUp, ArrowUp, Loader2, ArrowRight, Bell, Calendar, Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function OverviewPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [stats, setStats] = useState({
    totalStudents: 0, activeStudents: 0, grade10: 0, grade11: 0, grade12: 0, alumni: 0,
    totalFees: 0, collected: 0, outstanding: 0,
    libraryBooks: 0, issuedBooks: 0, overdueBooks: 0,
    pendingClearance: 0, activeLeaves: 0, offenses: 0,
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    const sid = userData.school_id;

    // School name
    const { data: school } = await supabase.from('schools').select('name, sms_balance').eq('id', sid).single();
    if (school) setSchoolName(school.name);

    // Students
    const { data: students } = await supabase.from('students').select('grade, status').eq('school_id', sid);
    if (students) {
      setStats(prev => ({
        ...prev,
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        grade10: students.filter(s => s.grade === '10' && s.status === 'active').length,
        grade11: students.filter(s => s.grade === '11' && s.status === 'active').length,
        grade12: students.filter(s => s.grade === '12' && s.status === 'active').length,
        alumni: students.filter(s => s.status === 'alumni' || s.status === 'graduated').length,
      }));
    }

    // Fees
    const { data: fees } = await supabase.from('student_fee_balances').select('total_charged, total_paid, balance').eq('school_id', sid);
    if (fees) {
      setStats(prev => ({
        ...prev,
        totalFees: fees.reduce((s, f) => s + (f.total_charged || 0), 0),
        collected: fees.reduce((s, f) => s + (f.total_paid || 0), 0),
        outstanding: fees.filter(f => f.balance > 0).reduce((s, f) => s + f.balance, 0),
      }));
    }

    // Library
    const { data: books } = await supabase.from('library_books').select('quantity, available').eq('school_id', sid);
    if (books) setStats(prev => ({ ...prev, libraryBooks: books.reduce((s, b) => s + b.quantity, 0) }));
    const { data: issued } = await supabase.from('library_issued').select('status, due_date').eq('school_id', sid).eq('status', 'issued');
    if (issued) {
      setStats(prev => ({
        ...prev,
        issuedBooks: issued.length,
        overdueBooks: issued.filter(i => new Date(i.due_date) < new Date()).length,
      }));
    }

    // Clearance pending
    const { data: clearance } = await supabase.from('student_clearance').select('status').neq('status', 'cleared');
    if (clearance) setStats(prev => ({ ...prev, pendingClearance: clearance.length }));

    // Active leaves
    const { data: leaves } = await supabase.from('leave_requests').select('status').eq('school_id', sid).eq('status', 'approved');
    if (leaves) setStats(prev => ({ ...prev, activeLeaves: leaves.length }));

    // Recent students
    const { data: recentStuds } = await supabase.from('students').select('*').eq('school_id', sid).order('created_at', { ascending: false }).limit(5);
    if (recentStuds) setRecentStudents(recentStuds);

    // Recent payments
    const { data: recentPays } = await supabase.from('payments').select('amount, students(first_name, last_name)').eq('school_id', sid).order('created_at', { ascending: false }).limit(5);
    if (recentPays) setRecentPayments(recentPays);

    setIsLoading(false);
  }

  async function handleAutoPromote() {
    if (!confirm('Promote all students? Grade 10→11, 11→12, cleared 12→Alumni.')) return;
    setIsPromoting(true);
    const res = await fetch('/api/auto-promote', { method: 'POST' });
    const data = await res.json();
    if (data.success) { toast.success(data.message); loadAll(); }
    else toast.error('Failed');
    setIsPromoting(false);
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {schoolName || 'EDU GATE'}</h1>
          <p className="text-slate-500 mt-1">Here's your school at a glance</p>
        </div>
        <Button onClick={handleAutoPromote} disabled={isPromoting} className="bg-gradient-to-r from-purple-600 to-blue-600">
          {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4" />}
          Run Auto-Promotion
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Students" value={stats.totalStudents} color="blue" href="/students" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Active" value={stats.activeStudents} color="emerald" href="/students" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Collected" value={`KES ${(stats.collected || 0).toLocaleString()}`} color="amber" href="/finance" />
        <StatCard icon={<AlertCircle className="h-5 w-5" />} label="Outstanding" value={`KES ${(stats.outstanding || 0).toLocaleString()}`} color="red" href="/finance/reports" />
      </div>

      {/* Grade Breakdown */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Grade 10', value: stats.grade10, color: 'bg-blue-500' },
          { label: 'Grade 11', value: stats.grade11, color: 'bg-emerald-500' },
          { label: 'Grade 12', value: stats.grade12, color: 'bg-amber-500' },
          { label: 'Alumni', value: stats.alumni, color: 'bg-purple-500' },
        ].map(g => (
          <Card key={g.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className={`w-3 h-3 rounded-full ${g.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold">{g.value}</p>
              <p className="text-xs text-slate-500">{g.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard icon={<BookOpen className="h-4 w-4" />} label="Library Books" value={stats.libraryBooks} sub={`${stats.overdueBooks} overdue`} />
        <InfoCard icon={<Clock className="h-4 w-4" />} label="Active Leaves" value={stats.activeLeaves} />
        <InfoCard icon={<AlertCircle className="h-4 w-4" />} label="Pending Clearance" value={stats.pendingClearance} href="/clearance" />
        <InfoCard icon={<Bell className="h-4 w-4" />} label="Issued Books" value={stats.issuedBooks} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Students</CardTitle>
            <Link href="/students" className="text-sm text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                <div><p className="font-medium text-sm">{s.first_name} {s.last_name}</p><p className="text-xs text-slate-500">{s.admission_number} · Grade {s.grade}</p></div>
                <Badge variant="outline">{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Payments</CardTitle>
            <Link href="/finance/payments" className="text-sm text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPayments.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                <p className="font-medium text-sm">{p.students?.first_name} {p.students?.last_name}</p>
                <Badge className="bg-emerald-100 text-emerald-700">KES {p.amount?.toLocaleString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Student', href: '/students/add', color: 'bg-blue-600' },
            { label: 'Record Payment', href: '/finance/payments', color: 'bg-emerald-600' },
            { label: 'Add Staff', href: '/teachers', color: 'bg-purple-600' },
            { label: 'Apply Leave', href: '/leave/apply', color: 'bg-amber-600' },
            { label: 'Black Book', href: '/discipline/black-book', color: 'bg-red-600' },
            { label: 'Clearance', href: '/clearance', color: 'bg-indigo-600' },
            { label: 'Send SMS', href: '/sms', color: 'bg-teal-600' },
            { label: 'Reports', href: '/finance/reports', color: 'bg-pink-600' },
          ].map(a => (
            <Link key={a.label} href={a.href}>
              <Button className={`w-full ${a.color} hover:opacity-90 text-white`} variant="default">
                {a.label} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color, href }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
          {href && <Link href={href}><ArrowRight className="h-4 w-4 text-slate-400 hover:text-blue-600" /></Link>}
        </div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function InfoCard({ icon, label, value, sub, href }: any) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <p className="text-xs text-slate-500">{label}</p>
        </div>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-xs text-red-500">{sub}</p>}
      </CardContent>
    </Card>
  );
}

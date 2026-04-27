'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, BookCheck, BookPlus, Search, Users, AlertCircle, TrendingUp, ArrowRight, Loader2, Package, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

export default function OverviewPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [schoolName, setSchoolName] = useState('');
  const [stats, setStats] = useState<any>({});

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: userData } = await supabase.from('users').select('school_id, role').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    
    setUserRole(userData.role as UserRole);
    const sid = userData.school_id;

    const { data: school } = await supabase.from('schools').select('name').eq('id', sid).single();
    if (school) setSchoolName(school.name);

    // Load stats based on role
    if (userData.role === 'librarian') {
      const { data: books } = await supabase.from('library_books').select('*').eq('school_id', sid);
      const { data: issued } = await supabase.from('library_issued').select('*').eq('school_id', sid).eq('status', 'issued');
      setStats({
        totalBooks: books?.reduce((s: number, b: any) => s + b.quantity, 0) || 0,
        availableBooks: books?.reduce((s: number, b: any) => s + b.available, 0) || 0,
        issuedBooks: issued?.length || 0,
        overdueBooks: issued?.filter((i: any) => new Date(i.due_date) < new Date()).length || 0,
        recentIssued: issued?.slice(0, 5) || [],
      });
    } else if (userData.role === 'bursar') {
      const { data: fees } = await supabase.from('student_fee_balances').select('*').eq('school_id', sid);
      const { data: payments } = await supabase.from('payments').select('*, students(first_name, last_name)').eq('school_id', sid).order('created_at', { ascending: false }).limit(5);
      setStats({
        totalCharged: fees?.reduce((s: number, f: any) => s + f.total_charged, 0) || 0,
        totalPaid: fees?.reduce((s: number, f: any) => s + f.total_paid, 0) || 0,
        totalOwed: fees?.filter((f: any) => f.balance > 0).reduce((s: number, f: any) => s + f.balance, 0) || 0,
        recentPayments: payments || [],
      });
    } else if (userData.role === 'deputy') {
      const { data: offenses } = await supabase.from('black_book').select('*, students(first_name, last_name)').eq('school_id', sid).order('created_at', { ascending: false }).limit(10);
      const { data: leaves } = await supabase.from('leave_requests').select('*, students(first_name, last_name)').eq('school_id', sid).eq('status', 'approved');
      setStats({ offenses: offenses || [], activeLeaves: leaves?.length || 0 });
    } else {
      // Admin/Principal - full stats
      const { data: students } = await supabase.from('students').select('grade, status').eq('school_id', sid);
      setStats({
        totalStudents: students?.length || 0,
        activeStudents: students?.filter((s: any) => s.status === 'active').length || 0,
        grade10: students?.filter((s: any) => s.grade === '10').length || 0,
        grade11: students?.filter((s: any) => s.grade === '11').length || 0,
        grade12: students?.filter((s: any) => s.grade === '12').length || 0,
      });
    }

    setIsLoading(false);
  }

  async function handleAutoPromote() {
    if (!confirm('Promote all students? Grade 10→11, 11→12, cleared 12→Alumni.')) return;
    const res = await fetch('/api/auto-promote', { method: 'POST' });
    const data = await res.json();
    if (data.success) toast.success(data.message);
  }

  if (isLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div>;
  }

  // ==================== LIBRARIAN DASHBOARD ====================
  if (userRole === 'librarian') {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Library Dashboard</h1>
        <p className="text-slate-500">Welcome, {schoolName}</p>

        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><BookOpen className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{stats.totalBooks}</p><p className="text-xs text-slate-500">Total Books</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><BookCheck className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{stats.availableBooks}</p><p className="text-xs text-slate-500">Available</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><BookPlus className="h-5 w-5 mx-auto text-amber-600 mb-1" /><p className="text-2xl font-bold">{stats.issuedBooks}</p><p className="text-xs text-slate-500">Issued</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><AlertCircle className="h-5 w-5 mx-auto text-red-600 mb-1" /><p className="text-2xl font-bold">{stats.overdueBooks}</p><p className="text-xs text-slate-500">Overdue</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/library"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-6 text-center"><BookOpen className="h-8 w-8 mx-auto text-blue-600 mb-2" /><p className="font-semibold">Manage Books</p><p className="text-sm text-slate-500">Issue, return, add books</p></CardContent></Card></Link>
          <Link href="/clearance"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-6 text-center"><ClipboardCheck className="h-8 w-8 mx-auto text-emerald-600 mb-2" /><p className="font-semibold">Clearance</p><p className="text-sm text-slate-500">Clear library step</p></CardContent></Card></Link>
        </div>
      </div>
    );
  }

  // ==================== BURSAR DASHBOARD ====================
  if (userRole === 'bursar') {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Finance Dashboard</h1>
        <p className="text-slate-500">Welcome, {schoolName}</p>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Total Charged</p><p className="text-2xl font-bold text-blue-600">KES {stats.totalCharged?.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Total Collected</p><p className="text-2xl font-bold text-emerald-600">KES {stats.totalPaid?.toLocaleString()}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Outstanding</p><p className="text-2xl font-bold text-red-600">KES {stats.totalOwed?.toLocaleString()}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Link href="/finance/fees"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-4 text-center"><p className="font-semibold">Fee Structure</p></CardContent></Card></Link>
          <Link href="/finance/payments"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-4 text-center"><p className="font-semibold">Record Payment</p></CardContent></Card></Link>
          <Link href="/finance/reports"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-4 text-center"><p className="font-semibold">Reports</p></CardContent></Card></Link>
        </div>

        {stats.recentPayments?.length > 0 && (
          <Card><CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader><CardContent className="space-y-2">
            {stats.recentPayments.map((p: any) => (
              <div key={p.id} className="flex justify-between"><span>{p.students?.first_name} {p.students?.last_name}</span><Badge className="bg-emerald-100">KES {p.amount?.toLocaleString()}</Badge></div>
            ))}
          </CardContent></Card>
        )}
      </div>
    );
  }

  // ==================== DEPUTY DASHBOARD ====================
  if (userRole === 'deputy') {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Discipline Dashboard</h1>
        <p className="text-slate-500">Welcome, {schoolName}</p>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center"><AlertCircle className="h-5 w-5 mx-auto text-red-600 mb-1" /><p className="text-2xl font-bold">{stats.offenses?.length || 0}</p><p className="text-xs text-slate-500">Total Offenses</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><AlertCircle className="h-5 w-5 mx-auto text-amber-600 mb-1" /><p className="text-2xl font-bold">{stats.offenses?.filter((o: any) => o.status === 'pending').length || 0}</p><p className="text-xs text-slate-500">Pending</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{stats.activeLeaves || 0}</p><p className="text-xs text-slate-500">Active Leaves</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Link href="/discipline/black-book"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-4 text-center"><p className="font-semibold">Black Book</p></CardContent></Card></Link>
          <Link href="/leave/approve"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-4 text-center"><p className="font-semibold">Track Leaves</p></CardContent></Card></Link>
          <Link href="/clearance"><Card className="cursor-pointer hover:shadow-md"><CardContent className="p-4 text-center"><p className="font-semibold">Clearance</p></CardContent></Card></Link>
        </div>
      </div>
    );
  }

  // ==================== ADMIN / PRINCIPAL DASHBOARD ====================
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Welcome, {schoolName}</h1><p className="text-slate-500">Here's your school at a glance</p></div>
        <Button onClick={handleAutoPromote} className="bg-gradient-to-r from-purple-600 to-blue-600"><TrendingUp className="mr-2 h-4 w-4" />Run Auto-Promotion</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{stats.totalStudents}</p><p className="text-xs text-slate-500">Total Students</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{stats.activeStudents}</p><p className="text-xs text-slate-500">Active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{stats.grade12}</p><p className="text-xs text-slate-500">Grade 12</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{stats.grade10}</p><p className="text-xs text-slate-500">Grade 10</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Add Student', href: '/students/add', color: 'bg-blue-600' },
          { label: 'Record Payment', href: '/finance/payments', color: 'bg-emerald-600' },
          { label: 'Add Staff', href: '/teachers', color: 'bg-purple-600' },
          { label: 'Black Book', href: '/discipline/black-book', color: 'bg-red-600' },
          { label: 'Clearance', href: '/clearance', color: 'bg-indigo-600' },
          { label: 'Send SMS', href: '/sms', color: 'bg-teal-600' },
          { label: 'Apply Leave', href: '/leave/apply', color: 'bg-amber-600' },
          { label: 'Reports', href: '/finance/reports', color: 'bg-pink-600' },
        ].map(a => (
          <Link key={a.label} href={a.href}><Button className={`w-full ${a.color} text-white`}>{a.label} <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
        ))}
      </div>
    </div>
  );
}

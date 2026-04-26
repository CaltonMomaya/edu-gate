'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, Users, DollarSign, AlertCircle, TrendingUp, ArrowUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OverviewPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    grade10: 0,
    grade11: 0,
    grade12: 0,
    alumni: 0,
  });
  const [schoolName, setSchoolName] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const { data: school } = await supabase
      .from('schools').select('name').eq('id', userData.school_id).single();
    if (school) setSchoolName(school.name);

    const { data: students } = await supabase
      .from('students')
      .select('grade, status')
      .eq('school_id', userData.school_id);

    if (students) {
      setStats({
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        grade10: students.filter(s => s.grade === '10' && s.status === 'active').length,
        grade11: students.filter(s => s.grade === '11' && s.status === 'active').length,
        grade12: students.filter(s => s.grade === '12' && s.status === 'active').length,
        alumni: students.filter(s => s.status === 'alumni' || s.status === 'graduated').length,
      });
    }
  }

  async function handleAutoPromote() {
    if (!confirm('This will promote all students (Grade 10→11, 11→12) and graduate cleared Grade 12s. Continue?')) return;

    setIsPromoting(true);
    try {
      const response = await fetch('/api/auto-promote', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        loadStats();
      } else {
        toast.error('Promotion failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsPromoting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to {schoolName || 'EDU GATE'}</h1>
          <p className="text-slate-500 mt-1">Here's what's happening at your school today.</p>
        </div>
        <Button
          onClick={handleAutoPromote}
          disabled={isPromoting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4" />}
          Run Auto-Promotion
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p><p className="text-xs text-slate-500">Total Students</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-emerald-600">{stats.activeStudents}</p><p className="text-xs text-slate-500">Active</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-amber-600">{stats.grade12}</p><p className="text-xs text-slate-500">Grade 12</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-purple-600">{stats.alumni}</p><p className="text-xs text-slate-500">Alumni</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center"><p className="text-4xl font-bold text-blue-600">{stats.grade10}</p><p className="text-sm text-slate-500">Grade 10</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center"><p className="text-4xl font-bold text-emerald-600">{stats.grade11}</p><p className="text-sm text-slate-500">Grade 11</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center"><p className="text-4xl font-bold text-amber-600">{stats.grade12}</p><p className="text-sm text-slate-500">Grade 12</p></CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a href="/students/add" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">+ Add Student</a>
          <a href="/finance/fees" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Manage Fees</a>
          <a href="/teachers" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Add Staff</a>
          <a href="/clearance" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">Clearance</a>
        </CardContent>
      </Card>
    </div>
  );
}

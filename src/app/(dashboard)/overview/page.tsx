'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, Users, BookOpen, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function OverviewPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    grade10: 0,
    grade11: 0,
    grade12: 0,
  });
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (!userData?.school_id) return;

      // Load school name
      const { data: school } = await supabase
        .from('schools')
        .select('name')
        .eq('id', userData.school_id)
        .single();
      if (school) setSchoolName(school.name);

      // Load student counts
      const { data: students } = await supabase
        .from('students')
        .select('grade, status')
        .eq('school_id', userData.school_id);

      if (students) {
        setStats({
          totalStudents: students.length,
          activeStudents: students.filter(s => s.status === 'active').length,
          grade10: students.filter(s => s.grade === '10').length,
          grade11: students.filter(s => s.grade === '11').length,
          grade12: students.filter(s => s.grade === '12').length,
        });
      }
    }
    loadStats();
  }, [supabase]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome to {schoolName || 'EDU GATE'}
        </h1>
        <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening at your school today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.totalStudents}</div>
            <p className="text-xs text-slate-500 mt-1">All registered students</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Students</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.activeStudents}</div>
            <p className="text-xs text-slate-500 mt-1">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Grade 12</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{stats.grade12}</div>
            <p className="text-xs text-slate-500 mt-1">Final year students</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Clearance</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">0</div>
            <p className="text-xs text-slate-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Grade 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.grade10}</div>
            <p className="text-sm text-slate-500">students</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Grade 11</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.grade11}</div>
            <p className="text-sm text-slate-500">students</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Grade 12</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.grade12}</div>
            <p className="text-sm text-slate-500">students</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a href="/students/add" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Users className="h-4 w-4" /> Add New Student
          </a>
          <a href="/finance/fees" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <DollarSign className="h-4 w-4" /> Manage Fees
          </a>
          <a href="/discipline" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
            <AlertCircle className="h-4 w-4" /> Discipline
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

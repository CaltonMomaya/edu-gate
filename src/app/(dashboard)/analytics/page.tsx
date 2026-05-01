'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, GraduationCap, BookOpen } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('');
  const [gradeData, setGradeData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [monthlyAdmissions, setMonthlyAdmissions] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    const sid = userData.school_id;

    const { data: school } = await supabase.from('schools').select('name').eq('id', sid).single();
    if (school) setSchoolName(school.name);

    // Students by grade
    const { data: students } = await supabase.from('students').select('grade, gender, created_at').eq('school_id', sid);
    if (students) {
      const grades: Record<string, number> = {};
      students.forEach((s: any) => { grades[s.grade] = (grades[s.grade] || 0) + 1; });
      setGradeData(Object.entries(grades).map(([name, value]) => ({ name: `Grade ${name}`, value })));

      const genders: Record<string, number> = {};
      students.forEach((s: any) => { genders[s.gender || 'unknown'] = (genders[s.gender || 'unknown'] || 0) + 1; });
      setGenderData(Object.entries(genders).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

      const months: Record<string, number> = {};
      students.forEach((s: any) => {
        const m = new Date(s.created_at).toLocaleString('default', { month: 'short' });
        months[m] = (months[m] || 0) + 1;
      });
      setMonthlyAdmissions(Object.entries(months).map(([name, students]) => ({ name, students })));
    }

    // Fees
    const { data: fees } = await supabase.from('student_fee_balances').select('total_charged, total_paid').eq('school_id', sid);
    if (fees) {
      const charged = fees.reduce((s: number, f: any) => s + (f.total_charged || 0), 0);
      const paid = fees.reduce((s: number, f: any) => s + (f.total_paid || 0), 0);
      setFeeData([
        { name: 'Charged', amount: charged },
        { name: 'Collected', amount: paid },
        { name: 'Outstanding', amount: Math.max(0, charged - paid) },
      ]);
    }

    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 gap-6">{[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>)}</div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Analytics</h1><p className="text-slate-500">{schoolName}</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-600" />Students by Grade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gradeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[8,8,0,0]} name="Students" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-purple-600" />Gender Distribution</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>{genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600" />Fee Collection</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={feeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} /><Bar dataKey="amount" radius={[8,8,0,0]}>{feeData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#ef4444'][i]} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-amber-600" />Monthly Admissions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyAdmissions}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={2} name="Students" /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

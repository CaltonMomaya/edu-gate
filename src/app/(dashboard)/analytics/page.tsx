'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, GraduationCap, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');

  // Stats
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<any[]>([]);
  const [feeCollection, setFeeCollection] = useState<any[]>([]);
  const [monthlyAdmissions, setMonthlyAdmissions] = useState<any[]>([]);
  const [disciplineSummary, setDisciplineSummary] = useState<any[]>([]);
  const [clearanceProgress, setClearanceProgress] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    setSchoolId(userData.school_id);
    const sid = userData.school_id;

    const { data: school } = await supabase.from('schools').select('name').eq('id', sid).single();
    if (school) setSchoolName(school.name);

    // 1. Grade Distribution
    const { data: students } = await supabase.from('students').select('grade, gender, status, created_at').eq('school_id', sid);
    if (students) {
      // Grades
      const gradeCounts: Record<string, number> = { '10': 0, '11': 0, '12': 0 };
      students.forEach(s => { if (s.grade) gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1; });
      setGradeDistribution(Object.entries(gradeCounts).map(([grade, count]) => ({ name: `Grade ${grade}`, value: count })));

      // Gender
      const genderCounts: Record<string, number> = {};
      students.forEach(s => { genderCounts[s.gender || 'unknown'] = (genderCounts[s.gender || 'unknown'] || 0) + 1; });
      setGenderDistribution(Object.entries(genderCounts).map(([gender, count]) => ({ name: gender.charAt(0).toUpperCase() + gender.slice(1), value: count })));

      // Monthly admissions
      const months: Record<string, number> = {};
      students.forEach(s => {
        const month = new Date(s.created_at).toLocaleString('default', { month: 'short' });
        months[month] = (months[month] || 0) + 1;
      });
      setMonthlyAdmissions(Object.entries(months).map(([month, count]) => ({ name: month, students: count })));
    }

    // 2. Fee Collection by Grade
    const { data: payments } = await supabase.from('payments').select('amount').eq('school_id', sid);
    const { data: feeData } = await supabase.from('fee_structures').select('grade, amount').eq('school_id', sid);
    if (feeData && payments) {
      const gradeCharged: Record<string, number> = {};
      feeData.forEach(f => { gradeCharged[f.grade] = (gradeCharged[f.grade] || 0) + f.amount; });
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      const totalCharged = Object.values(gradeCharged).reduce((s, v) => s + v, 0);
      setFeeCollection([
        { name: 'Charged', amount: totalCharged },
        { name: 'Collected', amount: totalPaid },
        { name: 'Outstanding', amount: Math.max(0, totalCharged - totalPaid) },
      ]);
    }

    // 3. Discipline Summary
    const { data: offenses } = await supabase.from('black_book').select('status').eq('school_id', sid);
    if (offenses) {
      const statusCounts: Record<string, number> = {};
      offenses.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      setDisciplineSummary(Object.entries(statusCounts).map(([status, count]) => ({ name: status.charAt(0).toUpperCase() + status.slice(1), value: count })));
    }

    // 4. Clearance Progress
    const { data: clearance } = await supabase.from('student_clearance').select('status');
    if (clearance) {
      const cleared = clearance.filter(c => c.status === 'cleared').length;
      const blocked = clearance.filter(c => c.status === 'blocked').length;
      const pending = clearance.filter(c => c.status === 'pending').length;
      setClearanceProgress([
        { name: 'Cleared', value: cleared, color: '#10b981' },
        { name: 'Blocked', value: blocked, color: '#ef4444' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
      ]);
    }

    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-500 mt-1">{schoolName} · Data-driven insights</p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-600" /> Students by Grade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-purple-600" /> Gender Distribution</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={genderDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {genderDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Collection */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600" /> Fee Collection Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={feeCollection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} name="KES">
                  {feeCollection.map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#ef4444'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Admissions */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-amber-600" /> Monthly Admissions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyAdmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} name="Students" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discipline Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /> Discipline Overview</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={disciplineSummary} cx="50%" cy="50%" outerRadius={110} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {disciplineSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Clearance Progress */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-600" /> Clearance Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={clearanceProgress} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Departments">
                  {clearanceProgress.map((entry, i) => <Cell key={i} fill={entry.color || COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

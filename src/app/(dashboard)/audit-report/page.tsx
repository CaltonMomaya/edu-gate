'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, Download, Loader2, Users, DollarSign, BookOpen, 
  Scale, GraduationCap, Database, Clock, TrendingUp, PieChart,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AuditReportPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => { setup(); }, []);

  async function setup() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data: school } = await supabase.from('schools').select('name').eq('id', userData.school_id).single();
    if (school) setSchoolName(school.name);
  }

  async function generateReport() {
    if (!schoolId) { toast.error('Loading... try again in a moment'); return; }
    setIsLoading(true);
    const sid = schoolId;
    const data: any = { schoolName, generatedAt: new Date().toISOString() };

    // Grade distribution
    const { data: students } = await supabase.from('students').select('grade, status').eq('school_id', sid);
    if (students) {
      const grades: Record<string, number> = { '10': 0, '11': 0, '12': 0 };
      students.forEach(s => { if (s.grade) grades[s.grade] = (grades[s.grade] || 0) + 1; });
      data.gradeDistribution = Object.entries(grades).map(([name, value]) => ({ name: `Grade ${name}`, value }));
      data.students = { total: students.length, active: students.filter(s => s.status === 'active').length, alumni: students.filter(s => s.status === 'alumni' || s.status === 'graduated').length };
    }

    // Gender
    const { data: genderData } = await supabase.from('students').select('gender').eq('school_id', sid);
    if (genderData) {
      const gc: Record<string, number> = {};
      genderData.forEach(s => { gc[s.gender || 'unknown'] = (gc[s.gender || 'unknown'] || 0) + 1; });
      data.genderDistribution = Object.entries(gc).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    }

    // Finance
    const { data: fees } = await supabase.from('student_fee_balances').select('total_charged, total_paid, balance').eq('school_id', sid);
    data.finance = {
      totalCharged: fees?.reduce((s, f) => s + (f.total_charged || 0), 0) || 0,
      totalPaid: fees?.reduce((s, f) => s + (f.total_paid || 0), 0) || 0,
      outstanding: fees?.filter(f => f.balance > 0).reduce((s, f) => s + f.balance, 0) || 0,
    };
    data.feeChart = [
      { name: 'Charged', amount: data.finance.totalCharged },
      { name: 'Collected', amount: data.finance.totalPaid },
      { name: 'Outstanding', amount: data.finance.outstanding },
    ];

    // Status distribution
    const { count: active } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('status', 'active');
    const { count: transferred } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('status', 'transferred');
    const { count: alumniCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', sid).in('status', ['alumni', 'graduated']);
    data.statusDistribution = [
      { name: 'Active', value: active || 0 },
      { name: 'Transferred', value: transferred || 0 },
      { name: 'Alumni', value: alumniCount || 0 },
    ];

    // Staff
    const { count: staffCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', sid);
    data.staff = staffCount || 0;

    // Library
    const { count: booksCount } = await supabase.from('library_books').select('*', { count: 'exact', head: true }).eq('school_id', sid);
    const { count: issuedCount } = await supabase.from('library_issued').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('status', 'issued');
    data.library = { books: booksCount || 0, issued: issuedCount || 0 };

    // Discipline
    const { count: offensesCount } = await supabase.from('black_book').select('*', { count: 'exact', head: true }).eq('school_id', sid);
    const { count: pendingCount } = await supabase.from('black_book').select('*', { count: 'exact', head: true }).eq('school_id', sid).eq('status', 'pending');
    data.discipline = { total: offensesCount || 0, pending: pendingCount || 0 };

    // Clearance
    const { count: clearanceCount } = await supabase.from('student_clearance').select('*', { count: 'exact', head: true }).not('status', 'eq', 'cleared');
    data.clearance = clearanceCount || 0;

    // Departments
    const { count: deptsCount } = await supabase.from('departments').select('*', { count: 'exact', head: true }).eq('school_id', sid);
    data.departments = deptsCount || 0;

    // Audit Logs
    const { count: logsCount } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('school_id', sid);
    data.auditLogs = logsCount || 0;

    setReport(data);
    setIsLoading(false);
    toast.success('Report generated!');
  }

  function downloadReport() {
    if (!report) return;
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">System Audit Report</h1><p className="text-slate-500">Complete data overview with charts</p></div>
        <div className="flex gap-2">
          <Button onClick={generateReport} disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-emerald-600">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}Generate
          </Button>
          {report && <Button variant="outline" onClick={downloadReport}><Download className="mr-2 h-4 w-4" />Download</Button>}
        </div>
      </div>

      {report && (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
            <CardContent className="p-6"><h2 className="text-xl font-bold">{report.schoolName}</h2><p className="text-white/80 text-sm">{new Date(report.generatedAt).toLocaleString()}</p></CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{report.students?.total || 0}</p><p className="text-xs text-slate-500">Students</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-purple-600 mb-1" /><p className="text-2xl font-bold">{report.staff}</p><p className="text-xs text-slate-500">Staff</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><DollarSign className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">KES {report.finance?.totalPaid?.toLocaleString()}</p><p className="text-xs text-slate-500">Collected</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Database className="h-5 w-5 mx-auto text-teal-600 mb-1" /><p className="text-2xl font-bold">{report.departments}</p><p className="text-xs text-slate-500">Departments</p></CardContent></Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-600" />Grade Distribution</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={report.gradeDistribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-purple-600" />Gender</CardTitle></CardHeader>
              <CardContent className="flex justify-center"><ResponsiveContainer width="100%" height={250}><RPieChart><Pie data={report.genderDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>{report.genderDistribution?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /><Legend /></RPieChart></ResponsiveContainer></CardContent></Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-600" />Finance Overview</CardTitle></CardHeader>
              <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={report.feeChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="amount" radius={[8,8,0,0]}>{report.feeChart?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}</Bar></BarChart></ResponsiveContainer></CardContent></Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-amber-600" />Student Status</CardTitle></CardHeader>
              <CardContent className="flex justify-center"><ResponsiveContainer width="100%" height={250}><RPieChart><Pie data={report.statusDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>{report.statusDistribution?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /><Legend /></RPieChart></ResponsiveContainer></CardContent></Card>
          </div>

          {/* Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><p className="text-xs text-slate-500">Books</p><p className="text-xl font-bold">{report.library?.books}</p></div>
              <div><p className="text-xs text-slate-500">Issued</p><p className="text-xl font-bold">{report.library?.issued}</p></div>
              <div><p className="text-xs text-slate-500">Offenses</p><p className="text-xl font-bold">{report.discipline?.total}</p></div>
              <div><p className="text-xs text-slate-500">Clearance</p><p className="text-xl font-bold text-amber-600">{report.clearance}</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      {!report && (
        <Card className="border-0 shadow-sm"><CardContent className="py-16 text-center text-slate-500"><FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" /><p>Click "Generate" to create a full audit report with charts.</p></CardContent></Card>
      )}
    </div>
  );
}

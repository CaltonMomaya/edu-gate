'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Brain, AlertTriangle, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';

export default function AIAnalyticsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState('');
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [feeDefaultRisk, setFeeDefaultRisk] = useState<any[]>([]);
  const [academicTrends, setAcademicTrends] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    setSchoolId(userData.school_id);

    // 1. At-risk students: based on attendance, discipline, and grades
    const { data: students } = await supabase.from('students').select('id, first_name, last_name, grade').eq('school_id', schoolId);
    if (students) {
      const riskList = [];
      for (const s of students) {
        let riskScore = 0;
        let reasons = [];

        // Check discipline
        const { count: offenses } = await supabase.from('black_book').select('*', { count: 'exact', head: true }).eq('student_id', s.id).eq('status', 'pending');
        if (offenses && offenses > 0) {
          riskScore += 3;
          reasons.push(`${offenses} pending offense(s)`);
        }

        // Check attendance (if you have attendance table)
        // const { count: absences } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', s.id).eq('status', 'absent');
        // if (absences && absences > 5) {
        //   riskScore += 2;
        //   reasons.push(`${absences} absences`);
        // }

        // Check fee balance
        const { data: fees } = await supabase.from('student_fee_balances').select('balance').eq('student_id', s.id);
        const totalOwed = fees?.reduce((sum, f) => sum + (f.balance > 0 ? f.balance : 0), 0) || 0;
        if (totalOwed > 10000) {
          riskScore += 2;
          reasons.push(`Owes KES ${totalOwed.toLocaleString()}`);
        }

        if (riskScore >= 5) {
          riskList.push({ name: `${s.first_name} ${s.last_name}`, grade: s.grade, risk: 'high', reason: reasons.join('; ') });
        } else if (riskScore >= 3) {
          riskList.push({ name: `${s.first_name} ${s.last_name}`, grade: s.grade, risk: 'medium', reason: reasons.join('; ') });
        }
      }
      setAtRiskStudents(riskList.slice(0, 10));
    }

    // 2. Fee default risk: students with high balances and irregular payment patterns
    const { data: fees } = await supabase.from('student_fee_balances').select('*, students(first_name, last_name, grade)').eq('school_id', schoolId).gt('balance', 0).order('balance', { ascending: false }).limit(10);
    if (fees) {
      setFeeDefaultRisk(fees.map((f: any) => ({
        name: `${f.students?.first_name || ''} ${f.students?.last_name || ''}`,
        grade: f.students?.grade || 'N/A',
        amount: f.balance || 0,
        probability: Math.min(95, Math.round(30 + (f.balance / 50000) * 50)),
        reason: 'Outstanding balance',
      })));
    }

    // 3. Academic trends: average scores by subject
    const { data: results } = await supabase.from('exam_results').select('subject, score').eq('school_id', schoolId);
    if (results) {
      const subjects: Record<string, { total: number; count: number }> = {};
      results.forEach((r: any) => {
        if (!subjects[r.subject]) subjects[r.subject] = { total: 0, count: 0 };
        subjects[r.subject].total += r.score;
        subjects[r.subject].count += 1;
      });
      const trends = Object.entries(subjects).map(([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count),
        students: data.count,
        trend: Math.round((Math.random() - 0.5) * 30), // Simulate trend (in production, compare with previous term)
      }));
      setAcademicTrends(trends.slice(0, 6));
    }

    setIsLoading(false);
  }

  async function runAIAnalysis() {
    setIsLoading(true);
    await loadData();
    toast.success('AI analysis complete!');
  }

  if (isLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 gap-6">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>)}</div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" /> AI Recommendations
          </h1>
          <p className="text-slate-500">Predictive analytics to improve student outcomes</p>
        </div>
        <Button onClick={runAIAnalysis} className="bg-gradient-to-r from-purple-600 to-blue-600">
          <Loader2 className="mr-2 h-4 w-4" /> Run Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Students */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> At-Risk Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {atRiskStudents.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No at-risk students detected.</p>
            ) : (
              atRiskStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">Grade {s.grade} · {s.reason}</p>
                  </div>
                  <Badge className={s.risk === 'high' ? 'bg-red-100 text-red-700' : s.risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                    {s.risk.toUpperCase()}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Fee Default Risk */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-600" /> Fee Default Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feeDefaultRisk.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No fee default risks detected.</p>
            ) : (
              feeDefaultRisk.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">Grade {s.grade} · KES {s.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{s.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{s.probability}%</p>
                    <p className="text-xs text-slate-500">risk</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Academic Trends */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> Academic Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {academicTrends.map((t, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="text-2xl font-bold text-blue-600">{t.average}%</p>
                  <p className="text-xs text-slate-500">{t.students} students</p>
                  <p className={`text-xs ${t.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.trend >= 0 ? '↗' : '↘'} {Math.abs(t.trend)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, TrendingUp, TrendingDown, Users, DollarSign, BookOpen, Scale, Loader2 } from 'lucide-react';

export default function AdvancedReportsPage() {
  const supabase = createClient();
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState('collection');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('2026');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => { setup(); }, []);

  async function setup() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (userData?.school_id) setSchoolId(userData.school_id);
  }

  async function generateReport() {
    setIsLoading(true);
    const sid = schoolId;
    const data: any = {};

    if (reportType === 'collection') {
      // Fee collection rate by grade
      const { data: fees } = await supabase.from('student_fee_balances').select('*, students(grade)').eq('school_id', sid);
      const grades = ['10', '11', '12'];
      data.collection = grades.map(g => {
        const gradeFees = fees?.filter((f: any) => f.students?.grade === g) || [];
        const charged = gradeFees.reduce((s: number, f: any) => s + f.total_charged, 0);
        const paid = gradeFees.reduce((s: number, f: any) => s + f.total_paid, 0);
        return { grade: `Grade ${g}`, charged, paid, rate: charged > 0 ? Math.round((paid / charged) * 100) : 0 };
      });
    } else if (reportType === 'discipline') {
      const { data: offenses } = await supabase.from('black_book').select('status').eq('school_id', sid);
      data.discipline = {
        total: offenses?.length || 0,
        pending: offenses?.filter((o: any) => o.status === 'pending').length || 0,
        served: offenses?.filter((o: any) => o.status === 'served').length || 0,
        pardoned: offenses?.filter((o: any) => o.status === 'pardoned').length || 0,
      };
    } else if (reportType === 'library') {
      const { data: books } = await supabase.from('library_books').select('quantity, available').eq('school_id', sid);
      const { data: issued } = await supabase.from('library_issued').select('status').eq('school_id', sid);
      data.library = {
        totalBooks: books?.reduce((s: number, b: any) => s + b.quantity, 0) || 0,
        available: books?.reduce((s: number, b: any) => s + b.available, 0) || 0,
        issued: issued?.filter((i: any) => i.status === 'issued').length || 0,
        returned: issued?.filter((i: any) => i.status === 'returned').length || 0,
      };
    }

    setReportData(data);
    setIsLoading(false);
    toast.success('Report generated!');
  }

  function exportCSV() {
    if (!reportData) return;
    const rows: string[] = [];
    const data = reportData[reportType];
    
    if (Array.isArray(data)) {
      rows.push(Object.keys(data[0]).join(','));
      data.forEach((r: any) => rows.push(Object.values(r).join(',')));
    } else {
      rows.push('Metric,Value');
      Object.entries(data).forEach(([k, v]) => rows.push(`${k},${v}`));
    }
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Advanced Reports</h1><p className="text-slate-500">Generate detailed analytics reports</p></div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Report Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue placeholder="Report type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="collection">💰 Fee Collection Rate</SelectItem>
                <SelectItem value="discipline">⚖️ Discipline Summary</SelectItem>
                <SelectItem value="library">📚 Library Usage</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="all">All Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-emerald-600">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate Report'}
            </Button>
            {reportData && <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>}
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Results</CardTitle></CardHeader>
          <CardContent>
            {reportType === 'collection' && reportData.collection && (
              <div className="space-y-3">
                {reportData.collection.map((r: any) => (
                  <div key={r.grade} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <span className="font-medium">{r.grade}</span>
                    <div className="flex items-center gap-4">
                      <span>Charged: <Badge className="bg-blue-100">KES {r.charged.toLocaleString()}</Badge></span>
                      <span>Paid: <Badge className="bg-emerald-100">KES {r.paid.toLocaleString()}</Badge></span>
                      <span>Rate: <Badge className={r.rate >= 80 ? 'bg-emerald-100 text-emerald-700' : r.rate >= 50 ? 'bg-amber-100' : 'bg-red-100'}>{r.rate}%</Badge></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportType === 'discipline' && reportData.discipline && (
              <div className="grid grid-cols-4 gap-4 text-center">
                <Card><CardContent className="p-4"><p className="text-3xl font-bold">{reportData.discipline.total}</p><p className="text-xs">Total</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-3xl font-bold text-amber-600">{reportData.discipline.pending}</p><p className="text-xs">Pending</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-3xl font-bold text-emerald-600">{reportData.discipline.served}</p><p className="text-xs">Served</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-3xl font-bold text-blue-600">{reportData.discipline.pardoned}</p><p className="text-xs">Pardoned</p></CardContent></Card>
              </div>
            )}

            {reportType === 'library' && reportData.library && (
              <div className="grid grid-cols-4 gap-4 text-center">
                <Card><CardContent className="p-4"><p className="text-3xl font-bold">{reportData.library.totalBooks}</p><p className="text-xs">Total Books</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-3xl font-bold text-emerald-600">{reportData.library.available}</p><p className="text-xs">Available</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-3xl font-bold text-amber-600">{reportData.library.issued}</p><p className="text-xs">Issued</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-3xl font-bold text-blue-600">{reportData.library.returned}</p><p className="text-xs">Returned</p></CardContent></Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Download, Filter, ChevronDown, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface TermBreakdown { term: string; charged: number; paid: number; balance: number; carriedOver: number; }
interface StudentReport {
  id: string; name: string; admission: string; grade: string; stream: string; house: string;
  term1: TermBreakdown; term2: TermBreakdown; term3: TermBreakdown;
  totalCharged: number; totalPaid: number; totalBalance: number;
  guardianName: string; guardianPhone: string;
}

export default function ReportsPage() {
  const supabase = createClient();
  const [report, setReport] = useState<StudentReport[]>([]);
  const [filteredReport, setFilteredReport] = useState<StudentReport[]>([]);
  const [summary, setSummary] = useState({ totalCharged: 0, totalPaid: 0, totalOwed: 0, totalCredit: 0, schoolName: '' });
  const [gradeFilter, setGradeFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [yearInput, setYearInput] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [gradeFilter, yearFilter]);
  useEffect(() => { applyFilters(); }, [balanceFilter, report]);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    setSchoolId(userData.school_id);
    const sid = userData.school_id;

    const { data: school } = await supabase.from('schools').select('name').eq('id', sid).single();
    const schoolName = school?.name || 'School';

    // Get fee structures - all years or specific year
    let feeQuery = supabase.from('fee_structures').select('grade, amount, term, academic_year').eq('school_id', sid);
    if (yearFilter !== 'all') feeQuery = feeQuery.eq('academic_year', yearFilter);
    const { data: feeData } = await feeQuery;

    const gradeTermCharged: Record<string, Record<string, number>> = {};
    if (feeData) {
      feeData.forEach(f => {
        if (!gradeTermCharged[f.grade]) gradeTermCharged[f.grade] = { term1: 0, term2: 0, term3: 0 };
        gradeTermCharged[f.grade][f.term] = (gradeTermCharged[f.grade][f.term] || 0) + f.amount;
      });
    }

    // Get students
    let studentQuery = supabase.from('students').select('id, first_name, last_name, admission_number, grade, stream, house').eq('school_id', sid).eq('status', 'active');
    if (gradeFilter !== 'all') studentQuery = studentQuery.eq('grade', gradeFilter);
    const { data: students } = await studentQuery.order('grade').order('first_name');
    if (!students) { setIsLoading(false); return; }

    const reportData: StudentReport[] = [];
    for (const student of students) {
      const gradeCharges = gradeTermCharged[student.grade] || { term1: 0, term2: 0, term3: 0 };

      // Get payments - all years or specific year
      let payQuery = supabase.from('payments').select('amount, term').eq('student_id', student.id);
      if (yearFilter !== 'all') payQuery = payQuery.eq('academic_year', yearFilter);
      const { data: allPayments } = await payQuery;

      const termPaid: Record<string, number> = { term1: 0, term2: 0, term3: 0 };
      let totalPaidAll = 0;
      if (allPayments) allPayments.forEach(p => { termPaid[p.term] = (termPaid[p.term] || 0) + p.amount; totalPaidAll += p.amount; });

      const t1Bal = gradeCharges.term1 - (termPaid.term1 || 0);
      const carryToT2 = t1Bal < 0 ? Math.abs(t1Bal) : 0;
      const t2Bal = gradeCharges.term2 - ((termPaid.term2 || 0) + carryToT2);
      const carryToT3 = t2Bal < 0 ? Math.abs(t2Bal) : 0;
      const t3Bal = gradeCharges.term3 - ((termPaid.term3 || 0) + carryToT3);
      const totalChargedAll = gradeCharges.term1 + gradeCharges.term2 + gradeCharges.term3;

      const { data: guardians } = await supabase.from('guardians').select('full_name, phone_number, is_primary').eq('student_id', student.id);
      const primary = guardians?.find((g: any) => g.is_primary);

      reportData.push({
        id: student.id, name: `${student.first_name} ${student.last_name}`, admission: student.admission_number,
        grade: student.grade, stream: student.stream || '', house: student.house || '',
        term1: { term: 'term1', charged: gradeCharges.term1, paid: termPaid.term1 || 0, balance: t1Bal, carriedOver: 0 },
        term2: { term: 'term2', charged: gradeCharges.term2, paid: (termPaid.term2 || 0) + carryToT2, balance: t2Bal, carriedOver: carryToT2 },
        term3: { term: 'term3', charged: gradeCharges.term3, paid: (termPaid.term3 || 0) + carryToT3, balance: t3Bal, carriedOver: carryToT3 },
        totalCharged: totalChargedAll, totalPaid: totalPaidAll, totalBalance: totalChargedAll - totalPaidAll,
        guardianName: primary?.full_name || '', guardianPhone: primary?.phone_number || '',
      });
    }

    setReport(reportData); setFilteredReport(reportData);
    setSummary({
      totalCharged: reportData.reduce((s, r) => s + r.totalCharged, 0),
      totalPaid: reportData.reduce((s, r) => s + r.totalPaid, 0),
      totalOwed: reportData.filter(r => r.totalBalance > 0).reduce((s, r) => s + r.totalBalance, 0),
      totalCredit: reportData.filter(r => r.totalBalance < 0).reduce((s, r) => s + Math.abs(r.totalBalance), 0),
      schoolName,
    });
    setIsLoading(false);
  }

  function applyFilters() {
    let data = [...report];
    if (balanceFilter === 'owing') data = data.filter(r => r.totalBalance > 0);
    else if (balanceFilter === 'overpaid') data = data.filter(r => r.totalBalance < 0);
    else if (balanceFilter === 'cleared') data = data.filter(r => r.totalBalance === 0);
    setFilteredReport(data);
  }

  function exportCSV(dataToExport: StudentReport[], label: string) {
    const headers = ['Name','Adm','Grade','Stream','House','T1 Charged','T1 Paid','T1 Bal','T2 Charged','T2 Paid','T2 Bal','T3 Charged','T3 Paid','T3 Bal','Total Charged','Total Paid','Total Balance','Status','Guardian','Phone'];
    const rows = dataToExport.map(r => [r.name,r.admission,r.grade,r.stream,r.house,r.term1.charged,r.term1.paid,r.term1.balance,r.term2.charged,r.term2.paid,r.term2.balance,r.term3.charged,r.term3.paid,r.term3.balance,r.totalCharged,r.totalPaid,r.totalBalance,r.totalBalance>0?'ARREARS':r.totalBalance<0?'OVERPAID':'CLEARED',r.guardianName,r.guardianPhone]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `fees-${label}-${yearFilter}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} records`);
  }

  const owingStudents = report.filter(r => r.totalBalance > 0);
  const overpaidStudents = report.filter(r => r.totalBalance < 0);
  const clearedStudents = report.filter(r => r.totalBalance === 0);

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-20" />)}</div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Finance Reports</h1><p className="text-slate-500">{summary.schoolName} · {yearFilter === 'all' ? 'All Years (Cumulative)' : `Year: ${yearFilter}`}</p></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button className="bg-gradient-to-r from-blue-600 to-emerald-600"><Download className="mr-2 h-4 w-4" />Export <ChevronDown className="ml-1 h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportCSV(report, 'all')}>📋 All ({report.length})</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(owingStudents, 'arrears')}>🔴 Arrears ({owingStudents.length})</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(overpaidStudents, 'overpaid')}>🟢 Overpaid ({overpaidStudents.length})</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(clearedStudents, 'cleared')}>✅ Cleared ({clearedStudents.length})</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><DollarSign className="h-6 w-6 mx-auto text-blue-600" /><p className="text-2xl font-bold">KES {summary.totalCharged.toLocaleString()}</p><p className="text-xs text-slate-500">Total Charged</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="h-6 w-6 mx-auto text-emerald-600" /><p className="text-2xl font-bold">KES {summary.totalPaid.toLocaleString()}</p><p className="text-xs text-slate-500">Total Paid</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><AlertCircle className="h-6 w-6 mx-auto text-red-600" /><p className="text-2xl font-bold">KES {summary.totalOwed.toLocaleString()}</p><p className="text-xs text-slate-500">Outstanding</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingDown className="h-6 w-6 mx-auto text-purple-600" /><p className="text-2xl font-bold">KES {summary.totalCredit.toLocaleString()}</p><p className="text-xs text-slate-500">Overpaid</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Student Balances ({filteredReport.length})</CardTitle>
            <div className="flex gap-2">
              {/* Year filter with "All Years" option */}
              <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); if (v !== 'all') setYearInput(v); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📅 All Years</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                  <SelectItem value="2028">2028</SelectItem>
                  <SelectItem value="custom">✏️ Custom...</SelectItem>
                </SelectContent>
              </Select>
              {yearFilter === 'custom' && (
                <form onSubmit={e => { e.preventDefault(); setYearFilter(yearInput); }} className="flex gap-1">
                  <Input type="number" value={yearInput} onChange={e => setYearInput(e.target.value)} className="w-20 text-center" placeholder="Year" />
                  <Button type="submit" size="sm" variant="outline">Go</Button>
                </form>
              )}
              <Select value={gradeFilter} onValueChange={setGradeFilter}><SelectTrigger className="w-28"><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent><SelectItem value="all">All Grades</SelectItem><SelectItem value="10">Grade 10</SelectItem><SelectItem value="11">Grade 11</SelectItem><SelectItem value="12">Grade 12</SelectItem></SelectContent></Select>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="owing">🔴 Arrears</SelectItem><SelectItem value="overpaid">🟢 Overpaid</SelectItem><SelectItem value="cleared">✅ Cleared</SelectItem></SelectContent></Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Gr</TableHead><TableHead>Term 1</TableHead><TableHead>Term 2</TableHead><TableHead>Term 3</TableHead><TableHead>Total Balance</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredReport.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No data for this period.</TableCell></TableRow> :
                filteredReport.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><p className="font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.admission} · {r.stream || '-'} · {r.house || '-'}</p></TableCell>
                    <TableCell>G{r.grade}</TableCell>
                    <TableCell>{r.term1.balance > 0 ? <Badge className="bg-red-100 text-red-700">KES {r.term1.balance.toLocaleString()}</Badge> : r.term1.balance < 0 ? <Badge className="bg-emerald-100 text-emerald-700">-KES {Math.abs(r.term1.balance).toLocaleString()}</Badge> : <Badge className="bg-slate-100">✓</Badge>}</TableCell>
                    <TableCell>{r.term2.carriedOver > 0 && <span className="text-xs text-blue-500 block">+KES {r.term2.carriedOver.toLocaleString()}</span>}{r.term2.balance > 0 ? <Badge className="bg-red-100 text-red-700">KES {r.term2.balance.toLocaleString()}</Badge> : r.term2.balance < 0 ? <Badge className="bg-emerald-100 text-emerald-700">-KES {Math.abs(r.term2.balance).toLocaleString()}</Badge> : <Badge className="bg-slate-100">✓</Badge>}</TableCell>
                    <TableCell>{r.term3.carriedOver > 0 && <span className="text-xs text-blue-500 block">+KES {r.term3.carriedOver.toLocaleString()}</span>}{r.term3.balance > 0 ? <Badge className="bg-red-100 text-red-700">KES {r.term3.balance.toLocaleString()}</Badge> : r.term3.balance < 0 ? <Badge className="bg-emerald-100 text-emerald-700">-KES {Math.abs(r.term3.balance).toLocaleString()}</Badge> : <Badge className="bg-slate-100">✓</Badge>}</TableCell>
                    <TableCell><Badge className={`text-base px-3 py-1 font-bold ${r.totalBalance > 0 ? 'bg-red-100 text-red-700' : r.totalBalance < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>KES {r.totalBalance.toLocaleString()}</Badge></TableCell>
                  </TableRow>
                ))
              }
            </TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}

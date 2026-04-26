'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Download, Filter, ChevronDown, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface TermBreakdown {
  term: string;
  charged: number;
  paid: number;
  balance: number;
  carriedOver: number;
}

interface StudentReport {
  id: string;
  name: string;
  admission: string;
  grade: string;
  stream: string;
  house: string;
  term1: TermBreakdown;
  term2: TermBreakdown;
  term3: TermBreakdown;
  totalCharged: number;
  totalPaid: number;
  totalBalance: number;
  guardianName: string;
  guardianPhone: string;
  guardian2Name: string;
  guardian2Phone: string;
}

export default function ReportsPage() {
  const supabase = createClient();
  const [report, setReport] = useState<StudentReport[]>([]);
  const [filteredReport, setFilteredReport] = useState<StudentReport[]>([]);
  const [summary, setSummary] = useState({ 
    totalCharged: 0, totalPaid: 0, totalOwed: 0, totalCredit: 0,
    term1Owed: 0, term2Owed: 0, term3Owed: 0, schoolName: '',
  });
  const [gradeFilter, setGradeFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [gradeFilter]);
  useEffect(() => { applyFilters(); }, [balanceFilter, termFilter, report]);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    setSchoolId(userData.school_id);
    const sid = userData.school_id;

    // Get school name
    const { data: school } = await supabase.from('schools').select('name').eq('id', sid).single();
    const schoolName = school?.name || 'School';

    const { data: feeData } = await supabase.from('fee_structures').select('grade, amount, term, name').eq('school_id', sid);
    const gradeTermCharged: Record<string, Record<string, number>> = {};
    if (feeData) {
      feeData.forEach(f => {
        if (!gradeTermCharged[f.grade]) gradeTermCharged[f.grade] = { term1: 0, term2: 0, term3: 0 };
        gradeTermCharged[f.grade][f.term] = (gradeTermCharged[f.grade][f.term] || 0) + f.amount;
      });
    }

    let studentQuery = supabase.from('students').select('id, first_name, last_name, admission_number, grade, stream, house').eq('school_id', sid).eq('status', 'active');
    if (gradeFilter !== 'all') studentQuery = studentQuery.eq('grade', gradeFilter);
    const { data: students } = await studentQuery.order('grade').order('first_name');
    if (!students) { setIsLoading(false); return; }

    const reportData: StudentReport[] = [];
    for (const student of students) {
      const gradeCharges = gradeTermCharged[student.grade] || { term1: 0, term2: 0, term3: 0 };
      const { data: allPayments } = await supabase.from('payments').select('amount, term').eq('student_id', student.id);
      const termPaid: Record<string, number> = { term1: 0, term2: 0, term3: 0 };
      if (allPayments) allPayments.forEach(p => { termPaid[p.term] = (termPaid[p.term] || 0) + p.amount; });

      const t1Bal = gradeCharges.term1 - (termPaid.term1 || 0);
      const carryToT2 = t1Bal < 0 ? Math.abs(t1Bal) : 0;
      const t2Bal = gradeCharges.term2 - ((termPaid.term2 || 0) + carryToT2);
      const carryToT3 = t2Bal < 0 ? Math.abs(t2Bal) : 0;
      const t3Bal = gradeCharges.term3 - ((termPaid.term3 || 0) + carryToT3);

      const totalChargedAll = gradeCharges.term1 + gradeCharges.term2 + gradeCharges.term3;
      const totalPaidAll = (termPaid.term1 || 0) + (termPaid.term2 || 0) + (termPaid.term3 || 0);

      const { data: guardians } = await supabase.from('guardians').select('full_name, phone_number, is_primary').eq('student_id', student.id);
      const primary = guardians?.find(g => g.is_primary);
      const secondary = guardians?.find(g => !g.is_primary);

      reportData.push({
        id: student.id, name: `${student.first_name} ${student.last_name}`, admission: student.admission_number,
        grade: student.grade, stream: student.stream || '', house: student.house || '',
        term1: { term: 'term1', charged: gradeCharges.term1, paid: termPaid.term1 || 0, balance: t1Bal, carriedOver: 0 },
        term2: { term: 'term2', charged: gradeCharges.term2, paid: (termPaid.term2 || 0) + carryToT2, balance: t2Bal, carriedOver: carryToT2 },
        term3: { term: 'term3', charged: gradeCharges.term3, paid: (termPaid.term3 || 0) + carryToT3, balance: t3Bal, carriedOver: carryToT3 },
        totalCharged: totalChargedAll, totalPaid: totalPaidAll, totalBalance: totalChargedAll - totalPaidAll,
        guardianName: primary?.full_name || '', guardianPhone: primary?.phone_number || '',
        guardian2Name: secondary?.full_name || '', guardian2Phone: secondary?.phone_number || '',
      });
    }

    setReport(reportData); setFilteredReport(reportData);
    setSummary({
      totalCharged: reportData.reduce((s, r) => s + r.totalCharged, 0),
      totalPaid: reportData.reduce((s, r) => s + r.totalPaid, 0),
      totalOwed: reportData.filter(r => r.totalBalance > 0).reduce((s, r) => s + r.totalBalance, 0),
      totalCredit: reportData.filter(r => r.totalBalance < 0).reduce((s, r) => s + Math.abs(r.totalBalance), 0),
      term1Owed: reportData.filter(r => r.term1.balance > 0).reduce((s, r) => s + r.term1.balance, 0),
      term2Owed: reportData.filter(r => r.term2.balance > 0).reduce((s, r) => s + r.term2.balance, 0),
      term3Owed: reportData.filter(r => r.term3.balance > 0).reduce((s, r) => s + r.term3.balance, 0),
      schoolName,
    });
    setIsLoading(false);
  }

  function applyFilters() {
    let data = [...report];
    if (balanceFilter === 'owing') data = data.filter(r => r.totalBalance > 0);
    else if (balanceFilter === 'overpaid') data = data.filter(r => r.totalBalance < 0);
    else if (balanceFilter === 'cleared') data = data.filter(r => r.totalBalance === 0);
    if (termFilter === 'term1') data = data.filter(r => r.term1.balance > 0);
    else if (termFilter === 'term2') data = data.filter(r => r.term2.balance > 0);
    else if (termFilter === 'term3') data = data.filter(r => r.term3.balance > 0);
    setFilteredReport(data);
  }

  function exportCSV(dataToExport: StudentReport[], label: string) {
    const headers = ['Name','Admission No','Grade','Stream','House','T1 Charged','T1 Paid','T1 Balance','T2 Charged','T2 Paid','T2 Balance','T3 Charged','T3 Paid','T3 Balance','Total Charged','Total Paid','Total Balance','Status','Primary Guardian','Primary Phone','Second Guardian','Second Phone'];
    const rows = dataToExport.map(r => [r.name,r.admission,r.grade,r.stream,r.house,r.term1.charged,r.term1.paid,r.term1.balance,r.term2.charged,r.term2.paid,r.term2.balance,r.term3.charged,r.term3.paid,r.term3.balance,r.totalCharged,r.totalPaid,r.totalBalance,r.totalBalance>0?'Owing':r.totalBalance<0?'Overpaid':'Cleared',r.guardianName,r.guardianPhone,r.guardian2Name,r.guardian2Phone]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-report-${label}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${label} exported! (${dataToExport.length} students)`);
  }

  // Generate printable fee structure per grade
  function printGradeStructure(grade: string) {
    const gradeStudents = report.filter(r => r.grade === grade);
    const gradeTotal = gradeStudents.reduce((s, r) => s + r.totalCharged, 0);
    const gradePaid = gradeStudents.reduce((s, r) => s + r.totalPaid, 0);
    const gradeOwed = gradeStudents.filter(r => r.totalBalance > 0).reduce((s, r) => s + r.totalBalance, 0);

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const html = `
      <html>
      <head><title>Grade ${grade} - Fee Structure</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-box { flex: 1; padding: 10px; border: 1px solid #ddd; text-align: center; border-radius: 8px; }
        .summary-box h3 { margin: 0; font-size: 14px; color: #666; }
        .summary-box p { margin: 5px 0 0; font-size: 18px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f8f8f8; padding: 8px; text-align: left; border-bottom: 2px solid #333; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .owes { color: #dc2626; font-weight: bold; }
        .over { color: #059669; }
        .cleared { color: #666; }
        .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #999; }
        @media print { body { padding: 0; } }
      </style></head>
      <body>
        <div class="header">
          <h1>${summary.schoolName}</h1>
          <p>Grade ${grade} - Fee Structure & Balances</p>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="summary">
          <div class="summary-box"><h3>Total Charged</h3><p>KES ${gradeTotal.toLocaleString()}</p></div>
          <div class="summary-box"><h3>Total Paid</h3><p>KES ${gradePaid.toLocaleString()}</p></div>
          <div class="summary-box"><h3>Outstanding</h3><p style="color:#dc2626">KES ${gradeOwed.toLocaleString()}</p></div>
          <div class="summary-box"><h3>Students</h3><p>${gradeStudents.length}</p></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Student</th><th>Adm No</th><th>Stream</th><th>House</th><th>T1 Bal</th><th>T2 Bal</th><th>T3 Bal</th><th>Total Balance</th><th>Status</th></tr></thead>
          <tbody>
            ${gradeStudents.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.name}</td>
                <td>${r.admission}</td>
                <td>${r.stream}</td>
                <td>${r.house}</td>
                <td class="${r.term1.balance > 0 ? 'owes' : r.term1.balance < 0 ? 'over' : 'cleared'}">KES ${r.term1.balance.toLocaleString()}</td>
                <td class="${r.term2.balance > 0 ? 'owes' : r.term2.balance < 0 ? 'over' : 'cleared'}">KES ${r.term2.balance.toLocaleString()}</td>
                <td class="${r.term3.balance > 0 ? 'owes' : r.term3.balance < 0 ? 'over' : 'cleared'}">KES ${r.term3.balance.toLocaleString()}</td>
                <td class="${r.totalBalance > 0 ? 'owes' : r.totalBalance < 0 ? 'over' : 'cleared'}">KES ${r.totalBalance.toLocaleString()}</td>
                <td>${r.totalBalance > 0 ? 'OWES' : r.totalBalance < 0 ? 'OVERPAID' : 'CLEARED'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Generated by EDU GATE · ${new Date().toLocaleString()}</div>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }

  // Group students by grade for summary cards
  const gradeGroups = { '10': report.filter(r => r.grade === '10'), '11': report.filter(r => r.grade === '11'), '12': report.filter(r => r.grade === '12') };

  const owingStudents = report.filter(r => r.totalBalance > 0);
  const overpaidStudents = report.filter(r => r.totalBalance < 0);
  const clearedStudents = report.filter(r => r.totalBalance === 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Reports</h1>
          <p className="text-slate-500 mt-1">{summary.schoolName} · Overpayments auto-carry to next term</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600">
              <Download className="mr-2 h-4 w-4" /> Export <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={() => exportCSV(report, 'all-students')}>📋 All Students ({report.length})</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(owingStudents, 'arrears')}>🔴 Arrears ({owingStudents.length})</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(overpaidStudents, 'overpaid')}>🟢 Overpaid ({overpaidStudents.length})</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(clearedStudents, 'cleared')}>✅ Cleared ({clearedStudents.length})</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(filteredReport, 'current-filter')}>📌 Current View ({filteredReport.length})</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grade Summary Cards with Print */}
      <div className="grid grid-cols-3 gap-4">
        {(['10', '11', '12'] as const).map(grade => {
          const students = gradeGroups[grade];
          const totalOwed = students.filter(r => r.totalBalance > 0).reduce((s, r) => s + r.totalBalance, 0);
          const totalPaid = students.reduce((s, r) => s + r.totalPaid, 0);
          return (
            <Card key={grade} className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">Grade {grade}</h3>
                  <Button variant="outline" size="sm" onClick={() => printGradeStructure(grade)}>
                    <Printer className="h-3 w-3 mr-1" /> Print
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Students</span><span className="font-bold">{students.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Total Paid</span><span className="font-bold text-emerald-600">KES {totalPaid.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Arrears</span><span className="font-bold text-red-600">KES {totalOwed.toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">KES {summary.totalCharged.toLocaleString()}</p><p className="text-xs text-slate-500">Total Charged</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><TrendingUp className="h-6 w-6 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">KES {summary.totalPaid.toLocaleString()}</p><p className="text-xs text-slate-500">Total Paid</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><AlertCircle className="h-6 w-6 mx-auto text-red-600 mb-1" /><p className="text-2xl font-bold">KES {summary.totalOwed.toLocaleString()}</p><p className="text-xs text-slate-500">Outstanding</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><TrendingDown className="h-6 w-6 mx-auto text-purple-600 mb-1" /><p className="text-2xl font-bold">KES {summary.totalCredit.toLocaleString()}</p><p className="text-xs text-slate-500">Overpaid</p></CardContent></Card>
      </div>

      {/* Term Arrears */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-orange-50"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-orange-700">KES {summary.term1Owed.toLocaleString()}</p><p className="text-xs text-orange-600">Term 1 Arrears</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-amber-50"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-amber-700">KES {summary.term2Owed.toLocaleString()}</p><p className="text-xs text-amber-600">Term 2 Arrears</p></CardContent></Card>
        <Card className="border-0 shadow-sm bg-yellow-50"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-yellow-700">KES {summary.term3Owed.toLocaleString()}</p><p className="text-xs text-yellow-600">Term 3 Arrears</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Student Balances</CardTitle>
            <div className="flex gap-2">
              <Select value={gradeFilter} onValueChange={setGradeFilter}><SelectTrigger className="w-28"><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent><SelectItem value="all">All Grades</SelectItem><SelectItem value="10">Grade 10</SelectItem><SelectItem value="11">Grade 11</SelectItem><SelectItem value="12">Grade 12</SelectItem></SelectContent></Select>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Balance" /></SelectTrigger><SelectContent><SelectItem value="all">All Students</SelectItem><SelectItem value="owing">🔴 Total Arrears</SelectItem><SelectItem value="overpaid">🟢 Overpaid</SelectItem><SelectItem value="cleared">✅ Cleared</SelectItem></SelectContent></Select>
              <Select value={termFilter} onValueChange={setTermFilter}><SelectTrigger className="w-36"><SelectValue placeholder="Term" /></SelectTrigger><SelectContent><SelectItem value="all">All Terms</SelectItem><SelectItem value="term1">📅 Term 1 Arrears</SelectItem><SelectItem value="term2">📅 Term 2 Arrears</SelectItem><SelectItem value="term3">📅 Term 3 Arrears</SelectItem></SelectContent></Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Gr</TableHead><TableHead>Term 1</TableHead><TableHead>Term 2</TableHead><TableHead>Term 3</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredReport.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No students match filters.</TableCell></TableRow> :
                filteredReport.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><p className="font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.admission}</p></TableCell>
                    <TableCell>G{r.grade}</TableCell>
                    <TableCell>{r.term1.balance > 0 ? <Badge className="bg-red-100 text-red-700">KES {r.term1.balance.toLocaleString()}</Badge> : r.term1.balance < 0 ? <Badge className="bg-emerald-100 text-emerald-700">-KES {Math.abs(r.term1.balance).toLocaleString()}</Badge> : <Badge className="bg-slate-100">✓</Badge>}</TableCell>
                    <TableCell>{r.term2.carriedOver > 0 && <span className="text-xs text-blue-500 block">+KES {r.term2.carriedOver.toLocaleString()}</span>}{r.term2.balance > 0 ? <Badge className="bg-red-100 text-red-700">KES {r.term2.balance.toLocaleString()}</Badge> : r.term2.balance < 0 ? <Badge className="bg-emerald-100 text-emerald-700">-KES {Math.abs(r.term2.balance).toLocaleString()}</Badge> : <Badge className="bg-slate-100">✓</Badge>}</TableCell>
                    <TableCell>{r.term3.carriedOver > 0 && <span className="text-xs text-blue-500 block">+KES {r.term3.carriedOver.toLocaleString()}</span>}{r.term3.balance > 0 ? <Badge className="bg-red-100 text-red-700">KES {r.term3.balance.toLocaleString()}</Badge> : r.term3.balance < 0 ? <Badge className="bg-emerald-100 text-emerald-700">-KES {Math.abs(r.term3.balance).toLocaleString()}</Badge> : <Badge className="bg-slate-100">✓</Badge>}</TableCell>
                    <TableCell><Badge className={`text-base px-3 py-1 ${r.totalBalance > 0 ? 'bg-red-100 text-red-700 font-bold' : r.totalBalance < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>KES {r.totalBalance.toLocaleString()}</Badge></TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

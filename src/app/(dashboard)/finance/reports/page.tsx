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
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface StudentReport {
  id: string;
  name: string;
  admission: string;
  grade: string;
  stream: string;
  house: string;
  charged: number;
  paid: number;
  balance: number;
  guardianName: string;
  guardianPhone: string;
  guardian2Name: string;
  guardian2Phone: string;
}

export default function ReportsPage() {
  const supabase = createClient();
  const [report, setReport] = useState<StudentReport[]>([]);
  const [filteredReport, setFilteredReport] = useState<StudentReport[]>([]);
  const [summary, setSummary] = useState({ totalCharged: 0, totalPaid: 0, totalOwed: 0, totalCredit: 0 });
  const [gradeFilter, setGradeFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    loadData();
  }, [gradeFilter]);

  useEffect(() => {
    applyFilters();
  }, [balanceFilter, report]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const sid = userData.school_id;

    // Get fee structure totals per grade
    const { data: feeData } = await supabase
      .from('fee_structures').select('grade, amount').eq('school_id', sid);

    const gradeTotalCharged: Record<string, number> = {};
    if (feeData) {
      feeData.forEach(f => {
        gradeTotalCharged[f.grade] = (gradeTotalCharged[f.grade] || 0) + f.amount;
      });
    }

    // Get students
    let studentQuery = supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade, stream, house')
      .eq('school_id', sid)
      .eq('status', 'active');

    if (gradeFilter !== 'all') {
      studentQuery = studentQuery.eq('grade', gradeFilter);
    }

    const { data: students } = await studentQuery.order('first_name');
    if (!students) return;

    // Get guardians for each student
    const reportData: StudentReport[] = [];

    for (const student of students) {
      const charged = gradeTotalCharged[student.grade] || 0;

      // Get payments
      const { data: payments } = await supabase
        .from('payments').select('amount').eq('student_id', student.id);
      const paid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Get guardians
      const { data: guardians } = await supabase
        .from('guardians').select('full_name, phone_number, is_primary').eq('student_id', student.id);

      const primary = guardians?.find(g => g.is_primary);
      const secondary = guardians?.find(g => !g.is_primary);

      reportData.push({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admission: student.admission_number,
        grade: student.grade,
        stream: student.stream || '',
        house: student.house || '',
        charged,
        paid,
        balance: charged - paid,
        guardianName: primary?.full_name || '',
        guardianPhone: primary?.phone_number || '',
        guardian2Name: secondary?.full_name || '',
        guardian2Phone: secondary?.phone_number || '',
      });
    }

    setReport(reportData);
    setFilteredReport(reportData);
    setSummary({
      totalCharged: reportData.reduce((s, r) => s + r.charged, 0),
      totalPaid: reportData.reduce((s, r) => s + r.paid, 0),
      totalOwed: reportData.filter(r => r.balance > 0).reduce((s, r) => s + r.balance, 0),
      totalCredit: reportData.filter(r => r.balance < 0).reduce((s, r) => s + Math.abs(r.balance), 0),
    });
  }

  function applyFilters() {
    let data = [...report];

    if (balanceFilter === 'owing') {
      data = data.filter(r => r.balance > 0);
    } else if (balanceFilter === 'overpaid') {
      data = data.filter(r => r.balance < 0);
    } else if (balanceFilter === 'cleared') {
      data = data.filter(r => r.balance === 0);
    }

    setFilteredReport(data);
  }

  function exportCSV() {
    const headers = [
      'Name', 'Admission No', 'Grade', 'Stream', 'House',
      'Charged (KES)', 'Paid (KES)', 'Balance (KES)', 'Status',
      'Primary Guardian', 'Primary Phone', 'Second Guardian', 'Second Phone'
    ];

    const rows = filteredReport.map(r => [
      r.name,
      r.admission,
      r.grade,
      r.stream,
      r.house,
      r.charged,
      r.paid,
      r.balance,
      r.balance > 0 ? 'Owing' : r.balance < 0 ? 'Overpaid' : 'Cleared',
      r.guardianName,
      r.guardianPhone,
      r.guardian2Name,
      r.guardian2Phone,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  }

  const filterLabel = balanceFilter === 'owing' ? 'Arrears' : balanceFilter === 'overpaid' ? 'Overpaid' : balanceFilter === 'cleared' ? 'Cleared' : 'All';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Reports</h1>
          <p className="text-slate-500 mt-1">Balance = Fee Structure Total - Payments Made</p>
        </div>
        <Button onClick={exportCSV} className="bg-gradient-to-r from-blue-600 to-emerald-600">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-1" />
          <p className="text-2xl font-bold">KES {summary.totalCharged.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total Charged</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
          <p className="text-2xl font-bold">KES {summary.totalPaid.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total Paid</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <AlertCircle className="h-6 w-6 mx-auto text-red-600 mb-1" />
          <p className="text-2xl font-bold">KES {summary.totalOwed.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Outstanding</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <TrendingDown className="h-6 w-6 mx-auto text-purple-600 mb-1" />
          <p className="text-2xl font-bold">KES {summary.totalCredit.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Overpaid</p>
        </CardContent></Card>
      </div>

      {/* Filters + Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" /> Student Balances
              {filterLabel !== 'All' && (
                <Badge className="ml-2 bg-blue-100 text-blue-700">{filterLabel}: {filteredReport.length} students</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-28"><SelectValue placeholder="Grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Balance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="owing">🔴 Arrears (Owes)</SelectItem>
                  <SelectItem value="overpaid">🟢 Overpaid</SelectItem>
                  <SelectItem value="cleared">✅ Cleared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Charged</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReport.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No students match the selected filters.
                </TableCell></TableRow>
              ) : (
                filteredReport.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.admission}</p>
                    </TableCell>
                    <TableCell>Grade {r.grade}</TableCell>
                    <TableCell className="text-slate-500">{r.stream || '-'}</TableCell>
                    <TableCell className="text-slate-500">{r.house || '-'}</TableCell>
                    <TableCell>KES {r.charged.toLocaleString()}</TableCell>
                    <TableCell>KES {r.paid.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={r.balance > 0 ? 'bg-red-100 text-red-700' : r.balance < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>
                        KES {r.balance.toLocaleString()} {r.balance > 0 ? '(owes)' : r.balance < 0 ? '(overpaid)' : '(cleared)'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

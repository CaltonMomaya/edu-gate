'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

interface StudentReport {
  id: string;
  name: string;
  admission: string;
  grade: string;
  charged: number;
  paid: number;
  balance: number;
}

export default function ReportsPage() {
  const supabase = createClient();
  const [report, setReport] = useState<StudentReport[]>([]);
  const [summary, setSummary] = useState({ totalCharged: 0, totalPaid: 0, totalOwed: 0, totalCredit: 0 });
  const [gradeFilter, setGradeFilter] = useState('all');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    loadData();
  }, [gradeFilter]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const sid = userData.school_id;

    // Get fee structure totals per grade
    const { data: feeData } = await supabase
      .from('fee_structures')
      .select('grade, amount')
      .eq('school_id', sid);

    // Calculate total charged per grade
    const gradeTotalCharged: Record<string, number> = {};
    if (feeData) {
      feeData.forEach(f => {
        gradeTotalCharged[f.grade] = (gradeTotalCharged[f.grade] || 0) + f.amount;
      });
    }

    // Get students
    let studentQuery = supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade')
      .eq('school_id', sid)
      .eq('status', 'active');

    if (gradeFilter !== 'all') {
      studentQuery = studentQuery.eq('grade', gradeFilter);
    }

    const { data: students } = await studentQuery.order('first_name');

    if (!students) return;

    // Get payments per student
    const reportData: StudentReport[] = [];

    for (const student of students) {
      const charged = gradeTotalCharged[student.grade] || 0;

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('student_id', student.id);

      const paid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const balance = charged - paid;

      reportData.push({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        admission: student.admission_number,
        grade: student.grade,
        charged,
        paid,
        balance,
      });
    }

    setReport(reportData);
    setSummary({
      totalCharged: reportData.reduce((s, r) => s + r.charged, 0),
      totalPaid: reportData.reduce((s, r) => s + r.paid, 0),
      totalOwed: reportData.filter(r => r.balance > 0).reduce((s, r) => s + r.balance, 0),
      totalCredit: reportData.filter(r => r.balance < 0).reduce((s, r) => s + Math.abs(r.balance), 0),
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Finance Reports</h1>
        <p className="text-slate-500 mt-1">Balance = Fee Structure Total (per grade) - Payments Made</p>
      </div>

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

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Balances</CardTitle>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Charged</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No data. Set fee structures first.</TableCell></TableRow>
              ) : (
                report.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>Grade {r.grade}</TableCell>
                    <TableCell>KES {r.charged.toLocaleString()}</TableCell>
                    <TableCell>KES {r.paid.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={r.balance > 0 ? 'bg-red-100 text-red-700' : r.balance < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>
                        KES {r.balance.toLocaleString()} {r.balance > 0 ? '(owes)' : r.balance < 0 ? '(overpaid)' : '(settled)'}
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

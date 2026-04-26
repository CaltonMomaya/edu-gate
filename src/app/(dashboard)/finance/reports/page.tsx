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
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle } from 'lucide-react';

interface StudentBalance {
  student_id: string;
  total_charged: number;
  total_paid: number;
  balance: number;
  students: {
    first_name: string;
    last_name: string;
    admission_number: string;
    grade: string;
  };
}

export default function ReportsPage() {
  const supabase = createClient();
  const [balances, setBalances] = useState<StudentBalance[]>([]);
  const [summary, setSummary] = useState({ totalCharged: 0, totalPaid: 0, totalOwed: 0, totalOverpaid: 0 });
  const [gradeFilter, setGradeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [gradeFilter]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    let query = supabase
      .from('student_fee_balances')
      .select('*, students(first_name, last_name, admission_number, grade)')
      .eq('school_id', userData.school_id);

    if (gradeFilter !== 'all') {
      query = query.eq('students.grade', gradeFilter);
    }

    const { data } = await query.order('balance', { ascending: false });

    if (data) {
      setBalances(data);
      setSummary({
        totalCharged: data.reduce((sum, b) => sum + (b.total_charged || 0), 0),
        totalPaid: data.reduce((sum, b) => sum + (b.total_paid || 0), 0),
        totalOwed: data.filter(b => b.balance > 0).reduce((sum, b) => sum + b.balance, 0),
        totalOverpaid: data.filter(b => b.balance < 0).reduce((sum, b) => sum + Math.abs(b.balance), 0),
      });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Finance Reports</h1>
        <p className="text-slate-500 mt-1">Overview of fee collection and outstanding balances</p>
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
          <p className="text-xs text-slate-500">Total Collected</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <AlertCircle className="h-6 w-6 mx-auto text-red-600 mb-1" />
          <p className="text-2xl font-bold">KES {summary.totalOwed.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Outstanding</p>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
          <TrendingDown className="h-6 w-6 mx-auto text-purple-600 mb-1" />
          <p className="text-2xl font-bold">KES {summary.totalOverpaid.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Overpaid</p>
        </CardContent></Card>
      </div>

      {/* Student Balances */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Fee Balances</CardTitle>
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
              {balances.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No fee records yet.</TableCell></TableRow>
              ) : (
                balances.map((b) => (
                  <TableRow key={b.student_id}>
                    <TableCell className="font-medium">{b.students?.first_name} {b.students?.last_name}</TableCell>
                    <TableCell>Grade {b.students?.grade}</TableCell>
                    <TableCell>KES {b.total_charged?.toLocaleString()}</TableCell>
                    <TableCell>KES {b.total_paid?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={b.balance > 0 ? 'bg-red-100 text-red-700' : b.balance < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>
                        KES {Math.abs(b.balance).toLocaleString()} {b.balance > 0 ? 'owed' : b.balance < 0 ? 'overpaid' : 'settled'}
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

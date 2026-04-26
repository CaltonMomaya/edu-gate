'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Loader2, DollarSign, Receipt } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
}

interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_method: string;
  transaction_ref: string;
  payment_date: string;
  academic_year: string;
  term: string;
  students: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
}

export default function PaymentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Form state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [transRef, setTransRef] = useState('');
  const [academicYear, setAcademicYear] = useState('2026');
  const [term, setTerm] = useState('term1');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade')
      .eq('school_id', userData.school_id)
      .order('first_name');

    if (studentsData) setStudents(studentsData);

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, students(first_name, last_name, admission_number)')
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (paymentsData) setPayments(paymentsData);
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !amount) {
      toast.error('Select a student and enter an amount');
      return;
    }

    setIsLoading(true);
    const paymentAmount = parseFloat(amount);

    // 1. Insert payment
    const { error } = await supabase.from('payments').insert({
      student_id: selectedStudent,
      school_id: schoolId,
      amount: paymentAmount,
      payment_method: method,
      transaction_ref: transRef || null,
      academic_year: academicYear,
      term: term,
      payment_date: new Date().toISOString().split('T')[0],
    });

    if (error) {
      toast.error('Failed to record payment');
      setIsLoading(false);
      return;
    }

    // 2. Update or create fee balance
    const { data: existingBalance } = await supabase
      .from('student_fee_balances')
      .select('*')
      .eq('student_id', selectedStudent)
      .eq('academic_year', academicYear)
      .single();

    if (existingBalance) {
      const newPaid = existingBalance.total_paid + paymentAmount;
      const newBalance = existingBalance.total_charged - newPaid;
      await supabase
        .from('student_fee_balances')
        .update({
          total_paid: newPaid,
          balance: newBalance,
          overpayment: newBalance < 0 ? Math.abs(newBalance) : 0,
        })
        .eq('id', existingBalance.id);
    } else {
      await supabase.from('student_fee_balances').insert({
        student_id: selectedStudent,
        school_id: schoolId,
        total_charged: 0,
        total_paid: paymentAmount,
        balance: -paymentAmount, // Negative = overpayment
        overpayment: paymentAmount,
        academic_year: academicYear,
      });
    }

    toast.success(`KES ${paymentAmount.toLocaleString()} recorded successfully!`);
    setAmount('');
    setTransRef('');
    setSelectedStudent('');
    loadData();
    setIsLoading(false);
  }

  const filteredStudents = students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || s.admission_number.includes(search);
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-slate-500 mt-1">Record and track student fee payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Payment Form */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" /> Record Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={recordPayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Student *</Label>
                <div className="relative">
                  <Input
                    placeholder="Search student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-1"
                  />
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {filteredStudents.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} ({s.admission_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount (KES) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 15000" />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Transaction Ref (Optional)</Label>
                <Input value={transRef} onChange={(e) => setTransRef(e.target.value)} placeholder="M-Pesa code or receipt no." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="term1">Term 1</SelectItem>
                      <SelectItem value="term2">Term 2</SelectItem>
                      <SelectItem value="term3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><DollarSign className="mr-1 h-4 w-4" /> Record Payment</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" /> Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Term</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      No payments recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.students?.first_name} {p.students?.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700">KES {p.amount.toLocaleString()}</Badge>
                      </TableCell>
                      <TableCell className="capitalize text-slate-500">{p.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-500">{p.term} / {p.academic_year}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

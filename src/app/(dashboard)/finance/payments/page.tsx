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

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showResults, setShowResults] = useState(false);

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
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade')
      .eq('school_id', userData.school_id)
      .eq('status', 'active')
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

  const filteredStudents = students.filter(s => {
    if (!studentSearch) return false;
    const query = studentSearch.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(query) ||
      s.last_name.toLowerCase().includes(query) ||
      s.admission_number.toLowerCase().includes(query)
    );
  });

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setStudentSearch(`${student.first_name} ${student.last_name} (${student.admission_number})`);
    setShowResults(false);
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !amount) {
      toast.error('Search, select a student, and enter an amount');
      return;
    }

    setIsLoading(true);
    const paymentAmount = parseFloat(amount);

    // 1. Insert payment
    const { error } = await supabase.from('payments').insert({
      student_id: selectedStudent.id,
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

    // 2. Update fee balance - FIXED LOGIC
    const { data: existingBalance } = await supabase
      .from('student_fee_balances')
      .select('*')
      .eq('student_id', selectedStudent.id)
      .eq('academic_year', academicYear)
      .single();

    if (existingBalance) {
      const newTotalPaid = existingBalance.total_paid + paymentAmount;
      // Balance = Charged - Paid (positive = owes, negative = overpaid)
      const newBalance = existingBalance.total_charged - newTotalPaid;
      
      await supabase.from('student_fee_balances').update({
        total_paid: newTotalPaid,
        balance: newBalance,
        overpayment: newBalance < 0 ? Math.abs(newBalance) : 0,
      }).eq('id', existingBalance.id);
    } else {
      // No fee structure set yet, just record payment as credit
      await supabase.from('student_fee_balances').insert({
        student_id: selectedStudent.id,
        school_id: schoolId,
        total_charged: 0,
        total_paid: paymentAmount,
        balance: -paymentAmount, // Negative = credit/overpayment since nothing charged
        overpayment: paymentAmount,
        academic_year: academicYear,
      });
    }

    toast.success(`KES ${paymentAmount.toLocaleString()} recorded for ${selectedStudent.first_name}!`);
    setAmount('');
    setTransRef('');
    setSelectedStudent(null);
    setStudentSearch('');
    loadData();
    setIsLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-slate-500 mt-1">Record and track student fee payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-600" /> Record Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={recordPayment} className="space-y-4">
              <div className="space-y-2 relative">
                <Label>Search Student *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Type name or admission number..."
                    className="pl-10"
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                  />
                </div>
                {showResults && studentSearch && !selectedStudent && (
                  <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                    {filteredStudents.length === 0 ? (
                      <p className="p-3 text-sm text-slate-500">No students found</p>
                    ) : (
                      filteredStudents.slice(0, 20).map((s) => (
                        <button key={s.id} type="button" className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b" onClick={() => selectStudent(s)}>
                          <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-slate-500">{s.admission_number} · Grade {s.grade}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedStudent && (
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <div><p className="font-medium text-sm">{selectedStudent.first_name} {selectedStudent.last_name}</p><p className="text-xs text-slate-500">{selectedStudent.admission_number}</p></div>
                    <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-red-500 text-xs">Change</button>
                  </div>
                )}
              </div>
              <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 15000" /></div>
              <div className="space-y-2"><Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mpesa">M-Pesa</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Transaction Ref</Label><Input value={transRef} onChange={(e) => setTransRef(e.target.value)} placeholder="M-Pesa code or receipt" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Term</Label>
                  <Select value={term} onValueChange={setTerm}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Year</Label><Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} /></div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><DollarSign className="mr-1 h-4 w-4" /> Record Payment</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-blue-600" /> Recent Payments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No payments yet.</TableCell></TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.students?.first_name} {p.students?.last_name}</TableCell>
                      <TableCell><Badge className="bg-emerald-100 text-emerald-700">KES {p.amount.toLocaleString()}</Badge></TableCell>
                      <TableCell className="capitalize text-slate-500">{p.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
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

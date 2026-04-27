'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendEmail, paymentReceiptEmail } from '@/lib/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Loader2, DollarSign, Receipt } from 'lucide-react';

interface Student {
  id: string; first_name: string; last_name: string; admission_number: string; grade: string;
}
interface Payment {
  id: string; student_id: string; amount: number; payment_method: string; transaction_ref: string;
  payment_date: string; academic_year: string; term: string;
  students: { first_name: string; last_name: string; admission_number: string };
}

export default function PaymentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [transRef, setTransRef] = useState('');
  const [academicYear, setAcademicYear] = useState('2026');
  const [term, setTerm] = useState('term1');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: school } = await supabase.from('schools').select('name').eq('id', userData.school_id).single();
    if (school) setSchoolName(school.name);

    const { data: s } = await supabase.from('students').select('id, first_name, last_name, admission_number, grade').eq('school_id', userData.school_id).eq('status', 'active').order('first_name');
    if (s) setStudents(s);

    const { data: p } = await supabase.from('payments').select('*, students(first_name, last_name, admission_number)').eq('school_id', userData.school_id).order('created_at', { ascending: false }).limit(50);
    if (p) setPayments(p);
  }

  const filteredStudents = students.filter(s => {
    if (!studentSearch) return false;
    const q = studentSearch.toLowerCase();
    return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q);
  });

  function selectStudent(s: Student) { setSelectedStudent(s); setStudentSearch(`${s.first_name} ${s.last_name} (${s.admission_number})`); setShowResults(false); }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !amount) { toast.error('Select student and enter amount'); return; }
    setIsLoading(true);
    const paymentAmount = parseFloat(amount);

    const { error } = await supabase.from('payments').insert({
      student_id: selectedStudent.id, school_id: schoolId, amount: paymentAmount,
      payment_method: method, transaction_ref: transRef || null,
      academic_year: academicYear, term: term, payment_date: new Date().toISOString().split('T')[0],
    });
    if (error) { toast.error('Failed'); setIsLoading(false); return; }

    // Update balance
    const { data: existing } = await supabase.from('student_fee_balances').select('*').eq('student_id', selectedStudent.id).eq('academic_year', academicYear).single();
    if (existing) {
      const newPaid = existing.total_paid + paymentAmount;
      const newBal = existing.total_charged - newPaid;
      await supabase.from('student_fee_balances').update({ total_paid: newPaid, balance: newBal, overpayment: newBal < 0 ? Math.abs(newBal) : 0 }).eq('id', existing.id);
    } else {
      await supabase.from('student_fee_balances').insert({ student_id: selectedStudent.id, school_id: schoolId, total_charged: 0, total_paid: paymentAmount, balance: -paymentAmount, overpayment: paymentAmount, academic_year: academicYear });
    }

    // Send email receipt
    const { data: guardians } = await supabase.from('guardians').select('email, full_name').eq('student_id', selectedStudent.id).eq('is_primary', true).single();
    if (guardians?.email) {
      const result = await sendEmail({
        to: guardians.email,
        subject: `Payment Receipt - ${schoolName}`,
        html: paymentReceiptEmail(
          `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          paymentAmount, 0, new Date().toLocaleDateString(), schoolName
        ),
      });
      if (result.success) toast.success(`Email receipt sent to ${guardians.email}`);
      else console.log('Email not sent:', result.error);
    }

    toast.success(`KES ${paymentAmount.toLocaleString()} recorded!`);
    setAmount(''); setTransRef(''); setSelectedStudent(null); setStudentSearch('');
    loadData(); setIsLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Payments</h1><p className="text-slate-500">Record and track student fee payments</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-600" /> Record Payment</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={recordPayment} className="space-y-4">
              <div className="relative"><Label>Search Student *</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Type name or admission..." className="pl-10" value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); setShowResults(true); }} onFocus={() => setShowResults(true)} /></div>
                {showResults && studentSearch && !selectedStudent && (
                  <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                    {filteredStudents.length === 0 ? <p className="p-3 text-sm text-slate-500">No students</p> :
                      filteredStudents.slice(0, 20).map(s => (
                        <button key={s.id} type="button" className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b" onClick={() => selectStudent(s)}>
                          <p className="font-medium text-sm">{s.first_name} {s.last_name}</p><p className="text-xs text-slate-500">{s.admission_number} · Grade {s.grade}</p>
                        </button>
                      ))
                    }
                  </div>
                )}
                {selectedStudent && <div className="flex justify-between bg-blue-50 p-2 rounded-lg mt-1"><span className="font-medium text-sm">{selectedStudent.first_name} {selectedStudent.last_name}</span><button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-red-500 text-xs">Change</button></div>}
              </div>
              <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 15000" /></div>
              <div className="space-y-2"><Label>Method</Label>
                <Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mpesa">M-Pesa</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Ref</Label><Input value={transRef} onChange={e => setTransRef(e.target.value)} placeholder="Receipt/M-Pesa code" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Term</Label><Select value={term} onValueChange={setTerm}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Year</Label><Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} /></div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><DollarSign className="mr-1 h-4 w-4" />Record Payment</>}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Recent Payments</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>{payments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8">No payments</TableCell></TableRow> :
                payments.map(p => (
                  <TableRow key={p.id}><TableCell className="font-medium">{p.students?.first_name} {p.students?.last_name}</TableCell><TableCell><Badge className="bg-emerald-100 text-emerald-700">KES {p.amount.toLocaleString()}</Badge></TableCell><TableCell className="capitalize text-slate-500">{p.payment_method.replace('_', ' ')}</TableCell><TableCell className="text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</TableCell></TableRow>
                ))}
              </TableBody></Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

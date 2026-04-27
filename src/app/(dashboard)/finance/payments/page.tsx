'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Plus, Search, Loader2, DollarSign, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

interface Student { id: string; first_name: string; last_name: string; admission_number: string; grade: string; }
interface Payment { id: string; student_id: string; amount: number; payment_method: string; transaction_ref: string; payment_date: string; academic_year: string; term: string; students: { first_name: string; last_name: string; admission_number: string }; }

export default function PaymentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [transRef, setTransRef] = useState('');
  const [academicYear, setAcademicYear] = useState('2026');
  const [term, setTerm] = useState('term1');

  useEffect(() => { loadData(); }, [page]);

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

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: p, count } = await supabase.from('payments').select('*, students(first_name, last_name, admission_number)', { count: 'exact' }).eq('school_id', userData.school_id).order('created_at', { ascending: false }).range(from, to);
    if (p) setPayments(p);
    if (count !== null) setTotal(count);
  }

  const filteredStudents = students.filter(s => {
    if (!studentSearch) return false;
    const q = studentSearch.toLowerCase();
    return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q);
  });

  function selectStudent(s: Student) { setSelectedStudent(s); setStudentSearch(`${s.first_name} ${s.last_name}`); }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault(); if (!selectedStudent || !amount) return;
    setIsLoading(true);
    const paymentAmount = parseFloat(amount);
    const { error } = await supabase.from('payments').insert({ student_id: selectedStudent.id, school_id: schoolId, amount: paymentAmount, payment_method: method, transaction_ref: transRef || null, academic_year: academicYear, term: term, payment_date: new Date().toISOString().split('T')[0] });
    if (error) { toast.error('Failed'); setIsLoading(false); return; }

    const { data: existing } = await supabase.from('student_fee_balances').select('*').eq('student_id', selectedStudent.id).eq('academic_year', academicYear).single();
    if (existing) { const np = existing.total_paid + paymentAmount; const nb = existing.total_charged - np; await supabase.from('student_fee_balances').update({ total_paid: np, balance: nb }).eq('id', existing.id); }
    else { await supabase.from('student_fee_balances').insert({ student_id: selectedStudent.id, school_id: schoolId, total_charged: 0, total_paid: paymentAmount, balance: -paymentAmount, academic_year: academicYear }); }

    const { data: guardians } = await supabase.from('guardians').select('email').eq('student_id', selectedStudent.id).eq('is_primary', true).single();
    if (guardians?.email) { await sendEmail({ to: guardians.email, subject: `Payment Receipt - ${schoolName}`, html: paymentReceiptEmail(`${selectedStudent.first_name} ${selectedStudent.last_name}`, paymentAmount, 0, new Date().toLocaleDateString(), schoolName) }); }

    toast.success(`KES ${paymentAmount.toLocaleString()} recorded!`);
    setAmount(''); setTransRef(''); setSelectedStudent(null); setStudentSearch('');
    loadData(); setIsLoading(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Payments</h1></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1"><CardHeader><CardTitle>Record Payment</CardTitle></CardHeader><CardContent><form onSubmit={recordPayment} className="space-y-3">
          <div className="relative"><Input placeholder="Search student..." value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); }} />
            {studentSearch && !selectedStudent && filteredStudents.length > 0 && <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-36 overflow-y-auto">{filteredStudents.slice(0, 20).map(s => <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b" onClick={() => selectStudent(s)}>{s.first_name} {s.last_name} ({s.admission_number})</button>)}</div>}
            {selectedStudent && <p className="text-xs text-emerald-600 mt-1">✅ {selectedStudent.first_name} {selectedStudent.last_name}</p>}
          </div>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (KES)" />
          <Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mpesa">M-Pesa</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent></Select>
          <Input value={transRef} onChange={e => setTransRef(e.target.value)} placeholder="Ref (optional)" />
          <div className="grid grid-cols-2 gap-2"><Select value={term} onValueChange={setTerm}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent></Select><Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="Year" /></div>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record'}</Button>
        </form></CardContent></Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle>Recent Payments ({total})</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>{payments.map(p => (<TableRow key={p.id}><TableCell className="font-medium">{p.students?.first_name} {p.students?.last_name}</TableCell><TableCell><Badge className="bg-emerald-100 text-emerald-700">KES {p.amount.toLocaleString()}</Badge></TableCell><TableCell className="capitalize text-slate-500">{p.payment_method.replace('_', ' ')}</TableCell><TableCell className="text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</TableCell></TableRow>))}</TableBody></Table>
          <div className="flex items-center justify-between mt-4"><p className="text-sm text-slate-500">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button></div></div>
        </CardContent></Card>
      </div>
    </div>
  );
}

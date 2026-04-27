'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Phone, Loader2, Users, BookOpen } from 'lucide-react';
import { sendSms } from '@/lib/sms/send';
import Link from 'next/link';

export default function ParentPortalPage() {
  const supabase = createClient();
  const [step, setStep] = useState<'phone' | 'otp' | 'select' | 'dashboard'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [feeInfo, setFeeInfo] = useState<any>({ total_charged: 0, total_paid: 0, balance: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendOtp() {
    if (phone.length < 9) { toast.error('Enter valid phone'); return; }
    setIsLoading(true);
    const searchPhone = phone.replace(/\s+/g, '').slice(-9);
    const { data: guardians } = await supabase.from('guardians').select('id, full_name, student_id, phone_number').ilike('phone_number', `%${searchPhone}%`);
    if (!guardians || guardians.length === 0) { toast.error('Phone not registered'); setIsLoading(false); return; }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);
    console.log('OTP:', code);
    const g = guardians[0];
    const { data: s } = await supabase.from('students').select('school_id').eq('id', g.student_id).single();
    if (s) await sendSms(g.phone_number, `EDU GATE code: ${code}`, s.school_id, supabase);
    toast.success(`OTP sent to ${g.phone_number}`);
    setStep('otp');
    setIsLoading(false);
  }

  async function verifyOtp() {
    if (otp !== generatedOtp) { toast.error('Invalid code'); return; }
    setIsLoading(true);
    const searchPhone = phone.replace(/\s+/g, '').slice(-9);
    const { data: guardians } = await supabase.from('guardians').select('id, full_name, student_id').ilike('phone_number', `%${searchPhone}%`);

    if (guardians) {
      const seen = new Set<string>();
      const list: any[] = [];
      for (const g of guardians) {
        if (seen.has(g.student_id)) continue;
        seen.add(g.student_id);
        const { data: st } = await supabase.from('students').select('*').eq('id', g.student_id).single();
        if (st) {
          const { data: sc } = await supabase.from('schools').select('name').eq('id', st.school_id).single();
          list.push({ ...st, school_name: sc?.name || '', guardian_name: g.full_name });
        }
      }
      setStudents(list);
      if (list.length === 1) selectStudent(list[0]);
      else setStep('select');
    }
    setIsLoading(false);
  }

  async function selectStudent(s: any) {
    setSelectedStudent(s);
    const { data: fees } = await supabase.from('student_fee_balances').select('*').eq('student_id', s.id).order('academic_year', { ascending: false }).limit(1).single();
    setFeeInfo(fees || { total_charged: 0, total_paid: 0, balance: 0 });

    // Load exam results
    const { data: examResults } = await supabase.from('exam_results').select('*, exam_types(name)').eq('student_id', s.id).order('created_at', { ascending: false }).limit(10);
    setResults(examResults || []);

    setStep('dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6"><h1 className="text-3xl font-bold text-slate-800">Parent Portal</h1><p className="text-slate-500">Access your child's info</p></div>

        {step === 'phone' && (
          <Card className="border-0 shadow-lg"><CardHeader><CardTitle><Phone className="h-5 w-5 inline mr-2" />Enter Phone</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="0712345678" value={phone} onChange={e => setPhone(e.target.value)} className="text-lg h-12 text-center" />
              <Button className="w-full h-12" onClick={sendOtp} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Send OTP'}</Button>
              <Link href="/login" className="block text-center text-sm text-blue-600">Staff Login</Link>
            </CardContent></Card>
        )}

        {step === 'otp' && (
          <Card className="border-0 shadow-lg"><CardHeader><CardTitle>Verify Code</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="0000" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} className="text-2xl h-16 text-center" />
              <Button className="w-full h-12" onClick={verifyOtp}>Verify</Button>
            </CardContent></Card>
        )}

        {step === 'select' && (
          <Card className="border-0 shadow-lg"><CardHeader><CardTitle><Users className="h-5 w-5 inline mr-2" />Select Child</CardTitle></CardHeader>
            <CardContent className="space-y-3">{students.map(s => (
              <button key={s.id} className="w-full p-4 bg-slate-50 rounded-lg hover:bg-blue-50 text-left flex items-center gap-3 border" onClick={() => selectStudent(s)}>
                <Avatar className="h-12 w-12"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white">{s.first_name?.[0]}{s.last_name?.[0]}</AvatarFallback></Avatar>
                <div><p className="font-medium">{s.first_name} {s.last_name}</p><p className="text-sm text-slate-500">{s.school_name} · Grade {s.grade}</p></div>
              </button>
            ))}</CardContent></Card>
        )}

        {step === 'dashboard' && selectedStudent && (
          <div className="space-y-4">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white"><CardContent className="p-6">
              <div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarFallback className="text-xl bg-white text-blue-600">{selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}</AvatarFallback></Avatar>
                <div><p className="text-xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</p><p className="text-white/80">{selectedStudent.school_name}</p><Badge className="bg-white/20 text-white">{selectedStudent.admission_number} · G{selectedStudent.grade}</Badge></div></div>
            </CardContent></Card>

            {/* Fee Balance */}
            <Card><CardHeader><CardTitle>Fee Balance</CardTitle></CardHeader><CardContent>
              <div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xs text-slate-500">Charged</p><p className="text-lg font-bold text-blue-600">KES {(feeInfo.total_charged || 0).toLocaleString()}</p></div><div><p className="text-xs text-slate-500">Paid</p><p className="text-lg font-bold text-emerald-600">KES {(feeInfo.total_paid || 0).toLocaleString()}</p></div><div><p className="text-xs text-slate-500">Balance</p><p className={`text-lg font-bold ${(feeInfo.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>KES {(feeInfo.balance || 0).toLocaleString()}</p></div></div>
            </CardContent></Card>

            {/* Exam Results */}
            {results.length > 0 && (
              <Card><CardHeader><CardTitle><BookOpen className="h-4 w-4 inline mr-2" />Latest Results</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {results.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <div><p className="font-medium text-sm">{r.subject}</p><p className="text-xs text-slate-400">{r.exam_types?.name}</p></div>
                      <Badge className={parseFloat(r.grade) >= 4 || r.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{r.grade || '-'} · {r.score}%</Badge>
                    </div>
                  ))}
                </CardContent></Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Grade</p><p className="text-2xl font-bold">G{selectedStudent.grade}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">Stream</p><p className="text-2xl font-bold">{selectedStudent.stream || '-'}</p></CardContent></Card>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setStep('phone'); setPhone(''); setSelectedStudent(null); }}>Logout</Button>
          </div>
        )}
      </div>
    </div>
  );
}

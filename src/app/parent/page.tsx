'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Phone, Loader2, Users, BookOpen, ArrowLeft, RefreshCw, DollarSign, GraduationCap } from 'lucide-react';
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
  const [cumulativeFees, setCumulativeFees] = useState({ totalCharged: 0, totalPaid: 0, balance: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  async function sendOtp() {
    if (phone.length < 9) { toast.error('Enter valid phone'); return; }
    setIsLoading(true);
    const searchPhone = phone.replace(/\s+/g, '').slice(-9);
    const { data: guardians } = await supabase.from('guardians').select('id, full_name, student_id, phone_number').ilike('phone_number', `%${searchPhone}%`);
    if (!guardians || guardians.length === 0) { toast.error('Phone not registered. Contact school.'); setIsLoading(false); return; }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);
    setOtpCountdown(30);
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

    // CUMULATIVE fees across ALL years
    const { data: allFees } = await supabase.from('student_fee_balances').select('total_charged, total_paid, balance').eq('student_id', s.id);
    if (allFees && allFees.length > 0) {
      const total = allFees.reduce(
        (acc, f) => ({
          totalCharged: acc.totalCharged + (f.total_charged || 0),
          totalPaid: acc.totalPaid + (f.total_paid || 0),
          balance: acc.balance + (f.balance || 0),
        }),
        { totalCharged: 0, totalPaid: 0, balance: 0 }
      );
      setCumulativeFees(total);
    }

    // Load exam results
    const { data: examResults } = await supabase
      .from('exam_results')
      .select('subject, score, grade, exam_types(name)')
      .eq('student_id', s.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (examResults) setResults(examResults);

    setStep('dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Parent Portal</h1>
          <p className="text-slate-500">Access your child's information</p>
        </div>

        {/* STEP 1: Phone */}
        {step === 'phone' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle><Phone className="h-5 w-5 inline mr-2" />Enter Phone Number</CardTitle>
              <CardDescription>Use the number registered with the school</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="0712345678" value={phone} onChange={e => setPhone(e.target.value)} className="text-lg h-12 text-center" />
              <Button className="w-full h-12" onClick={sendOtp} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Send OTP Code'}
              </Button>
              <Link href="/login" className="block text-center text-sm text-blue-600">Staff Login</Link>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('phone')} className="text-slate-500 hover:text-slate-700">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <CardTitle>Verify Code</CardTitle>
              </div>
              <CardDescription>Enter 4-digit code sent to {phone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="0000" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} className="text-2xl h-16 text-center tracking-widest" />
              <Button className="w-full h-12" onClick={verifyOtp} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Verify & Login'}
              </Button>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('phone')} className="text-sm text-blue-600">Change number</button>
                <button
                  onClick={sendOtp}
                  disabled={otpCountdown > 0}
                  className="text-sm text-blue-600 flex items-center gap-1 disabled:text-slate-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Select Student */}
        {step === 'select' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('phone')} className="text-slate-500 hover:text-slate-700">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <CardTitle><Users className="h-5 w-5 inline mr-2" />Select Child</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {students.map(s => (
                <button key={s.id} className="w-full p-4 bg-slate-50 rounded-lg hover:bg-blue-50 text-left flex items-center gap-3 border" onClick={() => selectStudent(s)}>
                  <Avatar className="h-12 w-12"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white">{s.first_name?.[0]}{s.last_name?.[0]}</AvatarFallback></Avatar>
                  <div><p className="font-medium">{s.first_name} {s.last_name}</p><p className="text-sm text-slate-500">{s.school_name} · Grade {s.grade}</p></div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Dashboard */}
        {step === 'dashboard' && selectedStudent && (
          <div className="space-y-4">
            {/* Student Info Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16"><AvatarFallback className="text-xl bg-white text-blue-600">{selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                    <p className="text-white/80">{selectedStudent.school_name}</p>
                    <Badge className="bg-white/20 text-white">{selectedStudent.admission_number} · G{selectedStudent.grade}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cumulative Fee Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />Cumulative Fee Balance (All Years)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500">Total Charged</p>
                    <p className="text-xl font-bold text-blue-600">KES {cumulativeFees.totalCharged.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500">Total Paid</p>
                    <p className="text-xl font-bold text-emerald-600">KES {cumulativeFees.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${cumulativeFees.balance > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className={`text-xl font-bold ${cumulativeFees.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      KES {cumulativeFees.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
                {cumulativeFees.balance > 0 && (
                  <p className="text-xs text-red-500 mt-3 text-center">
                    ⚠️ Outstanding balance of KES {cumulativeFees.balance.toLocaleString()}. Please clear before clearance.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Exam Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />Latest Exam Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No exam results available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {results.map((r, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{r.subject}</p>
                          <p className="text-xs text-slate-400">{r.exam_types?.name || 'Exam'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{r.score}%</p>
                          <Badge className={
                            r.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                            r.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                            r.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>{r.grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="p-4 text-center"><GraduationCap className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">G{selectedStudent.grade}</p><p className="text-xs text-slate-500">Grade</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{selectedStudent.stream || '-'}</p><p className="text-xs text-slate-500">Stream</p></CardContent></Card>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                <ArrowLeft className="mr-1 h-4 w-4" />Switch Child
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setStep('phone'); setPhone(''); setSelectedStudent(null); setResults([]); }}>
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

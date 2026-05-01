'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { logAction } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, CheckCircle, Clock, Loader2, GraduationCap,
  AlertTriangle, Printer, Lock, Send, ArrowRight, DollarSign, BookOpen, Wrench
} from 'lucide-react';

export default function StudentClearancePage() {
  const { id } = useParams();
  const supabase = createClient();
  const [student, setStudent] = useState<any>(null);
  const [clearanceItems, setClearanceItems] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [allCleared, setAllCleared] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [blockedReasons, setBlockedReasons] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentItemId, setCurrentItemId] = useState('');

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    setSchoolId(userData.school_id);

    const { data: stud } = await supabase.from('students').select('*').eq('id', id).single();
    if (stud) setStudent(stud);

    const { data: items } = await supabase
      .from('student_clearance')
      .select('*, departments(name, clearance_order)')
      .eq('student_id', id)
      .order('departments(clearance_order)');

    if (items && items.length > 0) {
      const cleared = items.filter(i => i.status === 'cleared');
      const pending = items.filter(i => i.status !== 'cleared');
      const firstPending = pending[0];
      const firstPendingIndex = items.indexOf(firstPending);

      const hist = cleared.map(i =>
        `${i.departments.name} - cleared ${new Date(i.cleared_at).toLocaleDateString()}`
      );

      if (firstPending) {
        setCurrentStep(firstPending.departments.name);
        setCurrentStepIndex(firstPendingIndex);
        setCurrentItemId(firstPending.id);
        await checkDepartment(firstPending);
      }

      setHistory(hist);
      setClearanceItems(items);
      setAllCleared(pending.length === 0);
    }
    setIsLoading(false);
  }

  async function checkDepartment(item: any) {
    const deptName = item.departments?.name?.toLowerCase() || '';
    const reasons: string[] = [];

    if (deptName.includes('library')) {
      const { data: issues } = await supabase.from('library_issued').select('id, status, book_id').eq('student_id', id);
      if (issues && issues.length > 0) {
        const bookIds = [...new Set(issues.map(i => i.book_id))];
        const { data: books } = await supabase.from('library_books').select('id, title').in('id', bookIds);
        const bookMap: Record<string, string> = {};
        if (books) books.forEach(b => bookMap[b.id] = b.title);
        
        issues.forEach(i => {
          const title = bookMap[i.book_id] || 'Unknown book';
          reasons.push(`📚 "${title}" - ${i.status}`);
        });
      }
    } else if (deptName.includes('finance')) {
      const { data: fees } = await supabase.from('student_fee_balances').select('balance, academic_year').eq('student_id', id);
      const owing = fees?.filter(f => f.balance > 0) || [];
      if (owing.length > 0) {
        const total = owing.reduce((s, f) => s + f.balance, 0);
        reasons.push(`💰 Owes KES ${total.toLocaleString()} across ${owing.length} year(s)`);
        owing.forEach(f => reasons.push(`   → ${f.academic_year}: KES ${f.balance.toLocaleString()}`));
      }
    } else if (deptName.includes('games') || deptName.includes('sport')) {
      const { data: issues } = await supabase.from('games_issued').select('id, status, fine_amount, equipment_id').eq('student_id', id).in('status', ['issued', 'lost', 'broken']);
      if (issues && issues.length > 0) {
        const eqIds = [...new Set(issues.map(i => i.equipment_id))];
        const { data: eqData } = await supabase.from('games_equipment').select('id, name').in('id', eqIds);
        const eqMap: Record<string, string> = {};
        if (eqData) eqData.forEach(e => eqMap[e.id] = e.name);
        issues.forEach(i => {
          const name = eqMap[i.equipment_id] || 'Unknown';
          reasons.push(`⚽ ${name} - ${i.status}${i.fine_amount > 0 ? ` (Fine: KES ${i.fine_amount})` : ''}`);
        });
      }
    } else if (deptName.includes('discipline')) {
      const { data: offenses } = await supabase.from('black_book').select('id, offense').eq('student_id', id).eq('status', 'pending');
      if (offenses && offenses.length > 0) {
        reasons.push(`⚠️ ${offenses.length} pending offense(s)`);
        offenses.forEach(o => reasons.push(`   → ${o.offense?.substring(0, 50)}`));
      }
    } else {
      const { data: issues, error: issErr } = await supabase.from('department_issued').select('id, status, fine_amount, equipment_id').eq('student_id', id).in('status', ['issued', 'lost', 'broken', 'damaged']);
      if (issues && issues.length > 0) {
        const eqIds = [...new Set(issues.map((i: any) => i.equipment_id))];
        const { data: eqData } = await supabase.from('department_equipment').select('id, name').in('id', eqIds);
        const eqMap: Record<string, string> = {};
        if (eqData) eqData.forEach((e: any) => eqMap[e.id] = e.name);
        issues.forEach((i: any) => {
          const name = eqMap[i.equipment_id] || 'Unknown item';
          reasons.push(`🔧 "${name}" - ${i.status}${i.fine_amount > 0 ? ` (Fine: KES ${i.fine_amount})` : ''}`);
        });
      }
    }

    setBlockedReasons(reasons);
    setIsBlocked(reasons.length > 0);
  }

  async function clearCurrentDepartment() {
    if (isBlocked) {
      toast.error('Resolve all issues before clearing');
      return;
    }

    const item = clearanceItems.find((_, i) => i === currentStepIndex);
    if (!item) return;

    const { error } = await supabase.from('student_clearance').update({
      status: 'cleared',
      cleared_at: new Date().toISOString(),
    }).eq('id', item.id);

    if (error) { toast.error('Failed'); return; }

    const nextDept = clearanceItems.find((_, i) => i > currentStepIndex && clearanceItems[i].status !== 'cleared');
    
    await logAction(schoolId, 'clearance_cleared', 'clearance', item.id, {
      department: item.departments.name,
      next: nextDept?.departments?.name || 'Certificate',
    });

    toast.success(`${item.departments.name} cleared! 📨 Next: ${nextDept?.departments?.name || 'Certificate'}`);
    loadData();
  }

  async function overrideAndClear() {
    if (!confirm('Mark all issues as paid/resolved and clear this department?')) return;
    
    const item = clearanceItems.find((_, i) => i === currentStepIndex);
    if (!item) return;
    
    const deptName = item.departments?.name?.toLowerCase() || '';

    // Auto-return/resolve all outstanding items
    if (deptName.includes('library')) {
      await supabase.from('library_issued').update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] }).eq('student_id', id).eq('status', 'issued');
    } else if (deptName.includes('games')) {
      await supabase.from('games_issued').update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] }).eq('student_id', id).eq('status', 'issued');
    } else {
      // Custom department
      await supabase.from('department_issued').update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] }).eq('student_id', id).in('status', ['issued', 'lost', 'broken', 'damaged']);
    }

    // Clear the department
    await supabase.from('student_clearance').update({
      status: 'cleared',
      cleared_at: new Date().toISOString(),
    }).eq('id', item.id);

    toast.success(`All items resolved! Cleared: ${item.departments.name}`);
    loadData();
  }

  function printCertificate() { window.print(); }

  async function issueCertificate() {
    if (!confirm('Issue certificate?')) return;
    await supabase.from('students').update({ status: 'alumni', graduation_date: new Date().toISOString() }).eq('id', id);
    toast.success('Graduated!');
    setShowCertificate(true);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 no-print">
        <Link href="/clearance" className="text-slate-500"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-800">Student Clearance</h1>
      </div>

      {student && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-14 w-14"><AvatarFallback>{student.first_name[0]}{student.last_name[0]}</AvatarFallback></Avatar>
            <div>
              <p className="font-bold text-lg">{student.first_name} {student.last_name}</p>
              <p className="text-sm text-slate-500">{student.admission_number} · Grade {student.grade}</p>
              <Badge className={student.status === 'transferred' ? 'bg-orange-100' : 'bg-blue-100'}>{student.status}</Badge>
            </div>
            <div className="ml-auto">
              {allCleared ? (
                <Badge className="bg-emerald-100 text-emerald-700 text-base px-4 py-2"><CheckCircle className="h-4 w-4 mr-1" />Fully Cleared</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 text-base px-4 py-2"><Clock className="h-4 w-4 mr-1" />In Progress</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Step + Blocked Details */}
      {currentStep && !allCleared && (
        <Card className={`border-0 shadow-sm ${isBlocked ? 'bg-red-50 border-2 border-red-300' : 'bg-blue-50 border border-blue-200'}`}>
          <CardContent className="p-4">
            <p className="font-medium mb-2">
              <Send className="h-4 w-4 inline mr-1" />
              Currently at: <strong>{currentStep}</strong>
            </p>
            
            {isBlocked && (
              <div className="space-y-2">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 inline mr-1 text-red-600" />
                  <span className="text-red-700 font-medium">Clearance Blocked — Issues Found:</span>
                  <ul className="mt-2 space-y-1">
                    {blockedReasons.map((r, i) => (
                      <li key={i} className="text-sm text-red-600 ml-4">{r}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-red-500">Resolve all issues above, then click "Clear & Send Next" or use "Paid/Resolved" to override.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clearance Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Clearance Progress</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {clearanceItems.map((item, index) => {
            const isCleared = item.status === 'cleared';
            const isCurrent = !isCleared && index === currentStepIndex;

            return (
              <div key={item.id}>
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  isCleared ? 'bg-emerald-50 border-emerald-200' :
                  isCurrent ? (isBlocked ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300 ring-1 ring-blue-400') :
                  'bg-slate-50 border-slate-200 opacity-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCleared ? 'bg-emerald-500 text-white' :
                      isCurrent ? (isBlocked ? 'bg-red-500 text-white' : 'bg-blue-500 text-white') :
                      'bg-slate-300 text-slate-600'
                    }`}>{index + 1}</div>
                    <div>
                      <p className="font-medium">{item.departments.name}</p>
                      {isCurrent && !isBlocked && <p className="text-xs text-blue-600">← Ready to clear</p>}
                      {isCurrent && isBlocked && <p className="text-xs text-red-600">⚠️ {blockedReasons.length} issue(s) found</p>}
                      {isCleared && <p className="text-xs text-emerald-600">✅ Cleared</p>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isCurrent && (
                      <>
                        <Button size="sm" onClick={clearCurrentDepartment} disabled={isBlocked} className="bg-blue-600 hover:bg-blue-700">
                          <CheckCircle className="h-4 w-4 mr-1" />Clear & Send Next →
                        </Button>
                        {isBlocked && (
                          <Button size="sm" variant="outline" onClick={overrideAndClear} className="text-amber-600 border-amber-300">
                            <DollarSign className="h-4 w-4 mr-1" />Paid/Resolved
                          </Button>
                        )}
                      </>
                    )}
                    {isCleared && <Badge className="bg-emerald-100 text-emerald-700">Done ✅</Badge>}
                    {!isCurrent && !isCleared && <Badge className="bg-slate-100 text-slate-500"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
                  </div>
                </div>
                {index < clearanceItems.length - 1 && <div className="flex justify-center py-1"><ArrowRight className="h-4 w-4 text-slate-300" /></div>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>History</CardTitle></CardHeader>
          <CardContent>
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600 py-1"><CheckCircle className="h-4 w-4 text-emerald-500" />{h}</div>
            ))}
          </CardContent>
        </Card>
      )}

      {allCleared && !showCertificate && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          <CardContent className="flex items-center justify-between p-6">
            <div><p className="font-bold text-lg">🎓 All Departments Cleared!</p></div>
            <Button className="bg-white text-purple-600" onClick={issueCertificate}><GraduationCap className="mr-2 h-4 w-4" />Issue Certificate</Button>
          </CardContent>
        </Card>
      )}

      {showCertificate && (
        <div>
          <Card className="border-2 border-slate-800 p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">CERTIFICATE OF CLEARANCE</h1>
            <Separator className="my-4 bg-slate-800" />
            <h2 className="text-3xl font-bold mb-2">{student?.first_name} {student?.last_name}</h2>
            <p>Admission: {student?.admission_number}</p>
            <p className="mb-6">Has completed clearance from all departments.</p>
            <div className="grid grid-cols-3 gap-8 mt-8">
              <div><p className="border-t border-slate-800 pt-2">Deputy Principal</p></div>
              <div><p className="border-t border-slate-800 pt-2">Principal</p></div>
              <div><p className="border-t border-slate-800 pt-2">Date</p></div>
            </div>
          </Card>
          <div className="flex justify-center mt-4 no-print"><Button onClick={printCertificate}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
        </div>
      )}

      <style jsx global>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
    </div>
  );
}

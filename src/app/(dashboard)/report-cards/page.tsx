'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendSms } from '@/lib/sms/send';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Printer, Search, Loader2, GraduationCap, FileText, Send, MessageSquare, Users, Eye } from 'lucide-react';

export default function ReportCardsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewList, setPreviewList] = useState<any[]>([]);

  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [streams, setStreams] = useState<string[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data: school } = await supabase.from('schools').select('name').eq('id', userData.school_id).single();
    if (school) setSchoolName(school.name);
    const { data: studs } = await supabase.from('students').select('id, first_name, last_name, admission_number, grade, stream').eq('school_id', userData.school_id).eq('status', 'active').order('last_name');
    if (studs) { setStudents(studs); setStreams([...new Set(studs.map((s: any) => s.stream).filter(Boolean))] as string[]); }
    const { data: examTypes } = await supabase.from('exam_types').select('*').eq('school_id', userData.school_id).order('created_at', { ascending: false });
    if (examTypes) setExams(examTypes);
  }

  async function loadResults(studentId: string) {
    if (!selectedExam) return;
    setIsLoading(true);
    const { data } = await supabase.from('exam_results').select('*').eq('student_id', studentId).eq('exam_type_id', selectedExam).order('subject');
    setResults(data || []);
    setIsLoading(false);
  }

  function selectStudent(s: any) { setSelectedStudent(s); setResults([]); if (selectedExam) loadResults(s.id); }
  function printReport() { window.print(); }

  async function previewRecipients() {
    if (!selectedExam) { toast.error('Select an exam first'); return; }
    setIsLoading(true);
    const list: any[] = [];
    for (const s of filtered) {
      const { data: g } = await supabase.from('guardians').select('full_name, phone_number, relationship').eq('student_id', s.id).eq('is_primary', true).single();
      list.push({ student: `${s.first_name} ${s.last_name}`, grade: s.grade, stream: s.stream, guardian: g?.full_name || 'N/A', phone: g?.phone_number || 'N/A' });
    }
    setPreviewList(list);
    setPreviewOpen(true);
    setIsLoading(false);
  }

  async function sendResultsBulk() {
    if (filtered.length === 0) { toast.error('No students'); return; }
    if (!selectedExam) { toast.error('Select an exam first'); return; }
    if (!confirm(`Send SMS to ${filtered.length} parents?`)) return;
    setIsSending(true); let sent = 0;
    for (const s of filtered) {
      const { data: g } = await supabase.from('guardians').select('phone_number').eq('student_id', s.id).eq('is_primary', true).single();
      if (g?.phone_number) {
        const { data: r } = await supabase.from('exam_results').select('score').eq('student_id', s.id).eq('exam_type_id', selectedExam);
        const avg = r?.length ? (r.reduce((a: number, x: any) => a + x.score, 0) / r.length).toFixed(0) : '-';
        const examName = exams.find(e => e.id === selectedExam)?.name || 'Exam';
        const msg = `${schoolName}: ${s.first_name}'s ${examName} - Avg: ${avg}%. Full report at school.`;
        const result = await sendSms(g.phone_number, msg, schoolId, supabase);
        if (result.success) sent++;
      }
    }
    toast.success(`Sent ${sent}/${filtered.length} SMS`);
    setIsSending(false);
  }

  const calculateGrade = (score: number) => { if (score >= 80) return 'A'; if (score >= 70) return 'A-'; if (score >= 65) return 'B+'; if (score >= 60) return 'B'; if (score >= 55) return 'B-'; if (score >= 50) return 'C+'; if (score >= 45) return 'C'; if (score >= 40) return 'C-'; if (score >= 35) return 'D+'; if (score >= 30) return 'D'; return 'E'; };
  const getGradeColor = (g: string) => { if (g?.startsWith('A')) return 'text-emerald-600 bg-emerald-50'; if (g?.startsWith('B')) return 'text-blue-600 bg-blue-50'; if (g?.startsWith('C')) return 'text-amber-600 bg-amber-50'; return 'text-red-600 bg-red-50'; };
  const avgScore = results.length > 0 ? (results.reduce((s: number, r: any) => s + r.score, 0) / results.length).toFixed(1) : '-';
  const avgGrade = avgScore !== '-' ? calculateGrade(parseFloat(avgScore)) : '-';

  const filtered = students.filter((s: any) => {
    if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
    if (streamFilter !== 'all' && s.stream !== streamFilter) return false;
    if (search && !`${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) && !s.admission_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between no-print">
        <div><h1 className="text-2xl font-bold text-slate-800">Report Cards</h1><p className="text-slate-500">{filtered.length} students</p></div>
        <div className="flex gap-2">
          <Button onClick={previewRecipients} variant="outline"><Eye className="mr-2 h-4 w-4" />Preview Parents ({filtered.length})</Button>
          <Button onClick={sendResultsBulk} disabled={isSending || !selectedExam} className="bg-blue-600"><MessageSquare className="mr-2 h-4 w-4" />Send SMS ({filtered.length})</Button>
          <Button onClick={printReport} className="bg-gradient-to-r from-blue-600 to-emerald-600"><Printer className="mr-2 h-4 w-4" />Print</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={gradeFilter} onValueChange={setGradeFilter}><SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger><SelectContent><SelectItem value="all">All Grades</SelectItem><SelectItem value="10">G10</SelectItem><SelectItem value="11">G11</SelectItem><SelectItem value="12">G12</SelectItem></SelectContent></Select>
        <Select value={streamFilter} onValueChange={setStreamFilter}><SelectTrigger><SelectValue placeholder="Stream" /></SelectTrigger><SelectContent><SelectItem value="all">All Streams</SelectItem>{streams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={selectedExam} onValueChange={v => { setSelectedExam(v); if (selectedStudent) loadResults(selectedStudent.id); }}><SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 no-print">
        <Card className="lg:col-span-1 max-h-96 overflow-y-auto"><CardHeader><CardTitle className="text-sm">Students</CardTitle></CardHeader>
          <CardContent className="space-y-1">{filtered.map((s: any) => (
            <button key={s.id} className={`w-full text-left p-2 rounded text-sm ${selectedStudent?.id === s.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`} onClick={() => selectStudent(s)}>
              {s.first_name} {s.last_name} · G{s.grade} · {s.admission_number}
            </button>
          ))}</CardContent></Card>

        <Card className="lg:col-span-3">
          {selectedStudent ? (
            <CardContent className="p-6">
              <div className="text-center border-b-2 pb-4 mb-4"><h1 className="text-xl font-bold">{schoolName}</h1><p className="font-semibold">REPORT CARD</p></div>
              <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded">
                <div><p className="text-xs">Name</p><p className="font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</p></div>
                <div><p className="text-xs">Adm</p><p className="font-bold">{selectedStudent.admission_number}</p></div>
                <div><p className="text-xs">Grade</p><p className="font-bold">G{selectedStudent.grade}</p></div>
                <div><p className="text-xs">Exam</p><p className="font-bold text-sm">{exams.find(e => e.id === selectedExam)?.name}</p></div>
              </div>
              {results.length > 0 ? (
                <table className="w-full text-sm mb-4"><thead><tr className="border-b-2"><th className="text-left py-2">Subject</th><th className="text-center py-2">Score</th><th className="text-center py-2">Grade</th></tr></thead>
                  <tbody>{results.map((r: any, i: number) => (<tr key={i} className="border-b"><td className="py-2">{r.subject}</td><td className="text-center py-2">{r.score}%</td><td className="text-center py-2"><Badge className={`${getGradeColor(r.grade)} font-bold`}>{r.grade}</Badge></td></tr>))}</tbody></table>
              ) : <p className="text-center py-8 text-slate-500">No results</p>}
            </CardContent>
          ) : (
            <CardContent className="py-16 text-center text-slate-500"><GraduationCap className="h-16 w-16 mx-auto mb-4 text-slate-300" /><p>Select a student to view report card</p></CardContent>
          )}
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader><DialogTitle>Parents Receiving SMS ({previewList.length})</DialogTitle></DialogHeader>
          <table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2">Student</th><th className="text-left py-2">Guardian</th><th className="text-left py-2">Phone</th></tr></thead>
            <tbody>{previewList.map((p, i) => (
              <tr key={i} className="border-b"><td className="py-1">{p.student} · G{p.grade}</td><td className="py-1">{p.guardian}</td><td className="py-1 font-mono">{p.phone}</td></tr>
            ))}</tbody></table>
        </DialogContent>
      </Dialog>

      <style jsx global>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookOpen, Plus, Loader2, Trophy, TrendingUp } from 'lucide-react';

interface ExamType {
  id: string; name: string; term: string; academic_year: string;
}

interface ExamResult {
  id: string; subject: string; score: number; grade: string; remarks: string;
  students: { first_name: string; last_name: string; admission_number: string; grade: string };
}

export default function ExamsPage() {
  const supabase = createClient();
  const [schoolId, setSchoolId] = useState('');
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeExam, setActiveExam] = useState('');

  // New exam form
  const [examName, setExamName] = useState('');
  const [examTerm, setExamTerm] = useState('term1');
  const [examYear, setExamYear] = useState('2026');

  // Add result form
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [score, setScore] = useState('');
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: exams } = await supabase.from('exam_types').select('*').eq('school_id', userData.school_id).order('created_at', { ascending: false });
    if (exams) { setExamTypes(exams); if (exams.length > 0) setActiveExam(exams[0].id); }
  }

  useEffect(() => {
    if (activeExam) loadResults(activeExam);
  }, [activeExam]);

  async function loadResults(examId: string) {
    const { data } = await supabase.from('exam_results').select('*, students(first_name, last_name, admission_number, grade)').eq('exam_type_id', examId).order('subject');
    if (data) setResults(data);
  }

  async function createExam(e: React.FormEvent) {
    e.preventDefault(); if (!examName) return;
    setIsLoading(true);
    const { error } = await supabase.from('exam_types').insert({ school_id: schoolId, name: examName, term: examTerm, academic_year: examYear });
    setIsLoading(false);
    if (error) toast.error('Failed');
    else { toast.success(`${examName} created!`); setExamName(''); loadData(); }
  }

  async function addResult(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !subject || !score) { toast.error('Fill all fields'); return; }
    const gradeCalc = parseFloat(score) >= 80 ? 'A' : parseFloat(score) >= 65 ? 'B' : parseFloat(score) >= 50 ? 'C' : parseFloat(score) >= 40 ? 'D' : 'E';
    const { error } = await supabase.from('exam_results').insert({
      school_id: schoolId, exam_type_id: activeExam, student_id: selectedStudent,
      subject, score: parseFloat(score), grade: grade || gradeCalc, remarks,
    });
    if (error) { toast.error(error.message.includes('duplicate') ? 'Result already exists' : 'Failed'); }
    else { toast.success('Result added!'); setSubject(''); setScore(''); setGrade(''); setRemarks(''); setSelectedStudent(''); setStudentSearch(''); loadResults(activeExam); }
  }

  async function searchStudents(query: string) {
    setStudentSearch(query);
    if (query.length < 2) { setStudents([]); return; }
    const { data } = await supabase.from('students').select('id, first_name, last_name, admission_number').eq('school_id', schoolId).eq('status', 'active').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`).limit(10);
    if (data) setStudents(data);
  }

  const subjects = ['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'CRE', 'Business Studies', 'Agriculture', 'Computer Studies'];

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Exams & Results</h1><p className="text-slate-500">{examTypes.length} exams</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Exam */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle><Plus className="h-5 w-5 inline mr-2" />Create Exam</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createExam} className="space-y-3">
              <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="Exam name (e.g., Mid-Term 1)" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={examTerm} onValueChange={setExamTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent>
                </Select>
                <Input value={examYear} onChange={e => setExamYear(e.target.value)} placeholder="Year" />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Exam'}</Button>
            </form>
          </CardContent>
        </Card>

        {/* Exam List + Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex gap-2 flex-wrap">
              {examTypes.map(e => (
                <Badge key={e.id} className={`cursor-pointer px-3 py-1 ${activeExam === e.id ? 'bg-blue-600 text-white' : 'bg-slate-100'}`} onClick={() => setActiveExam(e.id)}>
                  {e.name} ({e.term} {e.academic_year})
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {activeExam && (
              <>
                {/* Add Result */}
                <div className="bg-slate-50 p-4 rounded-lg mb-4 space-y-3">
                  <p className="font-medium text-sm">Add Result</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input placeholder="Search student..." value={studentSearch} onChange={e => searchStudents(e.target.value)} />
                      {students.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                          {students.map(s => <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm" onClick={() => { setSelectedStudent(s.id); setStudentSearch(`${s.first_name} ${s.last_name}`); }}>{s.first_name} {s.last_name}</button>)}
                        </div>
                      )}
                    </div>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                      <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" placeholder="Score" value={score} onChange={e => setScore(e.target.value)} />
                    <Input placeholder="Grade (auto)" value={grade} onChange={e => setGrade(e.target.value)} />
                  </div>
                  <Input placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
                  <Button size="sm" onClick={addResult}><Plus className="h-3 w-3 mr-1" /> Add Result</Button>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2">Student</th><th className="text-left py-2">Subject</th><th className="text-left py-2">Score</th><th className="text-left py-2">Grade</th><th className="text-left py-2">Remarks</th></tr></thead>
                    <tbody>
                      {results.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-slate-500">No results yet.</td></tr> :
                        results.map(r => (
                          <tr key={r.id} className="border-b">
                            <td className="py-2 font-medium">{r.students?.first_name} {r.students?.last_name}</td>
                            <td className="py-2">{r.subject}</td>
                            <td className="py-2">{r.score}</td>
                            <td className="py-2"><Badge className={parseFloat(r.grade) >= 4 || r.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : r.grade === 'E' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}>{r.grade}</Badge></td>
                            <td className="py-2 text-slate-500">{r.remarks || '-'}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendSms } from '@/lib/sms/send';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Upload, Loader2, Send, FileSpreadsheet, AlertTriangle, CheckCircle, Users, BarChart, Table, Plus } from 'lucide-react';

export default function ExamsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [examTypes, setExamTypes] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [term, setTerm] = useState('1');
  const [year, setYear] = useState('2026');
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [matched, setMatched] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [result, setResult] = useState(null);
  const [sendToParents, setSendToParents] = useState(false);

  // Add Exam Dialog
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamTerm, setNewExamTerm] = useState('1');
  const [newExamYear, setNewExamYear] = useState('2026');

  // Filters
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [availableStreams, setAvailableStreams] = useState([]);

  // Results view
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: u } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!u?.school_id) return;
    setSchoolId(u.school_id);

    const { data: exams } = await supabase.from('exam_types').select('*').eq('school_id', u.school_id);
    if (exams) setExamTypes(exams);

    const { data: students } = await supabase.from('students').select('stream').eq('school_id', u.school_id).eq('status', 'active');
    if (students) {
      const streams = [...new Set(students.map(s => s.stream).filter(Boolean))];
      setAvailableStreams(streams);
    }
  }

  async function addExamType() {
    if (!newExamName) { toast.error('Enter exam name'); return; }
    setLoading(true);
    const { error } = await supabase.from('exam_types').insert({
      school_id: schoolId,
      name: newExamName,
      term: parseInt(newExamTerm),
      academic_year: newExamYear,
    });
    if (error) {
      toast.error('Failed to add exam: ' + error.message);
    } else {
      toast.success('Exam added successfully');
      setNewExamName('');
      setExamDialogOpen(false);
      loadData();
    }
    setLoading(false);
  }

  async function loadResults() {
    if (!selectedExam) return;
    setLoadingResults(true);
    const { data } = await supabase
      .from('exam_results')
      .select('*, students(first_name, last_name, admission_number, grade, stream)')
      .eq('exam_type_id', selectedExam)
      .eq('school_id', schoolId)
      .order('rank');
    setResults(data || []);
    setLoadingResults(false);
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.xlsx')) {
      toast.error('Upload CSV or Excel (.xlsx)');
      return;
    }
    setFile(f);
    setHeaders([]);
    setMapping({});
    setResult(null);
    setMatched([]);
    setUnmatched([]);
  }

  async function preview() {
    if (!file) { toast.error('Upload a file first'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length < 2) { toast.error('Need at least a header row'); return; }
        setHeaders(json[0].map(h => String(h).trim()));
        toast.success(`${headers.length} columns detected`);
      } catch (err) {
        toast.error('Failed to read file');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function importFile() {
    if (!file || !selectedExam || !mapping.admission) {
      toast.error('Select exam and map admission column');
      return;
    }
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const cols = json[0].map(h => String(h).trim());
        const admIdx = cols.indexOf(mapping.admission);
        const subIdx = mapping.subject ? cols.indexOf(mapping.subject) : -1;
        const scoreIdx = mapping.score ? cols.indexOf(mapping.score) : -1;
        const gradeIdx = mapping.grade ? cols.indexOf(mapping.grade) : -1;
        const rankIdx = mapping.rank ? cols.indexOf(mapping.rank) : -1;

        const { data: students } = await supabase.from('students').select('id, admission_number, first_name, last_name, grade, stream').eq('school_id', schoolId);
        const studentMap = {};
        students?.forEach(s => studentMap[s.admission_number] = s);

        const matchedList = [];
        const unmatchedList = [];

        for (let i = 1; i < json.length; i++) {
          const vals = json[i].map(v => String(v).trim());
          const adm = vals[admIdx]?.trim();
          if (!adm) continue;
          const student = studentMap[adm];
          const subject = subIdx > -1 ? vals[subIdx] || '' : '';
          const score = scoreIdx > -1 ? parseFloat(vals[scoreIdx]) || 0 : 0;
          const grade = gradeIdx > -1 ? vals[gradeIdx] || '' : '';
          const rank = rankIdx > -1 ? parseInt(vals[rankIdx]) || 0 : 0;

          if (student) {
            matchedList.push({
              student_id: student.id,
              admission: adm,
              name: `${student.first_name} ${student.last_name}`,
              grade: student.grade,
              stream: student.stream,
              subject,
              score,
              grade,
              rank,
            });
          } else {
            unmatchedList.push({ admission: adm, subject, score, grade, rank });
          }
        }

        setMatched(matchedList);
        setUnmatched(unmatchedList);

        if (matchedList.length > 0) {
          const data = matchedList.map(r => ({
            student_id: r.student_id,
            exam_type_id: selectedExam,
            subject: r.subject,
            score: r.score,
            grade: r.grade,
            rank: r.rank,
            term: parseInt(term),
            academic_year: year,
          }));
          await supabase.from('exam_results').delete().eq('exam_type_id', selectedExam).eq('school_id', schoolId);
          await supabase.from('exam_results').insert(data);
        }

        setResult({ total: json.length - 1, matched: matchedList.length, unmatched: unmatchedList.length });
        toast.success(`Imported ${matchedList.length} results`);
        loadResults();
      } catch (err) {
        toast.error('Import failed');
      }
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }

  function buildMessage(student) {
    return `Dear Parent, ${student.name} (Adm: ${student.admission}) scored ${student.score}% in ${student.subject}. Grade: ${student.grade}, Rank: ${student.rank}. - EDU GATE`;
  }

  async function sendBulk() {
    if (matched.length === 0) return;
    setSending(true);
    let sent = 0;
    const examName = examTypes.find(e => e.id === selectedExam)?.name || 'Exam';
    for (const s of matched) {
      const { data: g } = await supabase.from('guardians').select('phone_number').eq('student_id', s.student_id).eq('is_primary', true).single();
      if (g?.phone_number) {
        const msg = buildMessage(s);
        await sendSms(g.phone_number, msg, schoolId, supabase);
        sent++;
      }
    }
    toast.success(`Sent ${sent}/${matched.length} SMS`);
    setSending(false);
  }

  async function sendSingle(student) {
    const { data: g } = await supabase.from('guardians').select('phone_number').eq('student_id', student.student_id).eq('is_primary', true).single();
    if (g?.phone_number) {
      const msg = buildMessage(student);
      await sendSms(g.phone_number, msg, schoolId, supabase);
      toast.success(`Sent to ${student.name}`);
    } else {
      toast.error(`No guardian for ${student.name}`);
    }
  }

  const filteredMatched = matched.filter(s => {
    if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
    if (streamFilter !== 'all' && s.stream !== streamFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Exams & Results</h1>
      </div>

      <Tabs defaultValue="results">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4 pt-4">
          <div className="flex gap-4">
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select Exam" /></SelectTrigger>
              <SelectContent>
                {examTypes.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadResults} variant="outline">Refresh</Button>
          </div>
          {results.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr><th>Pos</th><th>Student</th><th>Adm</th><th>Subject</th><th>Score</th><th>Grade</th></tr></thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.rank}</td>
                      <td className="p-2">{r.students?.first_name} {r.students?.last_name}</td>
                      <td className="p-2">{r.students?.admission_number}</td>
                      <td className="p-2">{r.subject}</td>
                      <td className="p-2 font-bold">{r.score}%</td>
                      <td className="p-2"><Badge>{r.grade}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center py-8 text-slate-500">Select an exam and click Refresh</p>}
        </TabsContent>

        <TabsContent value="import" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle><Upload className="mr-2 h-5 w-5 inline" /> Import CSV / Excel</CardTitle>
                <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Exam</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New Exam</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input value={newExamName} onChange={e => setNewExamName(e.target.value)} placeholder="Exam name (e.g., Mid-Term 1)" />
                      <Select value={newExamTerm} onValueChange={setNewExamTerm}>
                        <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Term 1</SelectItem>
                          <SelectItem value="2">Term 2</SelectItem>
                          <SelectItem value="3">Term 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={newExamYear} onChange={e => setNewExamYear(e.target.value)} placeholder="Year (e.g., 2026)" />
                      <Button onClick={addExamType} disabled={loading} className="w-full bg-blue-600">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : 'Add Exam'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                  <SelectContent>
                    {examTypes.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={year} onChange={e => setYear(e.target.value)} className="w-24" placeholder="2026" />
                </div>
              </div>

              <div className="border-2 border-dashed p-6 text-center rounded-lg">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-400" />
                <p className="text-sm text-slate-500">Upload CSV or Excel (.xlsx) with columns: admission, subject, score, grade, rank</p>
                <Input type="file" accept=".csv,.xlsx" onChange={handleFile} className="max-w-xs mx-auto mt-2" />
                {file && <p className="text-xs text-emerald-600 mt-2">✓ {file.name}</p>}
              </div>

              {headers.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <p className="font-medium text-blue-700">Map columns:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Admission *</Label>
                      <Select value={mapping.admission} onValueChange={v => setMapping({...mapping, admission: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Subject</Label>
                      <Select value={mapping.subject} onValueChange={v => setMapping({...mapping, subject: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Score</Label>
                      <Select value={mapping.score} onValueChange={v => setMapping({...mapping, score: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Grade</Label>
                      <Select value={mapping.grade} onValueChange={v => setMapping({...mapping, grade: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Rank</Label>
                      <Select value={mapping.rank} onValueChange={v => setMapping({...mapping, rank: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={preview} variant="outline">Preview Columns</Button>
                <Button onClick={importFile} disabled={loading || !file || !selectedExam} className="flex-1 bg-blue-600 text-white">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} Import
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader><CardTitle><Users className="mr-2 h-5 w-5 inline" /> Results & Send</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold">{result.total}</p><p className="text-xs">Total Rows</p></div>
                  <div><p className="text-2xl font-bold text-emerald-600">{result.matched}</p><p className="text-xs">Matched</p></div>
                  <div><p className="text-2xl font-bold text-red-600">{result.unmatched}</p><p className="text-xs">Unmatched</p></div>
                </div>

                {unmatched.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-700 font-medium">Unmatched Admission Numbers:</p>
                    <div className="text-sm text-red-600 space-y-1">
                      {unmatched.slice(0, 10).map((u, i) => <p key={i}>{u.admission}</p>)}
                    </div>
                  </div>
                )}

                {matched.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Switch checked={sendToParents} onCheckedChange={setSendToParents} />
                      <Label>Enable SMS to parents</Label>
                    </div>

                    <div className="flex gap-4">
                      <Select value={gradeFilter} onValueChange={setGradeFilter}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="10">Grade 10</SelectItem>
                          <SelectItem value="11">Grade 11</SelectItem>
                          <SelectItem value="12">Grade 12</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={streamFilter} onValueChange={setStreamFilter}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="Stream" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {availableStreams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={sendBulk} disabled={sending || !sendToParents} className="bg-blue-600 text-white">
                        {sending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                        Bulk SMS ({filteredMatched.length} parents)
                      </Button>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Per‑Parent Send (click to send individually):</p>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {filteredMatched.map(s => (
                          <div key={s.student_id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-sm">{s.name} ({s.admission})</span>
                            <Button size="sm" variant="outline" onClick={() => sendSingle(s)} disabled={sending}>
                              Send SMS
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

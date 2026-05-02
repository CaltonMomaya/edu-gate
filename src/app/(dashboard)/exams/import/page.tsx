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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Upload, Loader2, Send, FileSpreadsheet, AlertTriangle, CheckCircle, Users, Plus, Eye, List, Bug } from 'lucide-react';

export default function ExamImportPage() {
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
  const [sendToParents, setSendToParents] = useState(false);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewPhone, setPreviewPhone] = useState('');
  const [previewAllOpen, setPreviewAllOpen] = useState(false);

  // Add Exam Dialog
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamTerm, setNewExamTerm] = useState('1');
  const [newExamYear, setNewExamYear] = useState('2026');

  // Filters
  const [gradeFilter, setGradeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [availableStreams, setAvailableStreams] = useState([]);

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
        
        // Auto-map columns
        const autoMap: any = {};
        headers.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('adm') || lower.includes('admission') || lower.includes('reg') || lower.includes('id')) {
            autoMap.admission = h;
          } else if (lower.includes('subject') || lower.includes('sub')) {
            autoMap.subject = h;
          } else if (lower.includes('score') || lower.includes('marks') || lower.includes('mark') || lower.includes('percentage')) {
            autoMap.score = h;
          } else if (lower.includes('grade') || lower.includes('gr')) {
            autoMap.grade = h;
          } else if (lower.includes('rank') || lower.includes('position') || lower.includes('pos')) {
            autoMap.rank = h;
          }
        });
        setMapping(autoMap);
        toast.success(`Auto-detected columns: ${Object.keys(autoMap).join(', ')}`);
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

  async function openPreview(student) {
    const { data: g } = await supabase.from('guardians').select('phone_number, full_name').eq('student_id', student.student_id).eq('is_primary', true).single();
    setPreviewData(student);
    setPreviewPhone(g?.phone_number || 'No phone registered');
    setPreviewOpen(true);
  }

  function openPreviewAll() {
    setPreviewAllOpen(true);
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

  // Debug log
  console.log('Matched students:', matched);
  console.log('Filtered matched:', filteredMatched);
  console.log('Send to parents:', sendToParents);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Import Exam Results</h1>

      {/* Debug Test Button */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <p className="text-sm text-yellow-700 mb-2">Debug: Matched = {matched.length}, Filtered = {filteredMatched.length}</p>
        <Button variant="outline" size="sm" onClick={() => setPreviewAllOpen(true)} className="text-yellow-700">
          <Bug className="h-4 w-4 mr-2" /> Force Show Preview All
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><Upload className="mr-2 h-5 w-5 inline" /> 1. Upload & Configure</CardTitle>
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
              <p className="font-medium text-blue-700">Auto-detected columns:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(mapping).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="bg-white">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
              {!mapping.admission && (
                <p className="text-sm text-red-500 mt-2">⚠️ Admission column not detected. Please check your CSV headers.</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={preview} variant="outline">Preview Columns</Button>
            <Button onClick={importFile} disabled={loading || !file || !selectedExam || !mapping.admission} className="flex-1 bg-blue-600 text-white">
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results & Send - Always show when matched > 0 */}
      {matched.length > 0 && (
        <Card>
          <CardHeader><CardTitle><Users className="mr-2 h-5 w-5 inline" /> 2. Results & Send</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold">{matched.length}</p><p className="text-xs">Total Rows</p></div>
              <div><p className="text-2xl font-bold text-emerald-600">{matched.length}</p><p className="text-xs">Matched</p></div>
              <div><p className="text-2xl font-bold text-red-600">{unmatched.length}</p><p className="text-xs">Unmatched</p></div>
            </div>

            {unmatched.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-700 font-medium">Unmatched Admission Numbers:</p>
                <div className="text-sm text-red-600 space-y-1">
                  {unmatched.slice(0, 10).map((u, i) => <p key={i}>{u.admission}</p>)}
                </div>
              </div>
            )}

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
                <Button onClick={openPreviewAll} variant="outline" className="text-blue-600">
                  <List className="mr-2 h-4 w-4" /> Preview All ({filteredMatched.length})
                </Button>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Per‑Parent Send (click to send individually):</p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {filteredMatched.map(s => (
                    <div key={s.student_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <span className="text-sm font-medium">{s.name} ({s.admission})</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openPreview(s)}>
                          <Eye className="h-3 w-3 mr-1" /> Preview
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => sendSingle(s)} disabled={sending}>
                          <Send className="h-3 w-3 mr-1" /> SMS
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Recipient:</p>
              <p className="font-medium">{previewData?.name} ({previewData?.admission})</p>
              <p className="text-sm text-slate-500 mt-1">Phone: <span className="font-mono">{previewPhone}</span></p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Message:</p>
              <p className="text-slate-800 whitespace-pre-wrap">{previewData ? buildMessage(previewData) : ''}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview All Dialog */}
      <Dialog open={previewAllOpen} onOpenChange={setPreviewAllOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Messages Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {filteredMatched.map((s, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.name} ({s.admission})</p>
                    <p className="text-sm text-slate-500">Grade {s.grade} · Stream {s.stream}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => sendSingle(s)} disabled={sending}>
                    Send SMS
                  </Button>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-slate-700">{buildMessage(s)}</p>
                </div>
              </div>
            ))}
            {filteredMatched.length === 0 && (
              <p className="text-center text-slate-500 py-4">No students to preview</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

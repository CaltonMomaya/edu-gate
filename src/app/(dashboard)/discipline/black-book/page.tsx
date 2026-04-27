'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logAction } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Loader2, Scale, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

interface Offense { id: string; student_id: string; offense: string; punishment: string; status: string; recorded_at: string; students: { first_name: string; last_name: string; admission_number: string }; }
interface Student { id: string; first_name: string; last_name: string; admission_number: string; grade: string; }

export default function BlackBookPage() {
  const supabase = createClient();
  const [offenses, setOffenses] = useState<Offense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [offenseSearch, setOffenseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [offense, setOffense] = useState('');
  const [punishment, setPunishment] = useState('');

  useEffect(() => { loadData(); }, [page, filter]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: studentsData } = await supabase.from('students').select('id, first_name, last_name, admission_number, grade').eq('school_id', userData.school_id).eq('status', 'active').order('first_name');
    if (studentsData) setStudents(studentsData);

    let query = supabase.from('black_book').select('*, students(first_name, last_name, admission_number)', { count: 'exact' }).eq('school_id', userData.school_id);
    if (filter !== 'all') query = query.eq('status', filter);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (data) setOffenses(data);
    if (count !== null) setTotal(count);
  }

  const filteredStudents = students.filter(s => {
    if (!studentSearch) return false;
    const q = studentSearch.toLowerCase();
    return s.first_name.toLowerCase().includes(q) || s.last_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q);
  });

  function selectStudent(s: Student) { setSelectedStudent(s); setStudentSearch(`${s.first_name} ${s.last_name}`); }

  async function recordOffense(e: React.FormEvent) {
    e.preventDefault(); if (!selectedStudent || !offense) { toast.error('Select student and enter offense'); return; }
    setIsLoading(true);
    const { error } = await supabase.from('black_book').insert({ student_id: selectedStudent.id, school_id: schoolId, offense, punishment: punishment || null, status: 'pending' });
    if (error) toast.error('Failed');
    else {
      toast.success('Recorded');
      await logAction(schoolId, "offense_recorded", "offense", selectedStudent.id, { offense, student: `${selectedStudent.first_name} ${selectedStudent.last_name}` });
      setSelectedStudent(null); setStudentSearch(''); setOffense(''); setPunishment(''); loadData();
    }
    setIsLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('black_book').update({ status: newStatus, resolved_at: newStatus === 'served' ? new Date().toISOString() : null }).eq('id', id);
    toast.success('Updated'); loadData();
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Black Book</h1><p className="text-slate-500">{total} records</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1"><CardHeader><CardTitle><Scale className="h-5 w-5 inline mr-2 text-red-600" />Record Offense</CardTitle></CardHeader>
          <CardContent><form onSubmit={recordOffense} className="space-y-3">
            <div className="relative"><Input placeholder="Search student..." value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); }} />
              {studentSearch && !selectedStudent && filteredStudents.length > 0 && <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-36 overflow-y-auto">{filteredStudents.slice(0, 20).map(s => <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b" onClick={() => selectStudent(s)}>{s.first_name} {s.last_name} ({s.admission_number})</button>)}</div>}
              {selectedStudent && <p className="text-xs text-emerald-600 mt-1">✅ {selectedStudent.first_name} {selectedStudent.last_name}</p>}
            </div>
            <Textarea value={offense} onChange={e => setOffense(e.target.value)} placeholder="Describe offense..." rows={3} />
            <Input value={punishment} onChange={e => setPunishment(e.target.value)} placeholder="Punishment (optional)" />
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record'}</Button>
          </form></CardContent></Card>

        <Card className="lg:col-span-2"><CardHeader>
          <div className="flex items-center gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Search offenses..." className="pl-10" value={offenseSearch} onChange={e => setOffenseSearch(e.target.value)} /></div>
            <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="served">Served</SelectItem><SelectItem value="pardoned">Pardoned</SelectItem></SelectContent></Select>
          </div></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Offense</TableHead><TableHead>Punishment</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>{offenses.filter(o => `${o.students?.first_name} ${o.students?.last_name}`.toLowerCase().includes(offenseSearch.toLowerCase()) || o.offense.toLowerCase().includes(offenseSearch.toLowerCase())).map(o => (
                <TableRow key={o.id}><TableCell className="font-medium">{o.students?.first_name} {o.students?.last_name}</TableCell><TableCell className="max-w-xs truncate">{o.offense}</TableCell><TableCell>{o.punishment || '-'}</TableCell>
                  <TableCell>{o.status === 'pending' ? <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge> : o.status === 'served' ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" />Served</Badge> : <Badge className="bg-blue-100 text-blue-700">Pardoned</Badge>}</TableCell>
                  <TableCell>{o.status === 'pending' && <div className="flex gap-1"><Button size="sm" variant="outline" className="text-emerald-600 text-xs" onClick={() => updateStatus(o.id, 'served')}><CheckCircle className="h-3 w-3 mr-1" />Served</Button><Button size="sm" variant="outline" className="text-blue-600 text-xs" onClick={() => updateStatus(o.id, 'pardoned')}>Pardon</Button></div>}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            <div className="flex items-center justify-between mt-4"><p className="text-sm text-slate-500">Page {page} of {Math.ceil(total / PAGE_SIZE)}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))} disabled={page >= Math.ceil(total / PAGE_SIZE)}><ChevronRight className="h-4 w-4" /></Button></div></div>
          </CardContent></Card>
      </div>
    </div>
  );
}

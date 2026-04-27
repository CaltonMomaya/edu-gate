'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, ClipboardCheck, CheckCircle, XCircle, Clock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  clearance_order: number;
}

interface ClearanceStatus {
  student_id: string;
  department_id: string;
  status: string;
  departments: { name: string; clearance_order: number };
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
  profile_picture_url: string;
  status: string;
}

export default function ClearancePage() {
  const supabase = createClient();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clearanceData, setClearanceData] = useState<Record<string, ClearanceStatus[]>>({});
  const [search, setSearch] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    // Load departments
    const { data: depts } = await supabase.from('departments').select('*').eq('school_id', userData.school_id).order('clearance_order');
    if (depts) setDepartments(depts);

    // Load students with clearance records (Grade 12 OR transferred)
    const { data: studs } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', userData.school_id)
      .or('grade.eq.12,status.eq.transferred')
      .order('first_name');

    if (studs) {
      setStudents(studs);
      for (const s of studs) {
        const { data: clearance } = await supabase
          .from('student_clearance')
          .select('*, departments(name, clearance_order)')
          .eq('student_id', s.id);
        if (clearance) setClearanceData(prev => ({ ...prev, [s.id]: clearance }));
      }
    }
  }

  async function initiateClearance(studentId: string) {
    const records = departments.map(d => ({ student_id: studentId, department_id: d.id, status: 'pending' }));
    await supabase.from('student_clearance').upsert(records, { onConflict: 'student_id, department_id' });
    loadData();
  }

  function getClearanceProgress(studentId: string) {
    const clearance = clearanceData[studentId] || [];
    if (clearance.length === 0) return { cleared: 0, total: departments.length, blocked: 0 };
    const cleared = clearance.filter(c => c.status === 'cleared').length;
    const blocked = clearance.filter(c => c.status === 'blocked').length;
    return { cleared, total: clearance.length, blocked };
  }

  const filtered = students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || s.admission_number.includes(search.toLowerCase());
    
    if (filterStatus === 'cleared') {
      const { cleared, total } = getClearanceProgress(s.id);
      return matchesSearch && total > 0 && cleared === total;
    }
    if (filterStatus === 'pending') {
      const { cleared, total } = getClearanceProgress(s.id);
      return matchesSearch && (total === 0 || cleared < total);
    }
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clearance</h1>
        <p className="text-slate-500 mt-1">Grade 12 & Transferred Students · {students.length} students</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search students..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Badge className={`cursor-pointer px-3 py-1 ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`} onClick={() => setFilterStatus('all')}>All</Badge>
              <Badge className={`cursor-pointer px-3 py-1 ${filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`} onClick={() => setFilterStatus('pending')}>Pending</Badge>
              <Badge className={`cursor-pointer px-3 py-1 ${filterStatus === 'cleared' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`} onClick={() => setFilterStatus('cleared')}>Cleared</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">No students found.</TableCell></TableRow>
              ) : (
                filtered.map((s) => {
                  const { cleared, total, blocked } = getClearanceProgress(s.id);
                  const percent = total > 0 ? Math.round((cleared / total) * 100) : 0;
                  const hasStarted = total > 0;
                  const isComplete = hasStarted && cleared === total;

                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarImage src={s.profile_picture_url || ''} /><AvatarFallback>{s.first_name[0]}{s.last_name[0]}</AvatarFallback></Avatar>
                          <span className="font-medium">{s.first_name} {s.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">{s.admission_number}</TableCell>
                      <TableCell>Grade {s.grade}</TableCell>
                      <TableCell>
                        {s.status === 'transferred' ? (
                          <Badge className="bg-orange-100 text-orange-700">Transferred</Badge>
                        ) : (
                          <Badge variant="outline">Grade 12</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStarted ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percent}%` }} />
                              </div>
                              <span className="text-xs text-slate-500">{percent}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not started</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isComplete ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" />Cleared</Badge> :
                         hasStarted ? <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />In Progress</Badge> :
                         <Badge variant="outline">Pending</Badge>}
                      </TableCell>
                      <TableCell>
                        {!hasStarted ? (
                          <Button size="sm" onClick={() => initiateClearance(s.id)} className="bg-blue-600"><ClipboardCheck className="h-3 w-3 mr-1" />Start</Button>
                        ) : (
                          <Link href={`/clearance/${s.id}`}><Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" />View</Button></Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
          <div className="flex items-center justify-between mt-4 pt-4 border-t"><p className="text-sm text-slate-500">Page {page} of {Math.ceil(total / PAGE_SIZE)} · {total} students</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))} disabled={page >= Math.ceil(total / PAGE_SIZE)}><ChevronRight className="h-4 w-4" /></Button></div></div>
      </Card>
    </div>
  );
}

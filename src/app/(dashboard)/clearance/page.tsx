'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Search, ClipboardCheck, CheckCircle, Clock, Eye, Users, ArrowRight } from 'lucide-react';

export default function ClearancePage() {
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [clearanceData, setClearanceData] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [schoolId, setSchoolId] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [assignedDeptId, setAssignedDeptId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [filterStatus]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id, role').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    setUserRole(userData.role);

    const { data: depts } = await supabase.from('departments').select('*').eq('school_id', userData.school_id).order('clearance_order');
    if (depts) setDepartments(depts);

    const { data: assignedDept } = await supabase.from('departments').select('id, name').eq('assigned_officer', user.id).single();
    if (assignedDept) setAssignedDeptId(assignedDept.id);

    let query = supabase.from('students').select('*').eq('school_id', userData.school_id).or('grade.eq.12,status.eq.transferred').order('first_name');
    const { data: studs } = await query;

    if (studs) {
      for (const s of studs) {
        const { data: clearance } = await supabase
          .from('student_clearance').select('*, departments(name, clearance_order)')
          .eq('student_id', s.id).order('departments(clearance_order)');
        if (clearance) setClearanceData(prev => ({ ...prev, [s.id]: clearance }));
      }

      let filtered = studs;
      const isAdmin = userRole === 'admin';

      if (isAdmin) {
        if (filterStatus === 'pending') {
          filtered = studs.filter(s => {
            const clr = clearanceData[s.id] || [];
            return clr.length > 0 && clr.some((c: any) => c.status !== 'cleared');
          });
        } else if (filterStatus === 'cleared') {
          filtered = studs.filter(s => {
            const clr = clearanceData[s.id] || [];
            return clr.length > 0 && clr.every((c: any) => c.status === 'cleared');
          });
        } else if (filterStatus === 'not_started') {
          filtered = studs.filter(s => !clearanceData[s.id] || clearanceData[s.id].length === 0);
        }
      } else {
        filtered = studs.filter(s => {
          const clr = clearanceData[s.id] || [];
          if (clr.length === 0) return false;
          const firstPending = clr.find((c: any) => c.status !== 'cleared');
          return firstPending && firstPending.department_id === assignedDeptId;
        });
      }

      // Sort: uncleared first, cleared last, not started at top
      filtered.sort((a, b) => {
        const aClr = clearanceData[a.id] || [];
        const bClr = clearanceData[b.id] || [];
        const aDone = aClr.length > 0 && aClr.every((c: any) => c.status === 'cleared');
        const bDone = bClr.length > 0 && bClr.every((c: any) => c.status === 'cleared');
        const aStarted = aClr.length > 0;
        const bStarted = bClr.length > 0;
        if (!aStarted && bStarted) return -1;
        if (aStarted && !bStarted) return 1;
        if (!aDone && bDone) return -1;
        if (aDone && !bDone) return 1;
        return 0;
      });

      setStudents(filtered);
    }
  }

  async function initiateClearance(studentId: string) {
    if (userRole !== 'admin') { toast.error('Only administrators can initiate clearance'); return; }
    const records = departments.map(d => ({ student_id: studentId, department_id: d.id, status: 'pending' }));
    await supabase.from('student_clearance').upsert(records, { onConflict: 'student_id, department_id' });
    toast.success(`Clearance started! First step: ${departments[0]?.name}`);
    loadData();
  }

  function getClearanceInfo(studentId: string) {
    const clr = clearanceData[studentId] || [];
    if (clr.length === 0) return { cleared: 0, total: departments.length, current: 'Not started' };
    const cleared = clr.filter((c: any) => c.status === 'cleared');
    const firstPending = clr.find((c: any) => c.status !== 'cleared');
    return { cleared: cleared.length, total: clr.length, current: firstPending ? firstPending.departments.name : 'All cleared' };
  }

  const filtered = students.filter((s: any) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || s.admission_number.includes(search.toLowerCase());
  });

  const isAdmin = userRole === 'admin';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clearance</h1>
          <p className="text-slate-500 mt-1">{isAdmin ? 'Grade 12 & Transferred' : 'Your department queue'} · {students.length} students</p>
        </div>
        {!isAdmin && assignedDeptId && (
          <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">You clear: {departments.find(d => d.id === assignedDeptId)?.name}</Badge>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
            {isAdmin && (
              <div className="flex gap-2">
                <Badge className={`cursor-pointer px-3 py-1.5 ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`} onClick={() => setFilterStatus('all')}>All</Badge>
                <Badge className={`cursor-pointer px-3 py-1.5 ${filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`} onClick={() => setFilterStatus('pending')}>In Progress</Badge>
                <Badge className={`cursor-pointer px-3 py-1.5 ${filterStatus === 'cleared' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`} onClick={() => setFilterStatus('cleared')}>Cleared</Badge>
                <Badge className={`cursor-pointer px-3 py-1.5 ${filterStatus === 'not_started' ? 'bg-slate-600 text-white' : 'bg-slate-100'}`} onClick={() => setFilterStatus('not_started')}>Not Started</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Adm No.</TableHead><TableHead>Grade</TableHead><TableHead>Type</TableHead><TableHead>Progress</TableHead><TableHead>Current Step</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500"><Users className="h-12 w-12 mx-auto mb-2 text-slate-300" />{isAdmin ? 'No students match the filter.' : 'No students waiting at your department.'}</TableCell></TableRow>
              ) : (
                filtered.map((s: any) => {
                  const info = getClearanceInfo(s.id);
                  const percent = info.total > 0 ? Math.round((info.cleared / info.total) * 100) : 0;
                  const hasStarted = clearanceData[s.id]?.length > 0;
                  const isComplete = hasStarted && info.cleared === info.total;

                  return (
                    <TableRow key={s.id}>
                      <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback>{s.first_name[0]}{s.last_name[0]}</AvatarFallback></Avatar><span className="font-medium">{s.first_name} {s.last_name}</span></div></TableCell>
                      <TableCell className="text-slate-500">{s.admission_number}</TableCell>
                      <TableCell>Grade {s.grade}</TableCell>
                      <TableCell>{s.status === 'transferred' ? <Badge className="bg-orange-100 text-orange-700">Transferred</Badge> : <Badge variant="outline">Grade 12</Badge>}</TableCell>
                      <TableCell>{hasStarted ? <div className="space-y-1"><div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percent}%` }} /></div><span className="text-xs">{info.cleared}/{info.total}</span></div></div> : <span className="text-xs text-slate-400">Not started</span>}</TableCell>
                      <TableCell>{isComplete ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge> : hasStarted ? <span className="text-xs font-medium text-blue-600">{info.current}</span> : '-'}</TableCell>
                      <TableCell>
                        {hasStarted && !isComplete ? (
                          <Link href={`/clearance/${s.id}`}><Button size="sm" variant={isAdmin ? 'outline' : 'default'}><ArrowRight className="h-3 w-3 mr-1" />{isAdmin ? 'View' : 'Continue'}</Button></Link>
                        ) : isComplete ? (
                          <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">✅ Done</Badge>
                        ) : isAdmin ? (
                          <Button size="sm" onClick={() => initiateClearance(s.id)} className="bg-blue-600"><ClipboardCheck className="h-3 w-3 mr-1" />Start Clearance</Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

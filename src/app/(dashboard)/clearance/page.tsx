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
import { Search, ClipboardCheck, CheckCircle, XCircle, Clock, ArrowRight, Eye } from 'lucide-react';

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
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clearanceData, setClearanceData] = useState<Record<string, ClearanceStatus[]>>({});
  const [search, setSearch] = useState('');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();

    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    // Load departments
    const { data: depts } = await supabase
      .from('departments')
      .select('*')
      .eq('school_id', userData.school_id)
      .order('clearance_order');
    if (depts) setDepartments(depts);

    // Load Grade 12 students
    const { data: studs } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', userData.school_id)
      .eq('grade', '12')
      .order('first_name');
    if (studs) {
      setStudents(studs);
      // Load clearance for each student
      for (const s of studs) {
        const { data: clearance } = await supabase
          .from('student_clearance')
          .select('*, departments(name, clearance_order)')
          .eq('student_id', s.id);
        if (clearance) {
          setClearanceData(prev => ({ ...prev, [s.id]: clearance }));
        }
      }
    }
  }

  async function initiateClearance(studentId: string) {
    // Create clearance records for all departments
    const records = departments.map(d => ({
      student_id: studentId,
      department_id: d.id,
      status: 'pending',
    }));

    const { error } = await supabase.from('student_clearance').insert(records);
    if (error) {
      // Already exists, ignore
    }
    loadData();
  }

  function getClearanceProgress(studentId: string) {
    const clearance = clearanceData[studentId] || [];
    if (clearance.length === 0) return { cleared: 0, total: departments.length, blocked: 0 };
    const cleared = clearance.filter(c => c.status === 'cleared').length;
    const blocked = clearance.filter(c => c.status === 'blocked').length;
    return { cleared, total: clearance.length, blocked };
  }

  function getProgressColor(studentId: string) {
    const { cleared, total } = getClearanceProgress(studentId);
    if (total === 0) return 'bg-slate-200';
    if (cleared === total) return 'bg-emerald-500';
    if (cleared > 0) return 'bg-amber-500';
    return 'bg-slate-200';
  }

  const filtered = students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || s.admission_number.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clearance</h1>
        <p className="text-slate-500 mt-1">Grade 12 student clearance workflow</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Grade 12 students..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No Grade 12 students found.
                  </TableCell>
                </TableRow>
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
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={s.profile_picture_url || ''} />
                            <AvatarFallback>{s.first_name[0]}{s.last_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{s.first_name} {s.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">{s.admission_number}</TableCell>
                      <TableCell>
                        {hasStarted ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getProgressColor(s.id)}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{percent}%</span>
                            </div>
                            <p className="text-xs text-slate-400">{cleared}/{total} cleared{blocked > 0 ? ` · ${blocked} blocked` : ''}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not started</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isComplete ? (
                          <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" /> Cleared</Badge>
                        ) : hasStarted ? (
                          <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!hasStarted ? (
                          <Button size="sm" onClick={() => initiateClearance(s.id)} className="bg-blue-600 hover:bg-blue-700">
                            <ClipboardCheck className="h-3 w-3 mr-1" /> Start Clearance
                          </Button>
                        ) : (
                          <Link href={`/clearance/${s.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                          </Link>
                        )}
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

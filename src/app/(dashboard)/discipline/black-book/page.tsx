'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Loader2, Scale, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Offense {
  id: string;
  student_id: string;
  offense: string;
  punishment: string;
  status: string;
  recorded_at: string;
  students: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
}

export default function BlackBookPage() {
  const supabase = createClient();
  const [offenses, setOffenses] = useState<Offense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Search filters
  const [offenseSearch, setOffenseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Form state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [offense, setOffense] = useState('');
  const [punishment, setPunishment] = useState('');
  const [showStudentResults, setShowStudentResults] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: offensesData } = await supabase
      .from('black_book')
      .select('*, students(first_name, last_name, admission_number)')
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false });

    if (offensesData) setOffenses(offensesData);

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade')
      .eq('school_id', userData.school_id)
      .eq('status', 'active')
      .order('first_name');

    if (studentsData) setStudents(studentsData);
  }

  // Filter students as user types
  const filteredStudents = students.filter(s => {
    if (!studentSearch) return false; // Don't show results until user types
    const query = studentSearch.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(query) ||
      s.last_name.toLowerCase().includes(query) ||
      s.admission_number.toLowerCase().includes(query)
    );
  });

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setStudentSearch(`${student.first_name} ${student.last_name} (${student.admission_number})`);
    setShowStudentResults(false);
  }

  async function recordOffense(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !offense) {
      toast.error('Search and select a student, then describe the offense');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from('black_book').insert({
      student_id: selectedStudent.id,
      school_id: schoolId,
      offense: offense,
      punishment: punishment || null,
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to record offense');
    } else {
      toast.success(`${selectedStudent.first_name} ${selectedStudent.last_name} - offense recorded`);
      setSelectedStudent(null);
      setStudentSearch('');
      setOffense('');
      setPunishment('');
      loadData();
    }
    setIsLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('black_book')
      .update({ 
        status: newStatus,
        resolved_at: newStatus === 'served' || newStatus === 'pardoned' ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(`Status updated`);
      loadData();
    }
  }

  const filteredOffenses = offenses.filter(o => {
    const name = `${o.students?.first_name} ${o.students?.last_name}`.toLowerCase();
    const matchesSearch = name.includes(offenseSearch.toLowerCase()) || 
                         o.offense.toLowerCase().includes(offenseSearch.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'served': return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" /> Served</Badge>;
      case 'pardoned': return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" /> Pardoned</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Black Book</h1>
        <p className="text-slate-500 mt-1">Record and track student offenses and punishments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Offense Form */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-red-600" /> Record Offense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={recordOffense} className="space-y-4">
              {/* Searchable Student Input */}
              <div className="space-y-2 relative">
                <Label>Search Student *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Type name or admission number..."
                    className="pl-10"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setSelectedStudent(null);
                      setShowStudentResults(true);
                    }}
                    onFocus={() => setShowStudentResults(true)}
                  />
                </div>
                
                {/* Dropdown Results */}
                {showStudentResults && studentSearch && !selectedStudent && (
                  <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                    {filteredStudents.length === 0 ? (
                      <p className="p-3 text-sm text-slate-500">No students found</p>
                    ) : (
                      filteredStudents.slice(0, 20).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between border-b last:border-b-0"
                          onClick={() => selectStudent(s)}
                        >
                          <div>
                            <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                            <p className="text-xs text-slate-500">{s.admission_number} · Grade {s.grade}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Selected Student */}
                {selectedStudent && (
                  <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-medium text-sm">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.admission_number} · Grade {selectedStudent.grade}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentSearch('');
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Offense *</Label>
                <Textarea
                  value={offense}
                  onChange={(e) => setOffense(e.target.value)}
                  placeholder="Describe the offense..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Punishment</Label>
                <Input
                  value={punishment}
                  onChange={(e) => setPunishment(e.target.value)}
                  placeholder="e.g., Dig trench 2 days"
                />
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Record Offense</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Offense List */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by student name or offense..."
                  className="pl-10"
                  value={offenseSearch}
                  onChange={(e) => setOffenseSearch(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="pardoned">Pardoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Offense</TableHead>
                  <TableHead>Punishment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Black Book is clean. No offenses recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffenses.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        {o.students?.first_name} {o.students?.last_name}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate">{o.offense}</TableCell>
                      <TableCell className="text-slate-600">{o.punishment || '-'}</TableCell>
                      <TableCell>{statusBadge(o.status)}</TableCell>
                      <TableCell>
                        {o.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-emerald-600 text-xs" onClick={() => updateStatus(o.id, 'served')}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Served
                            </Button>
                            <Button size="sm" variant="outline" className="text-blue-600 text-xs" onClick={() => updateStatus(o.id, 'pardoned')}>
                              Pardon
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

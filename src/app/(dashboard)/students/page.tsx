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
import { UserPlus, Search, Users, Eye } from 'lucide-react';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  grade: string;
  stream: string;
  status: string;
  profile_picture_url: string;
}

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!userData?.school_id) return;

    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false });

    if (data) setStudents(data);
    setIsLoading(false);
  }

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-500 mt-1">{students.length} registered students</p>
        </div>
        <Link href="/students/add">
          <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
            <UserPlus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or admission number..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No students registered yet</p>
                    <Link href="/students/add" className="text-blue-600 hover:underline text-sm">
                      Add your first student
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.profile_picture_url || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-xs">
                            {student.first_name[0]}{student.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.first_name} {student.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{student.admission_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Grade {student.grade}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{student.stream || '-'}</TableCell>
                    <TableCell>
                      <Badge className={student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${student.id}`}>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

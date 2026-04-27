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
import { UserPlus, Search, Users, Eye, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

interface Student {
  id: string; admission_number: string; first_name: string; last_name: string;
  grade: string; stream: string; status: string; profile_picture_url: string;
}

const PAGE_SIZE = 15;

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadStudents(); }, [page]);

  async function loadStudents() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) setStudents(data);
    if (count !== null) setTotal(count);
    setIsLoading(false);
  }

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || s.admission_number.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Students</h1><p className="text-slate-500">{total} registered students</p></div>
        <div className="flex gap-2">
          <Link href="/students/id-cards"><Button variant="outline" size="sm"><Printer className="mr-1 h-4 w-4" /> ID Cards</Button></Link>
          <Link href="/students/add"><Button className="bg-gradient-to-r from-blue-600 to-emerald-600"><UserPlus className="mr-2 h-4 w-4" /> Add Student</Button></Link>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Admission No.</TableHead><TableHead>Grade</TableHead><TableHead>Stream</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredStudents.map(s => (
                <TableRow key={s.id}>
                  <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={s.profile_picture_url || ''} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-xs">{s.first_name[0]}{s.last_name[0]}</AvatarFallback></Avatar><span className="font-medium">{s.first_name} {s.last_name}</span></div></TableCell>
                  <TableCell className="text-slate-500">{s.admission_number}</TableCell>
                  <TableCell><Badge variant="outline">Grade {s.grade}</Badge></TableCell>
                  <TableCell className="text-slate-500">{s.stream || '-'}</TableCell>
                  <TableCell><Badge className={s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{s.status}</Badge></TableCell>
                  <TableCell><Link href={`/students/${s.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} students</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

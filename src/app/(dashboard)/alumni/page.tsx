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
import { Search, GraduationCap, Users, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

export default function AlumniPage() {
  const supabase = createClient();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, thisYear: 0 });

  useEffect(() => { loadAlumni(); }, [page]);

  async function loadAlumni() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await supabase.from('students').select('*', { count: 'exact' }).eq('school_id', userData.school_id).in('status', ['alumni', 'graduated']).order('graduation_date', { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (data) { setAlumni(data); setStats({ total: count || 0, thisYear: data.filter((a: any) => a.graduation_date?.startsWith(new Date().getFullYear().toString())).length }); }
    if (count !== null) setTotal(count);
  }

  const filtered = alumni.filter(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) || a.admission_number.includes(search));
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Alumni</h1><p className="text-slate-500">{total} graduates</p></div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100"><CardContent className="p-6"><GraduationCap className="h-8 w-8 text-blue-500" /><p className="text-3xl font-bold">{total}</p><p className="text-sm text-slate-500">Total Alumni</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100"><CardContent className="p-6"><Calendar className="h-8 w-8 text-emerald-500" /><p className="text-3xl font-bold">{stats.thisYear}</p><p className="text-sm text-slate-500">This Year</p></CardContent></Card>
      </div>
      <Card><CardHeader><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Search alumni..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Adm No.</TableHead><TableHead>Stream</TableHead><TableHead>Graduated</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map(a => (
              <TableRow key={a.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={a.profile_picture_url || ''} /><AvatarFallback>{a.first_name?.[0]}{a.last_name?.[0]}</AvatarFallback></Avatar><span className="font-medium">{a.first_name} {a.last_name}</span></div></TableCell><TableCell className="text-slate-500">{a.admission_number}</TableCell><TableCell>{a.stream || '-'}</TableCell><TableCell>{a.graduation_date ? new Date(a.graduation_date).toLocaleDateString() : '-'}</TableCell><TableCell><Link href={`/students/${a.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link></TableCell></TableRow>
            ))}</TableBody></Table>
          <div className="flex items-center justify-between mt-4"><p className="text-sm text-slate-500">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button></div></div>
        </CardContent></Card>
    </div>
  );
}

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
import { toast } from 'sonner';
import { Search, GraduationCap, Users, Calendar, Eye } from 'lucide-react';

interface Alumni {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  profile_picture_url: string;
  graduation_date: string;
  stream: string;
}

export default function AlumniPage() {
  const supabase = createClient();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, thisYear: 0 });

  useEffect(() => {
    loadAlumni();
  }, []);

  async function loadAlumni() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', userData.school_id)
      .in('status', ['alumni', 'graduated'])
      .order('graduation_date', { ascending: false });

    if (data) {
      setAlumni(data);
      const thisYear = new Date().getFullYear();
      setStats({
        total: data.length,
        thisYear: data.filter(a => a.graduation_date?.startsWith(thisYear.toString())).length,
      });
    }
  }

  const filtered = alumni.filter(a => {
    const name = `${a.first_name} ${a.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || a.admission_number.includes(search);
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Alumni</h1>
        <p className="text-slate-500 mt-1">Graduated and former students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                <p className="text-sm text-blue-600">Total Alumni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-700">{stats.thisYear}</p>
                <p className="text-sm text-emerald-600">Graduated This Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alumni List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search alumni..."
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
                <TableHead>Name</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>Graduated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    No alumni yet. Students graduate after completing Grade 12 clearance.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={a.profile_picture_url || ''} />
                          <AvatarFallback>{a.first_name[0]}{a.last_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{a.first_name} {a.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{a.admission_number}</TableCell>
                    <TableCell>{a.stream || '-'}</TableCell>
                    <TableCell>
                      {a.graduation_date ? new Date(a.graduation_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${a.id}`}>
                        <Button variant="ghost" size="icon">
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

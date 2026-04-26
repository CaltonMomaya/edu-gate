'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Printer, ArrowLeft, Users, QrCode } from 'lucide-react';

export default function BulkIdCardsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [selectedGrade]);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    const { data: school } = await supabase.from('schools').select('name').eq('id', userData.school_id).single();
    if (school) setSchoolName(school.name);

    let query = supabase.from('students').select('*').eq('school_id', userData.school_id).eq('status', 'active');
    if (selectedGrade !== 'all') query = query.eq('grade', selectedGrade);
    const { data } = await query.order('grade').order('last_name');
    if (data) setStudents(data);
    setIsLoading(false);
  }

  function printAll() { window.print(); }

  const gradeCounts: Record<string, number> = {};
  students.forEach(s => { gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1; });

  // Count all students for the badge totals
  const [allStudents, setAllStudents] = useState<any[]>([]);
  useEffect(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
      if (!userData?.school_id) return;
      const { data } = await supabase.from('students').select('grade').eq('school_id', userData.school_id).eq('status', 'active');
      if (data) setAllStudents(data);
    }
    loadAll();
  }, []);

  const allGradeCounts: Record<string, number> = {};
  allStudents.forEach(s => { allGradeCounts[s.grade] = (allGradeCounts[s.grade] || 0) + 1; });

  const previewStudents = students.slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/students" className="text-slate-500"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Generate ID Cards</h1>
            <p className="text-slate-500">{students.length} students selected</p>
          </div>
        </div>
        <Button onClick={printAll} className="bg-gradient-to-r from-blue-600 to-emerald-600" disabled={students.length === 0}>
          <Printer className="mr-2 h-4 w-4" /> Print All ({students.length})
        </Button>
      </div>

      {/* Grade Filter */}
      <div className="no-print">
        <span className="text-sm font-medium text-slate-600">Filter by Grade:</span>
        <div className="flex gap-2 flex-wrap mt-2">
          <Badge className={`cursor-pointer px-4 py-2 text-sm ${selectedGrade === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`} onClick={() => setSelectedGrade('all')}>
            All Grades ({allStudents.length})
          </Badge>
          {Object.entries(allGradeCounts).sort().map(([grade, count]) => (
            <Badge key={grade} className={`cursor-pointer px-4 py-2 text-sm ${selectedGrade === grade ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`} onClick={() => setSelectedGrade(grade)}>
              Grade {grade} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="no-print">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">
          Preview (showing {Math.min(6, students.length)} of {students.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {previewStudents.map(s => (
            <Card key={s.id} className="border shadow-sm">
              <div className="bg-blue-800 text-white p-2 text-center text-xs font-bold">{schoolName}</div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-12 w-12 rounded-sm"><AvatarImage src={s.profile_picture_url || ''} /><AvatarFallback className="text-sm font-bold">{s.first_name?.[0]}{s.last_name?.[0]}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-bold text-sm">{s.first_name} {s.last_name}</p>
                    <Badge variant="outline" className="text-xs">{s.admission_number}</Badge>
                  </div>
                </div>
                <div className="text-xs space-y-1"><p>Grade {s.grade} · {s.stream || '-'} · {s.house || '-'}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Printable Cards */}
      <div className="hidden print:block">
        {students.map((s, i) => (
          <div key={s.id} className="border-2 border-black rounded-md overflow-hidden max-w-[320px] mx-auto mb-4" style={{ width: '320px', height: '200px', pageBreakAfter: (i + 1) % 3 === 0 ? 'always' : 'auto' }}>
            <div className="bg-blue-800 text-white p-2 flex justify-between">
              <div><p className="text-[10px] font-bold">{schoolName}</p><p className="text-[7px]">SCHOOL ID</p></div>
              <p className="text-[8px] font-bold bg-white text-blue-800 px-1 rounded">ID</p>
            </div>
            <div className="p-2 flex gap-2">
              <Avatar className="h-14 w-14 rounded-sm border"><AvatarImage src={s.profile_picture_url || ''} /><AvatarFallback>{s.first_name?.[0]}{s.last_name?.[0]}</AvatarFallback></Avatar>
              <div className="text-[9px] space-y-0.5">
                <p className="font-bold text-[11px]">{s.first_name} {s.last_name}</p>
                <p>Adm: <span className="font-bold">{s.admission_number}</span></p>
                <p>Grade {s.grade} · {s.stream || 'N/A'}</p>
                <p>House: {s.house || 'N/A'}</p>
              </div>
            </div>
            <div className="px-2"><p className="text-[7px] text-slate-500">PRIMARY CONTACT</p><p className="text-[8px]">See school records</p></div>
            <div className="bg-slate-100 px-2 py-1 flex justify-between border-t"><p className="text-[7px]">ID: {s.id?.slice(0,8)}</p><p className="text-[7px]">Issued: {new Date().toLocaleDateString()}</p></div>
          </div>
        ))}
      </div>

      <style jsx global>{`@media print { .no-print { display: none !important; } body { background: white; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`}</style>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';

export default function IdCardPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [student, setStudent] = useState<any>(null);
  const [emergencyGuardian, setEmergencyGuardian] = useState<any>(null);
  const [schoolName, setSchoolName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }

    const { data: school } = await supabase.from('schools').select('name').eq('id', userData.school_id).single();
    if (school) setSchoolName(school.name);
    const { data: stud } = await supabase.from('students').select('*').eq('id', id).single();
    if (stud) setStudent(stud);
    const { data: guards } = await supabase.from('guardians').select('*').eq('student_id', id);
    if (guards) {
      const em = guards.find(g => g.is_emergency_contact) || guards.find(g => g.is_primary);
      setEmergencyGuardian(em);
    }
    setIsLoading(false);
  }

  function printCard() { window.print(); }

  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!student) return <div className="p-6 text-center">Student not found.</div>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href={`/students/${id}`} className="text-slate-500"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-xl font-bold text-slate-800">Student ID Card</h1>
        </div>
        <Button onClick={printCard} size="sm"><Printer className="mr-1 h-4 w-4" /> Print</Button>
      </div>

      {/* Kenyan Gov't Style ID - Credit Card Size */}
      <div className="print:block max-w-[320px] mx-auto border border-slate-300 rounded-md overflow-hidden" style={{ width: '320px', height: '200px' }}>
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold leading-tight">REPUBLIC OF KENYA</p>
            <p className="text-[8px] leading-tight">{schoolName}</p>
          </div>
          <p className="text-[8px] font-bold">STUDENT ID</p>
        </div>
        <div className="p-2 flex gap-2">
          <Avatar className="h-16 w-16 rounded-sm border">
            <AvatarImage src={student.profile_picture_url || ''} className="object-cover" />
            <AvatarFallback className="text-sm">{student.first_name?.[0]}{student.last_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-[9px] space-y-0.5">
            <p className="font-bold text-[11px]">{student.first_name} {student.last_name}</p>
            <p>Adm: <span className="font-bold">{student.admission_number}</span></p>
            <p>Grade {student.grade} · {student.stream || 'N/A'}</p>
            <p>House: {student.house || 'N/A'}</p>
            <p>DOB: {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
        <div className="px-2 pb-1">
          <p className="text-[7px] text-slate-500 font-semibold">EMERGENCY CONTACT</p>
          {emergencyGuardian ? (
            <p className="text-[8px]">{emergencyGuardian.full_name} · 📞 {emergencyGuardian.phone_number}</p>
          ) : <p className="text-[8px] text-slate-400">None</p>}
        </div>
        <div className="bg-blue-50 px-2 py-1 flex justify-between items-center">
          <p className="text-[7px] text-slate-400">ID: {student.id?.slice(0, 8)}</p>
          <p className="text-[7px] text-slate-400">Issued: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <style jsx global>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
    </div>
  );
}

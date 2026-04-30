'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
// import { createNotification } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EditStudentPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [student, setStudent] = useState<any>({
    first_name: '', last_name: '', admission_number: '', grade: '10', stream: '', house: '', gender: 'male', status: 'active',
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('students').select('*').eq('id', id).single();
      if (data) setStudent(data);
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('students').update({
      first_name: student.first_name, last_name: student.last_name,
      grade: student.grade, stream: student.stream, house: student.house,
      gender: student.gender, status: student.status,
    }).eq('id', id);
    setSaving(false);
    if (error) toast.error('Failed');
    else { toast.success('Saved!'); router.push(`/students/${id}`); }
  }

  async function handleTransfer() {
    if (!confirm('Transfer student? This will create clearance records for ALL departments.')) return;
    setTransferring(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); setTransferring(false); return; }

    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { toast.error('School not found'); setTransferring(false); return; }

    // Update student status
    await supabase.from('students').update({ status: 'transferred' }).eq('id', id);

    // Get departments
    const { data: depts } = await supabase.from('departments').select('id, name').eq('school_id', userData.school_id);
    
    if (depts && depts.length > 0) {
      const records = depts.map(d => ({ student_id: id, department_id: d.id, status: 'pending' }));
      await supabase.from('student_clearance').upsert(records, { onConflict: 'student_id, department_id' });

      // Create notification
      // await createNotification(
      toast.success(`Transferred! ${depts.length} departments added to clearance.`);
      router.push('/clearance');
    } else {
      toast.warning('Transferred, but no departments found. Create departments first.');
    }
    setTransferring(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/students/${id}`} className="text-slate-500"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Student</h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label>Admission Number</Label><Input value={student.admission_number} disabled className="bg-slate-50" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input value={student.first_name} onChange={e => setStudent({...student, first_name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={student.last_name} onChange={e => setStudent({...student, last_name: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Grade</Label>
                <Select value={student.grade} onValueChange={v => setStudent({...student, grade: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="10">Grade 10</SelectItem><SelectItem value="11">Grade 11</SelectItem><SelectItem value="12">Grade 12</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Gender</Label>
                <Select value={student.gender} onValueChange={v => setStudent({...student, gender: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={student.status} onValueChange={v => setStudent({...student, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="transferred">Transferred</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Stream</Label><Input value={student.stream} onChange={e => setStudent({...student, stream: e.target.value})} /></div>
              <div className="space-y-2"><Label>House</Label><Input value={student.house} onChange={e => setStudent({...student, house: e.target.value})} /></div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-emerald-600" disabled={saving}>{saving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" />Save</>}</Button>
              <Button type="button" variant="outline" className="text-red-600 border-red-200" onClick={handleTransfer} disabled={transferring}>
                {transferring ? 'Transferring...' : <><AlertTriangle className="mr-2 h-4 w-4" />Transfer & Clearance</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-amber-50">
        <CardContent className="p-4 text-sm text-slate-600 space-y-1">
          <p className="font-medium text-amber-700">Transfer Process:</p>
          <p><CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />Student marked as Transferred</p>
          <p><CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />Clearance records created for ALL departments</p>
          <p><CheckCircle className="h-3 w-3 inline text-emerald-500 mr-1" />Redirects to Clearance module</p>
        </CardContent>
      </Card>
    </div>
  );
}

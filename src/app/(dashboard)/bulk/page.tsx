'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Users, TrendingUp, Trash2, GraduationCap, Send, DollarSign, AlertTriangle } from 'lucide-react';

export default function BulkOperationsPage() {
  const supabase = createClient();
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [counts, setCounts] = useState({ grade10: 0, grade11: 0, grade12: 0, total: 0 });

  // Bulk Fee Update state
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeTerm, setFeeTerm] = useState('term1');
  const [feeYear, setFeeYear] = useState(new Date().getFullYear().toString());

  useEffect(() => { loadCounts(); }, []);

  async function loadCounts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: students } = await supabase.from('students').select('grade, status').eq('school_id', userData.school_id);
    if (students) {
      const active = students.filter((s: any) => s.status === 'active');
      setCounts({
        grade10: active.filter((s: any) => s.grade === '10').length,
        grade11: active.filter((s: any) => s.grade === '11').length,
        grade12: active.filter((s: any) => s.grade === '12').length,
        total: active.length,
      });
    }
  }

  async function handlePromoteAll() {
    const grade = selectedGrade === 'all' ? 'all students' : `Grade ${selectedGrade}`;
    if (!confirm(`Promote ${grade}?`)) return;
    setIsLoading(true);
    const res = await fetch('/api/auto-promote', { method: 'POST' });
    const data = await res.json();
    if (data.success) { toast.success(data.message); loadCounts(); }
    else toast.error('Failed');
    setIsLoading(false);
  }

  async function handleBulkDelete() {
    const target = selectedGrade === 'all' ? 'ALL' : `Grade ${selectedGrade}`;
    if (!confirm(`⚠️ DELETE ${target} students? CANNOT be undone!`)) return;
    setIsLoading(true);
    let query = supabase.from('students').delete().eq('school_id', schoolId);
    if (selectedGrade !== 'all') query = query.eq('grade', selectedGrade);
    const { error, count } = await query;
    if (error) toast.error('Failed');
    else { toast.success(`Deleted ${count || 0} students`); loadCounts(); }
    setIsLoading(false);
  }

  async function handleBulkSms() {
    const target = selectedGrade === 'all' ? 'all' : `Grade ${selectedGrade}`;
    if (!confirm(`Send SMS to guardians of ${target} students?`)) return;
    setIsLoading(true);
    let query = supabase.from('students').select('id, first_name').eq('school_id', schoolId).eq('status', 'active');
    if (selectedGrade !== 'all') query = query.eq('grade', selectedGrade);
    const { data: students } = await query;
    if (!students) { setIsLoading(false); return; }
    let sent = 0;
    for (const s of students) {
      const { data: g } = await supabase.from('guardians').select('phone_number').eq('student_id', s.id).eq('is_primary', true).single();
      if (g?.phone_number) {
        const { sendSms } = await import('@/lib/sms/send');
        const result = await sendSms(g.phone_number, 'School announcement: Please check for updates.', schoolId, supabase);
        if (result.success) sent++;
      }
    }
    toast.success(`SMS sent to ${sent}/${students.length} guardians`);
    setIsLoading(false);
  }

  async function handleBulkFeeUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!feeName || !feeAmount) { toast.error('Enter fee name and amount'); return; }
    const target = selectedGrade === 'all' ? 'all grades' : `Grade ${selectedGrade}`;
    if (!confirm(`Add "${feeName}" (KES ${parseFloat(feeAmount).toLocaleString()}) to ${target}?`)) return;

    setIsLoading(true);
    const grades = selectedGrade === 'all' ? ['10', '11', '12'] : [selectedGrade];
    let added = 0;

    for (const grade of grades) {
      const { error } = await supabase.from('fee_structures').insert({
        school_id: schoolId,
        name: feeName,
        amount: parseFloat(feeAmount),
        grade,
        term: feeTerm,
        academic_year: feeYear,
      });
      if (!error) added++;
    }

    toast.success(`Fee added to ${added} grade(s)!`);
    setFeeDialogOpen(false);
    setFeeName(''); setFeeAmount('');
    setIsLoading(false);
  }

  const recipientCount = selectedGrade === 'all' ? counts.total : selectedGrade === '10' ? counts.grade10 : selectedGrade === '11' ? counts.grade11 : counts.grade12;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Bulk Operations</h1><p className="text-slate-500">Perform actions on multiple students at once</p></div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{counts.total}</p><p className="text-xs text-slate-500">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><GraduationCap className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{counts.grade10}</p><p className="text-xs text-slate-500">Grade 10</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><GraduationCap className="h-5 w-5 mx-auto text-amber-600 mb-1" /><p className="text-2xl font-bold">{counts.grade11}</p><p className="text-xs text-slate-500">Grade 11</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><GraduationCap className="h-5 w-5 mx-auto text-purple-600 mb-1" /><p className="text-2xl font-bold">{counts.grade12}</p><p className="text-xs text-slate-500">Grade 12</p></CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Select Target</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students ({counts.total})</SelectItem>
              <SelectItem value="10">Grade 10 ({counts.grade10})</SelectItem>
              <SelectItem value="11">Grade 11 ({counts.grade11})</SelectItem>
              <SelectItem value="12">Grade 12 ({counts.grade12})</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md cursor-pointer" onClick={handlePromoteAll}>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-10 w-10 mx-auto text-blue-600 mb-3" />
            <CardTitle className="mb-2">Auto-Promote</CardTitle>
            <CardDescription>Promote to next grade. Cleared Grade 12 → Alumni.</CardDescription>
            <Badge className="mt-3 bg-blue-100 text-blue-700">Safe</Badge>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md cursor-pointer" onClick={handleBulkSms}>
          <CardContent className="p-6 text-center">
            <Send className="h-10 w-10 mx-auto text-emerald-600 mb-3" />
            <CardTitle className="mb-2">Bulk SMS</CardTitle>
            <CardDescription>Send announcement to guardians.</CardDescription>
            <Badge className="mt-3 bg-emerald-100 text-emerald-700">{recipientCount} recipients</Badge>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md cursor-pointer" onClick={() => setFeeDialogOpen(true)}>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-10 w-10 mx-auto text-amber-600 mb-3" />
            <CardTitle className="mb-2">Bulk Fee Update</CardTitle>
            <CardDescription>Add fee item to selected grades.</CardDescription>
            <Badge className="mt-3 bg-amber-100 text-amber-700">{selectedGrade === 'all' ? '3 grades' : '1 grade'}</Badge>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md cursor-pointer border-red-200" onClick={handleBulkDelete}>
          <CardContent className="p-6 text-center">
            <Trash2 className="h-10 w-10 mx-auto text-red-600 mb-3" />
            <CardTitle className="mb-2 text-red-600">Bulk Delete</CardTitle>
            <CardDescription>⚠️ Permanently delete students.</CardDescription>
            <Badge className="mt-3 bg-red-100 text-red-700">Danger</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Fee Update Dialog */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Fee Update</DialogTitle></DialogHeader>
          <form onSubmit={handleBulkFeeUpdate} className="space-y-4">
            <div className="space-y-2"><Label>Fee Name *</Label><Input value={feeName} onChange={e => setFeeName(e.target.value)} placeholder="e.g., Tuition, Boarding" /></div>
            <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} placeholder="e.g., 25000" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Term</Label><Select value={feeTerm} onValueChange={setFeeTerm}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Year</Label><Input value={feeYear} onChange={e => setFeeYear(e.target.value)} /></div>
            </div>
            <p className="text-sm text-slate-500">This will add "{feeName || '...'}" to {selectedGrade === 'all' ? 'all grades' : `Grade ${selectedGrade}`}.</p>
            <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Apply Fee'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

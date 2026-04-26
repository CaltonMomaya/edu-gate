'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2, Users, Phone, MessageSquare } from 'lucide-react';
import { sendSms } from '@/lib/sms/send';

interface GuardianWithStudent {
  id: string; full_name: string; phone_number: string; relationship: string;
  student_name: string; student_admission: string; student_grade: string; student_stream: string;
}

export default function BulkSmsPage() {
  const supabase = createClient();
  const [schoolId, setSchoolId] = useState('');
  const [smsBalance, setSmsBalance] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStream, setSelectedStream] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [guardians, setGuardians] = useState<GuardianWithStudent[]>([]);
  const [allGuardians, setAllGuardians] = useState<GuardianWithStudent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [message, setMessage] = useState('');
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => { loadAllForCounts(); }, []);
  useEffect(() => { loadFiltered(); }, [selectedGrade, selectedStream]);

  async function loadAllForCounts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data: school } = await supabase.from('schools').select('sms_balance').eq('id', userData.school_id).single();
    if (school) setSmsBalance(school.sms_balance || 0);

    const { data: students } = await supabase.from('students').select('id, first_name, last_name, admission_number, grade, stream').eq('school_id', userData.school_id).eq('status', 'active');
    if (students) {
      const sIds = students.map((s: any) => s.id);
      const { data: gData } = await supabase.from('guardians').select('*').in('student_id', sIds);
      if (gData) {
        const formatted = gData.map((g: any) => {
          const s = students.find((st: any) => st.id === g.student_id);
          return { id: g.id, full_name: g.full_name, phone_number: g.phone_number, relationship: g.relationship, student_name: s ? `${s.first_name} ${s.last_name}` : '', student_admission: s?.admission_number || '', student_grade: s?.grade || '', student_stream: s?.stream || 'Unassigned' };
        });
        setAllGuardians(formatted);
      }
    }
  }

  async function loadFiltered() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    let query = supabase.from('students').select('id, first_name, last_name, admission_number, grade, stream').eq('school_id', userData.school_id).eq('status', 'active');
    if (selectedGrade !== 'all') query = query.eq('grade', selectedGrade);
    if (selectedStream !== 'all') query = query.eq('stream', selectedStream);

    const { data: students } = await query.order('last_name');
    if (students) {
      const sIds = students.map((s: any) => s.id);
      const { data: gData } = await supabase.from('guardians').select('*').in('student_id', sIds);
      if (gData) {
        setGuardians(gData.map((g: any) => {
          const s = students.find((st: any) => st.id === g.student_id);
          return { id: g.id, full_name: g.full_name, phone_number: g.phone_number, relationship: g.relationship, student_name: s ? `${s.first_name} ${s.last_name}` : '', student_admission: s?.admission_number || '', student_grade: s?.grade || '', student_stream: s?.stream || 'Unassigned' };
        }));
      }
    }
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    const ns = new Set(selectedIds); ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelectedIds(ns); setSelectAll(ns.size === filteredGuardians.length && filteredGuardians.length > 0);
  }

  function toggleSelectAll() {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); }
    else { setSelectedIds(new Set(filteredGuardians.map(g => g.id))); setSelectAll(true); }
  }

  async function sendBulkSms() {
    if (selectedIds.size === 0) { toast.error('Select recipients'); return; }
    if (!message) { toast.error('Enter message'); return; }
    if (selectedIds.size > smsBalance) { toast.error(`Need ${selectedIds.size} credits, have ${smsBalance}`); return; }
    if (!confirm(`Send to ${selectedIds.size} guardians?`)) return;
    setIsSending(true); let sent = 0;
    for (const g of guardians.filter(g => selectedIds.has(g.id))) {
      const r = await sendSms(g.phone_number, message, schoolId, supabase);
      if (r.success) sent++;
    }
    setSentCount(sent); toast.success(`Sent ${sent}/${selectedIds.size}`);
    const { data: school } = await supabase.from('schools').select('sms_balance').eq('id', schoolId).single();
    if (school) setSmsBalance(school.sms_balance || 0);
    setIsSending(false);
  }

  const filteredGuardians = guardians.filter(g => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return g.full_name.toLowerCase().includes(q) || g.student_name.toLowerCase().includes(q) || g.phone_number.includes(q);
  });

  // Grade counts from ALL guardians
  const gradeCounts: Record<string, number> = {};
  allGuardians.forEach(g => { gradeCounts[g.student_grade] = (gradeCounts[g.student_grade] || 0) + 1; });

  // Stream counts from currently filtered grade
  const streamCounts: Record<string, number> = {};
  guardians.forEach(g => { const s = g.student_stream || 'Unassigned'; streamCounts[s] = (streamCounts[s] || 0) + 1; });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sms"><ArrowLeft className="h-5 w-5 text-slate-500" /></Link>
        <div><h1 className="text-2xl font-bold text-slate-800">Bulk SMS</h1><p className="text-slate-500">Send to multiple guardians</p></div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{allGuardians.length}</p><p className="text-xs text-slate-500">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Phone className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{selectedIds.size}</p><p className="text-xs text-slate-500">Selected</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><MessageSquare className="h-5 w-5 mx-auto text-amber-600 mb-1" /><p className="text-2xl font-bold">{smsBalance}</p><p className="text-xs text-slate-500">Credits</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Send className="h-5 w-5 mx-auto text-purple-600 mb-1" /><p className="text-2xl font-bold">{sentCount}</p><p className="text-xs text-slate-500">Sent</p></CardContent></Card>
      </div>

      {/* Grade Filter */}
      <div>
        <span className="text-sm font-medium text-slate-600">Filter by Grade:</span>
        <div className="flex gap-2 flex-wrap mt-2">
          <Badge className={`cursor-pointer px-3 py-1 ${selectedGrade === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`} onClick={() => { setSelectedGrade('all'); setSelectedStream('all'); }}>All ({allGuardians.length})</Badge>
          {Object.entries(gradeCounts).sort().map(([g, c]) => (
            <Badge key={g} className={`cursor-pointer px-3 py-1 ${selectedGrade === g ? 'bg-blue-600 text-white' : 'bg-slate-100'}`} onClick={() => { setSelectedGrade(g); setSelectedStream('all'); }}>Grade {g} ({c})</Badge>
          ))}
        </div>
      </div>

      {/* Stream Filter */}
      {selectedGrade !== 'all' && Object.keys(streamCounts).length > 0 && (
        <div>
          <span className="text-sm font-medium text-slate-600">Filter by Stream:</span>
          <div className="flex gap-2 flex-wrap mt-2">
            <Badge className={`cursor-pointer px-3 py-1 ${selectedStream === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`} onClick={() => setSelectedStream('all')}>All Streams ({guardians.length})</Badge>
            {Object.entries(streamCounts).sort().map(([s, c]) => (
              <Badge key={s} className={`cursor-pointer px-3 py-1 ${selectedStream === s ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`} onClick={() => setSelectedStream(s)}>{s} ({c})</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recipients ({filteredGuardians.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>{selectAll ? 'Deselect All' : 'Select All'}</Button>
            </div>
            <Input placeholder="Search..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="mt-2" />
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-1">
            {filteredGuardians.map(g => (
              <label key={g.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border ${selectedIds.has(g.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleSelect(g.id)} className="h-4 w-4" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{g.full_name} <span className="text-xs text-slate-400">({g.relationship})</span></p>
                  <p className="text-xs text-slate-500">{g.student_name} · G{g.student_grade} · {g.student_stream}</p>
                </div>
                <span className="text-xs text-slate-500">{g.phone_number}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type message..." rows={6} />
            <p className="text-xs text-slate-500">Cost: {selectedIds.size} credits</p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" onClick={sendBulkSms} disabled={isSending || selectedIds.size === 0 || !message || smsBalance < selectedIds.size}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Send to {selectedIds.size}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

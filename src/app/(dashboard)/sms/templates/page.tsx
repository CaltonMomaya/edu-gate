'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { sendSms } from '@/lib/sms/send';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Loader2, ArrowLeft, Users, Phone, MessageSquare, Search, Calendar } from 'lucide-react';

const defaultTemplates = [
  { name: 'Fee Reminder', message: 'Dear parent, school fees of KES {amount} for {student_name} are due by {date}. Pay via M-Pesa. - {school}' },
  { name: 'Exam Results', message: 'Dear parent, {student_name} scored {average}% in {exam_name}. Full report at school. - {school}' },
  { name: 'Meeting Invite', message: 'Dear parent, parents meeting on {date} at {time}. Venue: {venue}. - {school}' },
  { name: 'Leave Notification', message: '{student_name} released. Pickup: {guardian}. Return: {return_date}. - {school}' },
  { name: 'Emergency', message: 'URGENT: {message}. Contact school. - {school}' },
];

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates] = useState(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplates[0]);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [smsBalance, setSmsBalance] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStream, setSelectedStream] = useState('all');
  const [guardians, setGuardians] = useState<any[]>([]);
  const [allGuardians, setAllGuardians] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadFiltered(); }, [selectedGrade, selectedStream]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data: school } = await supabase.from('schools').select('name, sms_balance').eq('id', userData.school_id).single();
    if (school) { setSchoolName(school.name); setSmsBalance(school.sms_balance || 0); }

    const { data: students } = await supabase.from('students').select('id, first_name, last_name, admission_number, grade, stream').eq('school_id', userData.school_id).eq('status', 'active');
    if (students) {
      const sIds = students.map((s: any) => s.id);
      const { data: gData } = await supabase.from('guardians').select('*').in('student_id', sIds);
      if (gData) {
        setAllGuardians(gData.map((g: any) => {
          const s = students.find((st: any) => st.id === g.student_id);
          return { id: g.id, full_name: g.full_name, phone_number: g.phone_number, relationship: g.relationship, student_name: s ? `${s.first_name} ${s.last_name}` : '', student_grade: s?.grade || '', student_stream: s?.stream || 'Unassigned' };
        }));
      }
    }

    // Auto-fill from latest event if Meeting Invite
    const { data: latestEvent } = await supabase.from('events').select('*').eq('school_id', userData.school_id).order('created_at', { ascending: false }).limit(1).single();
    if (latestEvent) {
      const msg = defaultTemplates[2].message
        .replace('{school}', schoolName)
        .replace('{date}', latestEvent.event_date || '')
        .replace('{time}', latestEvent.event_time || '')
        .replace('{venue}', latestEvent.venue || '');
      setMessage(msg);
    } else {
      setMessage(defaultTemplates[0].message.replace('{school}', schoolName));
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
    if (!students || students.length === 0) { setGuardians([]); return; }

    const sIds = students.map((s: any) => s.id);
    const { data: gData } = await supabase.from('guardians').select('*').in('student_id', sIds);
    if (gData) {
      setGuardians(gData.map((g: any) => {
        const s = students.find((st: any) => st.id === g.student_id);
        return { id: g.id, full_name: g.full_name, phone_number: g.phone_number, relationship: g.relationship, student_name: s ? `${s.first_name} ${s.last_name}` : '', student_grade: s?.grade || '', student_stream: s?.stream || 'Unassigned' };
      }));
    }
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) { const ns = new Set(selectedIds); ns.has(id) ? ns.delete(id) : ns.add(id); setSelectedIds(ns); }
  function toggleSelectAll() { if (selectedIds.size === filteredGuardians.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredGuardians.map(g => g.id))); }

  async function sendBulk() {
    if (selectedIds.size === 0) { toast.error('Select recipients'); return; }
    if (!message) { toast.error('Enter message'); return; }
    if (selectedIds.size > smsBalance) { toast.error(`Need ${selectedIds.size} credits`); return; }
    if (!confirm(`Send to ${selectedIds.size} guardians?`)) return;
    setIsSending(true); let sent = 0;
    for (const g of guardians.filter(g => selectedIds.has(g.id))) {
      const r = await sendSms(g.phone_number, message, schoolId, supabase);
      if (r.success) sent++;
    }
    setSentCount(sent); toast.success(`Sent ${sent}/${selectedIds.size}`);
    const { data: s } = await supabase.from('schools').select('sms_balance').eq('id', schoolId).single();
    if (s) setSmsBalance(s.sms_balance || 0);
    setIsSending(false);
  }

  const filteredGuardians = guardians.filter(g => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return g.full_name.toLowerCase().includes(q) || g.student_name.toLowerCase().includes(q);
  });

  const gradeCounts: Record<string, number> = {};
  allGuardians.forEach(g => { gradeCounts[g.student_grade] = (gradeCounts[g.student_grade] || 0) + 1; });
  const streamCounts: Record<string, number> = {};
  guardians.forEach(g => { const s = g.student_stream || 'Unassigned'; streamCounts[s] = (streamCounts[s] || 0) + 1; });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sms"><ArrowLeft className="h-5 w-5 text-slate-500" /></Link>
          <div><h1 className="text-2xl font-bold text-slate-800">SMS Templates</h1><p className="text-slate-500">Send template messages by grade & stream</p></div>
        </div>
        <Link href="/events"><Button variant="outline" size="sm"><Calendar className="mr-1 h-3 w-3" />Create Event</Button></Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-600" /><p className="text-2xl font-bold">{allGuardians.length}</p><p className="text-xs">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Phone className="h-5 w-5 mx-auto text-emerald-600" /><p className="text-2xl font-bold">{selectedIds.size}</p><p className="text-xs">Selected</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><MessageSquare className="h-5 w-5 mx-auto text-amber-600" /><p className="text-2xl font-bold">{smsBalance}</p><p className="text-xs">Credits</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Send className="h-5 w-5 mx-auto text-purple-600" /><p className="text-2xl font-bold">{sentCount}</p><p className="text-xs">Sent</p></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {templates.map(t => (
          <Badge key={t.name} className={`cursor-pointer px-4 py-2 text-sm ${selectedTemplate.name === t.name ? 'bg-blue-600 text-white shadow-md font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            onClick={() => { setSelectedTemplate(t); setMessage(t.message.replace('{school}', schoolName)); }}>
            {t.name}
          </Badge>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Filter by Grade:</p>
        <div className="flex gap-2 flex-wrap">
          <Badge className={`cursor-pointer px-4 py-2 ${selectedGrade === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={() => { setSelectedGrade('all'); setSelectedStream('all'); }}>All ({allGuardians.length})</Badge>
          {Object.entries(gradeCounts).sort().map(([g, c]) => (
            <Badge key={g} className={`cursor-pointer px-4 py-2 ${selectedGrade === g ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={() => { setSelectedGrade(g); setSelectedStream('all'); }}>Grade {g} ({c})</Badge>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Filter by Stream:</p>
        <div className="flex gap-2 flex-wrap">
          <Badge className={`cursor-pointer px-4 py-2 ${selectedStream === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={() => setSelectedStream('all')}>All Streams ({guardians.length})</Badge>
          {Object.entries(streamCounts).sort().map(([s, c]) => (
            <Badge key={s} className={`cursor-pointer px-4 py-2 ${selectedStream === s ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={() => setSelectedStream(s)}>{s} ({c})</Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between"><CardTitle>Recipients ({filteredGuardians.length})</CardTitle><Button variant="ghost" size="sm" onClick={toggleSelectAll}>{selectedIds.size === filteredGuardians.length ? 'Deselect' : 'Select All'}</Button></div>
            <Input placeholder="Search..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="mt-2" />
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto space-y-1">
            {filteredGuardians.map(g => (
              <label key={g.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border ${selectedIds.has(g.id) ? 'bg-blue-50 border-blue-300' : ''}`}>
                <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleSelect(g.id)} className="h-4 w-4" />
                <div className="flex-1"><p className="font-medium text-sm">{g.full_name}</p><p className="text-xs text-slate-500">{g.student_name} · G{g.student_grade} · {g.student_stream}</p></div>
                <span className="text-xs text-slate-500">{g.phone_number}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{selectedTemplate.name}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="text-sm" />
            <p className="text-xs text-slate-500">Cost: {selectedIds.size} credits</p>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" onClick={sendBulk} disabled={isSending || selectedIds.size === 0 || !message}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Send to {selectedIds.size}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

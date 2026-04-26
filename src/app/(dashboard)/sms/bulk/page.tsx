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
  id: string;
  full_name: string;
  phone_number: string;
  relationship: string;
  student_name: string;
  student_admission: string;
  student_grade: string;
}

export default function BulkSmsPage() {
  const supabase = createClient();
  const [schoolId, setSchoolId] = useState('');
  const [smsBalance, setSmsBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [guardians, setGuardians] = useState<GuardianWithStudent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [message, setMessage] = useState('');
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => { loadData(); }, [selectedGrade]);

  async function loadData() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    
    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }
    setSchoolId(userData.school_id);

    const { data: school } = await supabase
      .from('schools').select('sms_balance').eq('id', userData.school_id).single();
    if (school) setSmsBalance(school.sms_balance || 0);

    // First get students for grade filter
    let studentQuery = supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade')
      .eq('school_id', userData.school_id)
      .eq('status', 'active');

    if (selectedGrade !== 'all') {
      studentQuery = studentQuery.eq('grade', selectedGrade);
    }

    const { data: students } = await studentQuery.order('last_name');
    
    if (!students || students.length === 0) {
      setGuardians([]);
      setIsLoading(false);
      return;
    }

    // Get guardians for these students
    const studentIds = students.map(s => s.id);
    const { data: guardiansData } = await supabase
      .from('guardians')
      .select('*')
      .in('student_id', studentIds);

    if (guardiansData) {
      const formatted: GuardianWithStudent[] = [];
      for (const g of guardiansData) {
        const student = students.find(s => s.id === g.student_id);
        if (student) {
          formatted.push({
            id: g.id,
            full_name: g.full_name,
            phone_number: g.phone_number,
            relationship: g.relationship,
            student_name: `${student.first_name} ${student.last_name}`,
            student_admission: student.admission_number,
            student_grade: student.grade,
          });
        }
      }
      setGuardians(formatted);
    }
    setIsLoading(false);
  }

  function toggleSelect(id: string) {
    const ns = new Set(selectedIds);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelectedIds(ns);
    setSelectAll(ns.size === filteredGuardians.length && filteredGuardians.length > 0);
  }

  function toggleSelectAll() {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); }
    else { setSelectedIds(new Set(filteredGuardians.map(g => g.id))); setSelectAll(true); }
  }

  async function sendBulkSms() {
    if (selectedIds.size === 0) { toast.error('Select recipients'); return; }
    if (!message) { toast.error('Enter message'); return; }
    if (selectedIds.size > smsBalance) { toast.error(`Need ${selectedIds.size} credits, have ${smsBalance}`); return; }
    if (!confirm(`Send to ${selectedIds.size} guardians? Costs ${selectedIds.size} credits.`)) return;

    setIsSending(true);
    let sent = 0;
    for (const g of guardians.filter(g => selectedIds.has(g.id))) {
      const r = await sendSms(g.phone_number, message, schoolId, supabase);
      if (r.success) sent++;
    }
    setSentCount(sent);
    toast.success(`Sent ${sent}/${selectedIds.size}`);
    const { data: school } = await supabase.from('schools').select('sms_balance').eq('id', schoolId).single();
    if (school) setSmsBalance(school.sms_balance || 0);
    setIsSending(false);
  }

  const filteredGuardians = guardians.filter(g => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return g.full_name.toLowerCase().includes(q) || g.student_name.toLowerCase().includes(q) || g.phone_number.includes(q);
  });

  // Count ALL guardians per grade (not just filtered)
  const [allGuardians, setAllGuardians] = useState<GuardianWithStudent[]>([]);
  
  useEffect(() => {
    async function loadAllForCounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
      if (!userData?.school_id) return;
      
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number, grade')
        .eq('school_id', userData.school_id)
        .eq('status', 'active');

      if (students) {
        const sIds = students.map(s => s.id);
        const { data: gData } = await supabase.from('guardians').select('*').in('student_id', sIds);
        if (gData) {
          const formatted = gData.map(g => {
            const s = students.find(st => st.id === g.student_id);
            return {
              id: g.id, full_name: g.full_name, phone_number: g.phone_number,
              relationship: g.relationship,
              student_name: s ? `${s.first_name} ${s.last_name}` : '',
              student_admission: s?.admission_number || '',
              student_grade: s?.grade || '',
            };
          });
          setAllGuardians(formatted);
        }
      }
    }
    loadAllForCounts();
  }, []);

  const gradeCounts: Record<string, number> = {};
  allGuardians.forEach(g => { if (g.student_grade) gradeCounts[g.student_grade] = (gradeCounts[g.student_grade] || 0) + 1; });

  if (isLoading) {
    return <div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sms"><ArrowLeft className="h-5 w-5 text-slate-500" /></Link>
        <div><h1 className="text-2xl font-bold text-slate-800">Bulk SMS</h1><p className="text-slate-500">Send to multiple guardians</p></div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{allGuardians.length}</p><p className="text-xs text-slate-500">Total Guardians</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Phone className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{selectedIds.size}</p><p className="text-xs text-slate-500">Selected</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><MessageSquare className="h-5 w-5 mx-auto text-amber-600 mb-1" /><p className="text-2xl font-bold">{smsBalance}</p><p className="text-xs text-slate-500">Credits</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Send className="h-5 w-5 mx-auto text-purple-600 mb-1" /><p className="text-2xl font-bold">{sentCount}</p><p className="text-xs text-slate-500">Sent</p></CardContent></Card>
      </div>

      {/* Grade Filter Badges */}
      <div>
        <span className="text-sm font-medium text-slate-600 mr-2">Filter by Grade:</span>
        <div className="flex gap-2 flex-wrap mt-2">
          <Badge className={`cursor-pointer px-4 py-2 ${selectedGrade === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setSelectedGrade('all')}>
            All Grades ({allGuardians.length})
          </Badge>
          {Object.entries(gradeCounts).sort().map(([grade, count]) => (
            <Badge key={grade} className={`cursor-pointer px-4 py-2 ${selectedGrade === grade ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setSelectedGrade(grade)}>
              Grade {grade} ({count})
            </Badge>
          ))}
          {Object.keys(gradeCounts).length === 0 && (
            <span className="text-sm text-slate-400">No guardians found. Add students with guardian contacts first.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recipients ({filteredGuardians.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <Input placeholder="Search by name or phone..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="mt-2" />
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-1">
            {filteredGuardians.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                {selectedGrade !== 'all' ? `No guardians for Grade ${selectedGrade}.` : 'No guardians found.'}
              </p>
            ) : (
              filteredGuardians.map(g => (
                <label key={g.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${selectedIds.has(g.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={selectedIds.has(g.id)} onChange={() => toggleSelect(g.id)} className="h-4 w-4" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{g.full_name} <span className="text-xs text-slate-400 capitalize">({g.relationship})</span></p>
                    <p className="text-xs text-slate-500">{g.student_name} · Grade {g.student_grade} · {g.student_admission}</p>
                  </div>
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-500">{g.phone_number}</span>
                </label>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Compose Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message to selected guardians..." rows={6} />
            <div className="text-xs text-slate-500 space-y-1">
              <p>Selected: {selectedIds.size} guardian{selectedIds.size !== 1 ? 's' : ''}</p>
              <p>Cost: {selectedIds.size} credit{selectedIds.size !== 1 ? 's' : ''}</p>
              <p>Characters: {message.length}</p>
            </div>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" onClick={sendBulkSms} disabled={isSending || selectedIds.size === 0 || !message || smsBalance < selectedIds.size}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send to {selectedIds.size} Guardian{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

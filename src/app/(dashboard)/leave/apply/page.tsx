
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendSms, formatLeaveMessage } from '@/lib/sms/send';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DoorOpen, Search, Loader2, Phone, Calendar, ArrowRight, Printer, Clock, Shield } from 'lucide-react';

export default function ApplyLeavePage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [reason, setReason] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [leaveSheetData, setLeaveSheetData] = useState<any>(null);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const leaveTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const exitTime = new Date(now.getTime() + 10 * 60000);
  const exitTimeStr = `${String(exitTime.getHours()).padStart(2, '0')}:${String(exitTime.getMinutes()).padStart(2, '0')}`;

  useEffect(() => { loadSchool(); }, []);

  async function loadSchool() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (userData?.school_id) {
      setSchoolId(userData.school_id);
      const { data: school } = await supabase.from('schools').select('name').eq('id', userData.school_id).single();
      if (school) setSchoolName(school.name);
    }
  }

  async function searchStudents(query: string) {
    setStudentSearch(query);
    if (query.length < 2) return;
    const { data } = await supabase.from('students').select('*').eq('school_id', schoolId).eq('status', 'active').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`).limit(10);
    if (data) setStudents(data);
  }

  function selectStudent(s: any) { setSelectedStudent(s); setStudentSearch(`${s.first_name} ${s.last_name}`); loadGuardians(s.id); }
  
  async function loadGuardians(id: string) {
    const { data } = await supabase.from('guardians').select('*').eq('student_id', id);
    if (data) { setGuardians(data); const p = data.find((g: any) => g.is_primary); if (p) setSelectedGuardian(p.id); }
  }

  function printSheet() { window.print(); }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !selectedGuardian || !reason || !expectedReturnDate || !expectedReturnTime) { toast.error('Fill all fields'); return; }
    setIsLoading(true);

    const guardian = guardians.find(g => g.id === selectedGuardian);
    const returnDateTime = `${expectedReturnDate}T${expectedReturnTime}:00`;

    const { error } = await supabase.from('leave_requests').insert({
      student_id: selectedStudent.id, school_id: schoolId, guardian_id: selectedGuardian,
      reason, leave_start: new Date().toISOString(), expected_return: new Date(returnDateTime).toISOString(),
      status: 'approved', sms_sent_to_guardian: true,
    });

    if (error) { toast.error('Failed'); setIsLoading(false); return; }

    setLeaveSheetData({
      studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
      admission: selectedStudent.admission_number,
      grade: selectedStudent.grade,
      house: selectedStudent.house,
      photo: selectedStudent.profile_picture_url,
      guardianName: guardian?.full_name,
      guardianPhone: guardian?.phone_number,
      guardianRelation: guardian?.relationship,
      reason, leaveTime, exitTimeStr, today,
      returnDate: expectedReturnDate, returnTime: expectedReturnTime,
      schoolName,
    });

    if (guardian) {
      const msg = formatLeaveMessage(`${selectedStudent.full_name}`, guardian.full_name, exitTimeStr, expectedReturnDate, expectedReturnTime, schoolName);
      await sendSms(guardian.phone_number, msg, schoolId, supabase);
    }

    setShowPrint(true);
    toast.success('Leave approved!');
    setIsLoading(false);
  }

  const guardianData = guardians.find(g => g.id === selectedGuardian);

  if (showPrint && leaveSheetData) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="no-print flex gap-3 mb-6">
          <Button onClick={printSheet} className="bg-gradient-to-r from-blue-600 to-emerald-600"><Printer className="mr-2 h-4 w-4" /> Print Leave Sheet</Button>
          <Button variant="outline" onClick={() => { setShowPrint(false); setLeaveSheetData(null); setSelectedStudent(null); setStudentSearch(''); }}>New Leave</Button>
        </div>

        {/* The Printable Leave Sheet */}
        <div className="border-2 border-slate-800 rounded-lg p-6 bg-white max-w-md mx-auto shadow-lg print:shadow-none print:border-2 print:border-black">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
            <h1 className="text-xl font-bold text-slate-900">{leaveSheetData.schoolName}</h1>
            <p className="text-sm font-semibold text-slate-700">STUDENT EXIT PASS</p>
          </div>
          <div className="flex items-center gap-4 mb-4 p-3 bg-slate-100 rounded-lg">
            <Avatar className="h-16 w-16 rounded-lg border-2 border-slate-300">
              <AvatarImage src={leaveSheetData.photo || ''} />
              <AvatarFallback className="text-xl font-bold text-slate-700">{leaveSheetData.studentName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg text-slate-900">{leaveSheetData.studentName}</p>
              <p className="text-sm text-slate-700">{leaveSheetData.admission} · Grade {leaveSheetData.grade}</p>
              <p className="text-sm text-slate-700">{leaveSheetData.house || ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded text-center border border-blue-300">
              <p className="text-xs text-slate-700 font-semibold">Issued At</p>
              <p className="font-bold text-slate-900">{leaveSheetData.leaveTime} · {leaveSheetData.today}</p>
            </div>
            <div className="bg-amber-100 p-2 rounded text-center border border-amber-300">
              <p className="text-xs text-slate-700 font-semibold">Exit By</p>
              <p className="font-bold text-slate-900">{leaveSheetData.exitTimeStr} · {leaveSheetData.today}</p>
            </div>
          </div>
          <div className="bg-emerald-100 p-3 rounded-lg mb-4 text-center border border-emerald-300">
            <p className="text-xs text-slate-700 font-semibold">Expected Return</p>
            <p className="font-bold text-lg text-slate-900">{leaveSheetData.returnDate} at {leaveSheetData.returnTime}</p>
          </div>
          <Separator className="my-4 bg-slate-400" />
          <div className="bg-amber-100 p-3 rounded-lg mb-4 border border-amber-300">
            <p className="text-xs font-semibold text-amber-800">RECEIVING GUARDIAN</p>
            <p className="font-bold text-slate-900">{leaveSheetData.guardianName}</p>
            <p className="text-sm text-slate-700">{leaveSheetData.guardianRelation} · 📞 {leaveSheetData.guardianPhone}</p>
          </div>
          <p className="text-sm text-slate-700"><strong>Reason:</strong> {leaveSheetData.reason}</p>
          <div className="grid grid-cols-2 gap-6 mt-8 pt-4 border-t-2 border-slate-800">
            <div className="text-center"><p className="border-b-2 border-slate-800 pb-8"></p><p className="text-sm mt-1 font-semibold text-slate-900">Staff Signature</p></div>
            <div className="text-center"><p className="border-b-2 border-slate-800 pb-8"></p><p className="text-sm mt-1 font-semibold text-slate-900">Guardian Signature</p></div>
          </div>
          <p className="text-xs text-slate-500 text-center mt-6">EDU GATE · {new Date().toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 no-print">
      <div><h1 className="text-2xl font-bold text-slate-800">Apply Leave</h1><p className="text-slate-500">Student exit with guardian SMS</p></div>
      <Card>
        <CardHeader><CardTitle><DoorOpen className="h-5 w-5 inline mr-2 text-blue-600" />Leave Application</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submitLeave} className="space-y-6">
            <div className="relative">
              <Label>Search Student *</Label>
              <Input placeholder="Type name..." value={studentSearch} onChange={e => searchStudents(e.target.value)} />
              {studentSearch && students?.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {students.map((s: any) => (
                    <button key={s.id} type="button" className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 border-b" onClick={() => selectStudent(s)}>
                      <Avatar className="h-8 w-8"><AvatarImage src={s.profile_picture_url || ''} /><AvatarFallback>{s.first_name?.[0]}</AvatarFallback></Avatar>
                      <span className="text-sm">{s.first_name} {s.last_name} · {s.admission_number} · G{s.grade}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudent && <div className="bg-blue-50 p-3 rounded-lg mt-2 flex justify-between"><span className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</span><button type="button" onClick={() => setSelectedStudent(null)} className="text-red-500 text-xs">Change</button></div>}
            </div>

            {guardians.length > 0 && (
              <div>
                <Label><Shield className="h-3 w-3 inline mr-1" />Guardian *</Label>
                <Select value={selectedGuardian} onValueChange={setSelectedGuardian}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{guardians.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.full_name} ({g.relationship}) · 📞 {g.phone_number}</SelectItem>)}</SelectContent>
                </Select>
                {guardianData && <div className="bg-amber-50 p-3 rounded-lg mt-2 flex justify-between"><span>{guardianData.full_name}</span><span className="font-bold">📞 {guardianData.phone_number}</span></div>}
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-lg"><Label>System Times</Label><div className="grid grid-cols-2 gap-4 mt-2"><div><p className="text-xs text-slate-500">Issued At</p><p className="font-mono font-bold text-blue-600">{leaveTime}</p></div><div><p className="text-xs text-slate-500">Exit By</p><p className="font-mono font-bold text-amber-600">{exitTimeStr}</p></div></div></div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Return Date *</Label><Input type="date" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} min={today} required /></div>
              <div><Label>Return Time *</Label><Input type="time" value={expectedReturnTime} onChange={e => setExpectedReturnTime(e.target.value)} required /></div>
            </div>
            <div><Label>Reason *</Label><Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} required /></div>
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="mr-1 h-5 w-5" />Approve & Print Leave Sheet</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

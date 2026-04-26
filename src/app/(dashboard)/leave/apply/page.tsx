'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DoorOpen, Search, Loader2, Phone, Calendar, ArrowRight, Printer, Clock, User, Shield } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
  stream: string;
  house: string;
  profile_picture_url: string;
}

interface Guardian {
  id: string;
  full_name: string;
  relationship: string;
  phone_number: string;
  email: string;
  is_emergency_contact: boolean;
  is_primary: boolean;
}

export default function ApplyLeavePage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  // Student search
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentResults, setShowStudentResults] = useState(false);
  
  // Guardian
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState('');
  
  // Leave details
  const [reason, setReason] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [leaveId, setLeaveId] = useState<string | null>(null);

  // Auto-generated times
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const leaveTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const exitTime = new Date(now.getTime() + 10 * 60000);
  const exitTimeStr = `${String(exitTime.getHours()).padStart(2, '0')}:${String(exitTime.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    loadSchool();
  }, []);

  async function loadSchool() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (userData?.school_id) {
      setSchoolId(userData.school_id);
      const { data: school } = await supabase
        .from('schools')
        .select('name')
        .eq('id', userData.school_id)
        .single();
      if (school) setSchoolName(school.name);
    }
  }

  async function handleStudentSearch(query: string) {
    setStudentSearch(query);
    if (query.length < 2) {
      setStudents([]);
      return;
    }

    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade, stream, house, profile_picture_url')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`)
      .limit(20);

    if (data) setStudents(data);
  }

  function selectStudent(student: Student) {
    setSelectedStudent(student);
    setStudentSearch(`${student.first_name} ${student.last_name} (${student.admission_number})`);
    setShowStudentResults(false);
    loadGuardians(student.id);
  }

  async function loadGuardians(studentId: string) {
    const { data } = await supabase
      .from('guardians')
      .select('*')
      .eq('student_id', studentId)
      .order('is_primary', { ascending: false });

    if (data) {
      setGuardians(data);
      const primary = data.find(g => g.is_primary);
      if (primary) setSelectedGuardian(primary.id);
    }
  }

  function printLeaveSheet() {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
    }, 500);
  }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedStudent || !selectedGuardian || !reason || !expectedReturnDate || !expectedReturnTime) {
      toast.error('Please fill all fields including expected return date and time');
      return;
    }

    // Validate return is in the future
    const returnDateTime = new Date(`${expectedReturnDate}T${expectedReturnTime}:00`);
    if (returnDateTime <= now) {
      toast.error('Expected return must be in the future');
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.from('leave_requests').insert({
      student_id: selectedStudent.id,
      school_id: schoolId,
      guardian_id: selectedGuardian,
      reason,
      leave_start: new Date(`${today}T${leaveTime}:00`).toISOString(),
      expected_return: returnDateTime.toISOString(),
      status: 'approved',
      sms_sent_to_guardian: false,
    }).select('id').single();

    if (error) {
      toast.error('Failed to submit leave request');
    } else {
      setLeaveId(data.id);
      toast.success(`Leave approved! Return by ${expectedReturnDate} at ${expectedReturnTime}`);
      printLeaveSheet();
    }
    setIsLoading(false);
  }

  const selectedGuardianData = guardians.find(g => g.id === selectedGuardian);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Apply Leave</h1>
          <p className="text-slate-500 mt-1">Student exit management with guardian notification</p>
        </div>
        {selectedStudent && selectedGuardian && (
          <Button variant="outline" onClick={printLeaveSheet}>
            <Printer className="mr-2 h-4 w-4" /> Preview Leave Sheet
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-blue-600" /> Leave Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitLeave} className="space-y-6">
            {/* Student Search */}
            <div className="space-y-2 relative">
              <Label><Search className="h-3 w-3 inline mr-1" /> Search Student *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Type name or admission number..."
                  className="pl-10"
                  value={studentSearch}
                  onChange={(e) => {
                    handleStudentSearch(e.target.value);
                    setShowStudentResults(true);
                  }}
                  onFocus={() => setShowStudentResults(true)}
                />
              </div>

              {showStudentResults && studentSearch && !selectedStudent && students.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b last:border-b-0"
                      onClick={() => selectStudent(s)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={s.profile_picture_url || ''} />
                          <AvatarFallback className="text-xs">{s.first_name[0]}{s.last_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-slate-500">{s.admission_number} · Grade {s.grade}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedStudent && (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedStudent.profile_picture_url || ''} />
                      <AvatarFallback>{selectedStudent.first_name[0]}{selectedStudent.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                      <p className="text-xs text-slate-500">{selectedStudent.admission_number} · Grade {selectedStudent.grade}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); setGuardians([]); }} className="text-red-500 text-xs">Change</button>
                </div>
              )}
            </div>

            {/* Guardian Selector */}
            {guardians.length > 0 && (
              <div className="space-y-2">
                <Label><Shield className="h-3 w-3 inline mr-1" /> Guardian Receiving Student *</Label>
                <Select value={selectedGuardian} onValueChange={setSelectedGuardian}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select guardian" />
                  </SelectTrigger>
                  <SelectContent>
                    {guardians.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.full_name} ({g.relationship}) · 📞 {g.phone_number}
                        {g.is_primary && ' · Primary'}
                        {g.is_emergency_contact && ' · Emergency'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedGuardianData && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{selectedGuardianData.full_name}</p>
                      <p className="text-xs text-slate-500 capitalize">{selectedGuardianData.relationship}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-700">📞 {selectedGuardianData.phone_number}</p>
                      <p className="text-xs text-slate-400">SMS will be sent here</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Times */}
            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
              <Label className="text-sm font-semibold text-slate-600">System Generated Times</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500"><Clock className="h-3 w-3 inline mr-1" /> Leave Sheet Generated At</p>
                  <p className="font-mono font-bold text-blue-600">{leaveTime}</p>
                  <p className="text-xs text-slate-400">{today}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500"><DoorOpen className="h-3 w-3 inline mr-1" /> Exit Compound By (Max 10 mins)</p>
                  <p className="font-mono font-bold text-amber-600">{exitTimeStr}</p>
                  <p className="text-xs text-slate-400">{today}</p>
                </div>
              </div>
            </div>

            {/* Expected Return - Manual with Time Required */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-600">
                <Calendar className="h-3 w-3 inline mr-1" /> Expected Return *
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Return Date *</Label>
                  <Input 
                    type="date" 
                    value={expectedReturnDate} 
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    min={today}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Return Time *</Label>
                  <Input 
                    type="time" 
                    value={expectedReturnTime} 
                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                The system will check this time against actual return time to determine if student is late
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason for Leave *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Medical appointment, Family emergency..."
                rows={3}
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="mr-1 h-5 w-5" /> Approve Leave, Send SMS & Print Sheet</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Printable Leave Sheet */}
      {showPrint && selectedStudent && selectedGuardianData && (
        <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:p-8">
          <div className="max-w-lg mx-auto border-2 border-slate-300 rounded-lg p-6">
            <div className="text-center border-b-2 border-slate-300 pb-4 mb-4">
              <h1 className="text-xl font-bold">{schoolName || 'School'}</h1>
              <p className="text-sm text-slate-600">STUDENT EXIT PASS / LEAVE SHEET</p>
            </div>

            <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedStudent.profile_picture_url || ''} />
                <AvatarFallback className="text-xl">{selectedStudent.first_name[0]}{selectedStudent.last_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                <p className="text-sm text-slate-600">{selectedStudent.admission_number} · Grade {selectedStudent.grade}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 p-2 rounded text-center">
                <p className="text-xs text-slate-500">Issued At</p>
                <p className="font-bold">{leaveTime} · {today}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded text-center">
                <p className="text-xs text-slate-500">Exit By</p>
                <p className="font-bold">{exitTimeStr} · {today}</p>
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg mb-4 text-center">
              <p className="text-xs text-slate-500">Expected Return</p>
              <p className="font-bold text-lg">{expectedReturnDate} at {expectedReturnTime}</p>
            </div>

            <Separator className="my-4" />

            <div className="bg-amber-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-amber-700 font-semibold">RECEIVING GUARDIAN</p>
              <p className="font-bold">{selectedGuardianData.full_name}</p>
              <p className="text-sm capitalize">{selectedGuardianData.relationship} · 📞 {selectedGuardianData.phone_number}</p>
            </div>

            <p className="text-sm"><strong>Reason:</strong> {reason}</p>

            <div className="grid grid-cols-2 gap-6 mt-8 pt-4 border-t">
              <div className="text-center">
                <p className="border-b border-slate-400 pb-6"></p>
                <p className="text-sm mt-1">Teacher/Admin</p>
              </div>
              <div className="text-center">
                <p className="border-b border-slate-400 pb-6"></p>
                <p className="text-sm mt-1">Guardian</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center mt-6">EDU GATE · {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

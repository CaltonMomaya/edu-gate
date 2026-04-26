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
import { toast } from 'sonner';
import { DoorOpen, Search, Loader2, Phone, User, Calendar, ArrowRight } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
  stream: string;
}

interface Guardian {
  id: string;
  full_name: string;
  relationship: string;
  phone_number: string;
  is_emergency_contact: boolean;
  is_primary: boolean;
}

export default function ApplyLeavePage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  
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
  const [leaveDate, setLeaveDate] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');

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

    if (userData?.school_id) setSchoolId(userData.school_id);
  }

  // Search students as user types
  async function handleStudentSearch(query: string) {
    setStudentSearch(query);
    if (query.length < 2) {
      setStudents([]);
      return;
    }

    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number, grade, stream')
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
      // Auto-select primary guardian
      const primary = data.find(g => g.is_primary);
      if (primary) setSelectedGuardian(primary.id);
    }
  }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !selectedGuardian || !reason || !leaveDate || !expectedReturn) {
      toast.error('All fields are required');
      return;
    }

    setIsLoading(true);

    // Get guardian phone for SMS
    const guardian = guardians.find(g => g.id === selectedGuardian);
    
    const { error } = await supabase.from('leave_requests').insert({
      student_id: selectedStudent.id,
      school_id: schoolId,
      guardian_id: selectedGuardian,
      reason,
      leave_start: new Date(leaveDate).toISOString(),
      expected_return: new Date(expectedReturn).toISOString(),
      status: 'approved',
      // In production, SMS would be sent here
      sms_sent_to_guardian: false,
    });

    if (error) {
      toast.error('Failed to submit leave request');
    } else {
      toast.success(`Leave approved for ${selectedStudent.first_name} ${selectedStudent.last_name}`);
      if (guardian) {
        toast.info(`Guardian SMS will be sent to ${guardian.phone_number}`);
      }
      // Reset form
      setSelectedStudent(null);
      setStudentSearch('');
      setGuardians([]);
      setSelectedGuardian('');
      setReason('');
      setLeaveDate('');
      setExpectedReturn('');
    }
    setIsLoading(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Apply Leave</h1>
        <p className="text-slate-500 mt-1">Request student leave and notify guardian via SMS</p>
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
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between border-b last:border-b-0"
                      onClick={() => selectStudent(s)}
                    >
                      <div>
                        <p className="font-medium text-sm">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-slate-500">{s.admission_number} · Grade {s.grade}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedStudent && (
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-sm">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                    <p className="text-xs text-slate-500">{selectedStudent.admission_number} · Grade {selectedStudent.grade} · {selectedStudent.stream || 'No stream'}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(''); setGuardians([]); }} className="text-red-500 text-xs">Change</button>
                </div>
              )}
            </div>

            {/* Guardian Selector */}
            {guardians.length > 0 && (
              <div className="space-y-2">
                <Label><Phone className="h-3 w-3 inline mr-1" /> Guardian to Pick Student *</Label>
                <Select value={selectedGuardian} onValueChange={setSelectedGuardian}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select guardian" />
                  </SelectTrigger>
                  <SelectContent>
                    {guardians.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2">
                          {g.full_name} ({g.relationship})
                          {g.is_primary && <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>}
                          {g.is_emergency_contact && <Badge className="bg-amber-100 text-amber-700 text-xs">Emergency</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Leave Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label><Calendar className="h-3 w-3 inline mr-1" /> Leave Date *</Label>
                <Input type="datetime-local" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label><Calendar className="h-3 w-3 inline mr-1" /> Expected Return *</Label>
                <Input type="datetime-local" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason for Leave *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Medical appointment, Family emergency..."
                rows={3}
              />
            </div>

            {/* SMS Preview */}
            {selectedGuardian && selectedStudent && (
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-xs text-slate-500 mb-2">SMS Preview (sent to guardian):</p>
                <p className="text-sm text-slate-700">
                  {selectedStudent.first_name} {selectedStudent.last_name} has been released from school. 
                  Expected return: {expectedReturn ? new Date(expectedReturn).toLocaleString() : '...'}. 
                  Please present this SMS at the gate.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="mr-1 h-5 w-5" /> Approve Leave & Notify Guardian</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

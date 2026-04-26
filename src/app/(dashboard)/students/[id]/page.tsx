'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Calendar,
  Hash,
  GraduationCap,
  Shield,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface StudentProfile {
  id: string;
  admission_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  profile_picture_url: string;
  grade: string;
  stream: string;
  house: string;
  status: string;
  created_at: string;
}

interface GuardianInfo {
  id: string;
  full_name: string;
  relationship: string;
  phone_number: string;
  email: string;
  is_primary: boolean;
  is_emergency_contact: boolean;
}

interface FeeBalance {
  total_charged: number;
  total_paid: number;
  balance: number;
  academic_year: string;
}

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [guardians, setGuardians] = useState<GuardianInfo[]>([]);
  const [feeBalances, setFeeBalances] = useState<FeeBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [id]);

  async function loadStudent() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast.error('Student not found');
      router.push('/students');
      return;
    }

    setStudent(data);

    const { data: guardiansData } = await supabase
      .from('guardians')
      .select('*')
      .eq('student_id', id)
      .order('is_primary', { ascending: false });

    if (guardiansData) setGuardians(guardiansData);

    const { data: feeData } = await supabase
      .from('student_fee_balances')
      .select('*')
      .eq('student_id', id)
      .order('academic_year', { ascending: false });

    if (feeData) setFeeBalances(feeData);

    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!student) return null;

  const fullName = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/students" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={student.profile_picture_url || ''} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-xl">
                {student.first_name[0]}{student.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{student.admission_number}</Badge>
                <Badge className={student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                  {student.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/students/${student.id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-600">Transfer</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-blue-600" /> Personal Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-xs text-slate-500">First Name</p><p className="font-medium">{student.first_name}</p></div>
              <div><p className="text-xs text-slate-500">Middle Name</p><p className="font-medium">{student.middle_name || '-'}</p></div>
              <div><p className="text-xs text-slate-500">Last Name</p><p className="font-medium">{student.last_name}</p></div>
              <div><p className="text-xs text-slate-500"><Calendar className="h-3 w-3 inline mr-1" /> Date of Birth</p><p className="font-medium">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</p></div>
              <div><p className="text-xs text-slate-500">Gender</p><p className="font-medium capitalize">{student.gender || '-'}</p></div>
              <div><p className="text-xs text-slate-500"><Hash className="h-3 w-3 inline mr-1" /> Admission No.</p><p className="font-medium">{student.admission_number}</p></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-emerald-600" /> Academic Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-xs text-slate-500">Grade</p><Badge variant="outline" className="text-base">Grade {student.grade}</Badge></div>
              <div><p className="text-xs text-slate-500"><MapPin className="h-3 w-3 inline mr-1" /> Stream</p><p className="font-medium">{student.stream || '-'}</p></div>
              <div><p className="text-xs text-slate-500"><Home className="h-3 w-3 inline mr-1" /> House</p><p className="font-medium">{student.house || '-'}</p></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-amber-600" /> Guardian Contacts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {guardians.length === 0 ? (
                <p className="text-slate-500 text-sm">No guardians registered.</p>
              ) : (
                guardians.map((guardian) => (
                  <div key={guardian.id} className={`p-4 rounded-lg border ${guardian.is_emergency_contact ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{guardian.full_name}</h4>
                      <div className="flex gap-2">
                        {guardian.is_primary && <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>}
                        {guardian.is_emergency_contact && <Badge className="bg-amber-100 text-amber-700 text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Emergency</Badge>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-slate-500"><Phone className="h-3 w-3 inline mr-1" /> {guardian.phone_number}</p>
                      <p className="text-slate-500"><Mail className="h-3 w-3 inline mr-1" /> {guardian.email || 'No email'}</p>
                      <p className="text-slate-500 capitalize">Relationship: {guardian.relationship}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Fee Balances</CardTitle></CardHeader>
            <CardContent>
              {feeBalances.length === 0 ? (
                <p className="text-slate-500 text-sm">No fee records yet.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {feeBalances.map((fee) => (
                      <TableRow key={fee.academic_year}>
                        <TableCell>{fee.academic_year}</TableCell>
                        <TableCell>
                          <span className={fee.balance > 0 ? 'text-red-600 font-medium' : fee.balance < 0 ? 'text-emerald-600 font-medium' : 'text-slate-600'}>
                            KES {fee.balance.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/students/${student.id}/edit`}>
                <Button variant="outline" className="w-full justify-start" size="sm">✏️ Edit Details</Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" size="sm">💰 Record Payment</Button>
              <Button variant="outline" className="w-full justify-start" size="sm">⚠️ Record Offense</Button>
              <Button variant="outline" className="w-full justify-start" size="sm">🏠 Request Leave</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

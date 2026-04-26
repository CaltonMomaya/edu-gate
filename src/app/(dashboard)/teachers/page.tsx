'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, Shield, Loader2, Trash2 } from 'lucide-react';
import { ROLES } from '@/lib/auth/roles';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string;
  is_active: boolean;
}

export default function TeachersPage() {
  const supabase = createClient();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string>('');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tscNumber, setTscNumber] = useState('');
  const [role, setRole] = useState('teacher');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false });

    if (data) setStaff(data);
  }

  async function createStaffMember(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const password = tscNumber || 'TSC@2026';

      const response = await fetch('/api/auth/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          phone,
          schoolId,
          tscNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to create staff member');
        return;
      }

      toast.success(`${fullName} added successfully!`);
      setFullName('');
      setEmail('');
      setTscNumber('');
      setRole('teacher');
      setPhone('');
      loadStaff();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Teachers & Staff</h1>
        <p className="text-slate-500 mt-1">Manage your school staff and their roles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-blue-600" /> Add Staff Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createStaffMember} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Jane Muthoni" required />
              </div>
              <div className="space-y-2">
                <Label><Mail className="h-3 w-3 inline mr-1" /> Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@school.ac.ke" required />
              </div>
              <div className="space-y-2">
                <Label><Lock className="h-3 w-3 inline mr-1" /> TSC Number</Label>
                <Input value={tscNumber} onChange={(e) => setTscNumber(e.target.value)} placeholder="e.g., 123456" />
                <p className="text-xs text-slate-400">This will be the default login password</p>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 0712345678" />
              </div>
              <div className="space-y-2">
                <Label><Shield className="h-3 w-3 inline mr-1" /> Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : <><UserPlus className="mr-2 h-4 w-4" /> Add Staff</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader><CardTitle>Staff Directory</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">No staff members yet.</TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell className="text-slate-500">{member.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{member.role.replace('_', ' ')}</Badge></TableCell>
                      <TableCell><Badge className={member.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{member.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

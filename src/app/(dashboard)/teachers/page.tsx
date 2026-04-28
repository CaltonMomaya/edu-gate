'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logAction } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, Shield, Loader2, Edit, Ban, CheckCircle } from 'lucide-react';
import { ROLES } from '@/lib/auth/roles';

interface StaffMember {
  id: string; full_name: string; email: string; role: string; phone: string; is_active: boolean;
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
  const [editOpen, setEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);
    const { data } = await supabase.from('users').select('*').eq('school_id', userData.school_id).order('created_at', { ascending: false });
    if (data) setStaff(data);
  }

  async function createStaffMember(e: React.FormEvent) {
    e.preventDefault(); setIsLoading(true);
    try {
      const password = tscNumber || 'TSC@2026';
      const response = await fetch('/api/auth/create-staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role, phone, schoolId, tscNumber }),
      });
      const result = await response.json();
      if (!response.ok) { toast.error(result.message || 'Failed'); return; }
      toast.success(`${fullName} added!`);
      await logAction(schoolId, "staff_created", "staff", "", { name: fullName, role });
      setFullName(''); setEmail(''); setTscNumber(''); setRole('teacher'); setPhone('');
      loadStaff();
    } catch { toast.error('Something went wrong'); }
    finally { setIsLoading(false); }
  }

  function openEdit(staff: StaffMember) {
    setEditingStaff(staff);
    setEditName(staff.full_name); setEditEmail(staff.email); setEditRole(staff.role); setEditPhone(staff.phone || '');
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editingStaff) return;
    setIsLoading(true);
    const { error } = await supabase.from('users').update({
      full_name: editName, email: editEmail, role: editRole, phone: editPhone,
    }).eq('id', editingStaff.id);
    if (error) toast.error('Failed to update');
    else { toast.success('Staff updated!'); setEditOpen(false); loadStaff(); }
    setIsLoading(false);
  }

  async function toggleActive(staffMember: StaffMember) {
    const newStatus = !staffMember.is_active;
    if (!confirm(`${newStatus ? 'Reactivate' : 'Deactivate'} ${staffMember.full_name}?`)) return;
    const { error } = await supabase.from('users').update({ is_active: newStatus }).eq('id', staffMember.id);
    if (error) toast.error('Failed');
    else { toast.success(`${staffMember.full_name} ${newStatus ? 'reactivated' : 'deactivated'}!`); loadStaff(); }
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Teachers & Staff</h1><p className="text-slate-500">Manage staff accounts and roles</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserPlus className="h-5 w-5 text-blue-600" /> Add Staff</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createStaffMember} className="space-y-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
              <div className="space-y-2"><Label><Mail className="h-3 w-3 inline mr-1" /> Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="space-y-2"><Label><Lock className="h-3 w-3 inline mr-1" /> TSC Number</Label><Input value={tscNumber} onChange={e => setTscNumber(e.target.value)} /><p className="text-xs text-slate-400">Default login password</p></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label><Shield className="h-3 w-3 inline mr-1" /> Role *</Label>
                <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><UserPlus className="mr-2 h-4 w-4" /> Add Staff</>}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader><CardTitle>Staff Directory ({staff.length})</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>{staff.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">No staff yet.</TableCell></TableRow> :
                staff.map(m => (
                  <TableRow key={m.id} className={!m.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="text-slate-500">{m.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{m.role.replace('_', ' ')}</Badge></TableCell>
                    <TableCell><Badge className={m.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{m.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Edit className="h-4 w-4 text-blue-600" /></Button><Button variant="ghost" size="icon" onClick={() => toggleActive(m)}>{m.is_active ? <Ban className="h-4 w-4 text-red-600" /> : <CheckCircle className="h-4 w-4 text-emerald-600" />}</Button></div></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Staff</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editEmail} onChange={e => setEditEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Role</Label><Select value={editRole} onValueChange={setEditRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveEdit} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

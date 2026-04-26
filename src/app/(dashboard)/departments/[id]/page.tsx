'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Trash2, Loader2, Package } from 'lucide-react';

interface Equipment {
  id: string; ref_no: string; name: string; category: string; quantity: number; available: number;
}
interface IssuedItem {
  id: string; equipment_id: string; student_id: string; issued_date: string; due_date: string; return_date: string; status: string; fine_amount: number;
  department_equipment: { name: string; ref_no: string };
  students: { first_name: string; last_name: string; admission_number: string; grade: string; profile_picture_url: string };
}
interface Department {
  id: string; name: string;
}

export default function DepartmentInventoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [dept, setDept] = useState<Department | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [issued, setIssued] = useState<IssuedItem[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [tab, setTab] = useState<'inventory' | 'issued' | 'history'>('inventory');
  const [search, setSearch] = useState('');

  // Add
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [quantity, setQuantity] = useState('1');

  // Issue
  const [equipSearch, setEquipSearch] = useState('');
  const [selectedEquip, setSelectedEquip] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dueDate, setDueDate] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: deptData } = await supabase.from('departments').select('*').eq('id', id).single();
    if (deptData) setDept(deptData);
    else { router.push('/departments'); return; }

    const { data: eq } = await supabase.from('department_equipment').select('*').eq('school_id', userData.school_id).eq('department_id', id).order('name');
    if (eq) setEquipment(eq);

    const { data: iss } = await supabase.from('department_issued')
      .select('*, department_equipment(name, ref_no), students(first_name, last_name, admission_number, grade, profile_picture_url)')
      .eq('school_id', userData.school_id).eq('department_id', id).order('issued_date', { ascending: false }).limit(100);
    if (iss) setIssued(iss);
  }

  async function addEquipment(e: React.FormEvent) {
    e.preventDefault(); if (!name) return;
    const qty = parseInt(quantity) || 1;
    const prefix = dept?.name?.substring(0, 2).toUpperCase() || 'EQ';
    const refNo = prefix + '-' + new Date().getFullYear() + '-' + String(equipment.length + 1).padStart(4, '0');
    await supabase.from('department_equipment').insert({ school_id: schoolId, department_id: id, ref_no: refNo, name, category, quantity: qty, available: qty });
    toast.success(`${name} added`); setName(''); setQuantity('1'); loadData();
  }

  async function deleteEquipment(eqId: string) { await supabase.from('department_equipment').delete().eq('id', eqId); toast.success('Deleted'); loadData(); }

  async function searchStudents(query: string) {
    setStudentSearch(query);
    if (query.length < 2) { setStudents([]); return; }
    const { data } = await supabase.from('students').select('id, first_name, last_name, admission_number, grade, profile_picture_url').eq('school_id', schoolId).eq('status', 'active').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`).limit(10);
    if (data) setStudents(data);
  }

  async function issueEquipment(e: React.FormEvent) {
    e.preventDefault(); if (!selectedEquip || !selectedStudent || !dueDate) { toast.error('Fill all fields'); return; }
    const eq = equipment.find(eq => eq.id === selectedEquip);
    if (!eq || eq.available <= 0) { toast.error('Not available'); return; }
    const { error } = await supabase.from('department_issued').insert({ school_id: schoolId, department_id: id, equipment_id: selectedEquip, student_id: selectedStudent.id, due_date: dueDate });
    if (!error) { await supabase.from('department_equipment').update({ available: eq.available - 1 }).eq('id', selectedEquip); toast.success(`Issued to ${selectedStudent.first_name}`); setSelectedEquip(''); setSelectedStudent(null); setStudentSearch(''); setEquipSearch(''); setDueDate(''); loadData(); }
  }

  async function returnItem(issueId: string, equipId: string) {
    await supabase.from('department_issued').update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] }).eq('id', issueId);
    const eq = equipment.find(e => e.id === equipId);
    if (eq) await supabase.from('department_equipment').update({ available: eq.available + 1 }).eq('id', equipId);
    toast.success('Returned'); loadData();
  }

  async function markLost(issueId: string) { if (!confirm('Mark as lost?')) return; await supabase.from('department_issued').update({ status: 'lost', fine_amount: 500 }).eq('id', issueId); toast.error('Lost'); loadData(); }

  const filteredEquip = equipment.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  const filteredForIssue = equipment.filter(e => !equipSearch || e.name.toLowerCase().includes(equipSearch.toLowerCase()));
  const activeIssues = issued.filter(i => i.status === 'issued');

  if (!dept) return <div className="p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // Detect if this is a built-in department (Library, Finance, Discipline)
  const isClearanceDept = ['Library', 'Finance', 'Discipline'].includes(dept.name);
  const isInventoryDept = !isClearanceDept;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/departments" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{dept.name}</h1>
          <p className="text-slate-500">{equipment.length} items · {activeIssues.length} issued</p>
        </div>
      </div>

      {isInventoryDept && (
        <>
          <div className="flex gap-2">
            <Button variant={tab === 'inventory' ? 'default' : 'outline'} onClick={() => setTab('inventory')}><Package className="mr-2 h-4 w-4" /> Equipment</Button>
            <Button variant={tab === 'issued' ? 'default' : 'outline'} onClick={() => setTab('issued')}>📤 Issued ({activeIssues.length})</Button>
            <Button variant={tab === 'history' ? 'default' : 'outline'} onClick={() => setTab('history')}>📋 History</Button>
          </div>

          {tab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1"><CardHeader><CardTitle><Plus className="h-5 w-5 inline mr-2" />Add Item</CardTitle></CardHeader>
                <CardContent><form onSubmit={addEquipment} className="space-y-3">
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item name *" />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Equipment">Equipment</SelectItem><SelectItem value="Tool">Tool</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" placeholder="Qty" />
                  </div>
                  <Button type="submit" className="w-full">Add</Button>
                </form></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Search..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div></CardHeader>
                <CardContent><div className="space-y-2">{filteredEquip.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div><p className="font-medium">{e.name}</p><p className="text-xs text-slate-500">{e.ref_no} · {e.category}</p></div><div className="flex items-center gap-3"><Badge className={e.available > 0 ? 'bg-emerald-100' : 'bg-red-100'}>{e.available}/{e.quantity}</Badge><Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteEquipment(e.id)}><Trash2 className="h-4 w-4" /></Button></div></div>
                ))}</div></CardContent></Card>
            </div>
          )}

          {tab === 'issued' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1"><CardHeader><CardTitle>Issue Item</CardTitle></CardHeader>
                <CardContent><form onSubmit={issueEquipment} className="space-y-3">
                  <div className="space-y-1 relative"><Input placeholder="Search equipment..." value={equipSearch} onChange={e => setEquipSearch(e.target.value)} />
                    {equipSearch && <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-36 overflow-y-auto">{filteredForIssue.filter(e => e.available > 0).map(e => <button key={e.id} type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b" onClick={() => { setSelectedEquip(e.id); setEquipSearch(`${e.ref_no} - ${e.name}`); }}>{e.ref_no} - {e.name} <Badge className="ml-2 text-xs">{e.available}</Badge></button>)}</div>}
                  </div>
                  <div className="space-y-1 relative"><Input placeholder="Search student..." value={studentSearch} onChange={e => searchStudents(e.target.value)} />
                    {students.length > 0 && <div className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-36 overflow-y-auto">{students.map(s => <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex items-center gap-2" onClick={() => { setSelectedStudent(s); setStudentSearch(`${s.first_name} ${s.last_name}`); }}><Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{s.first_name[0]}{s.last_name[0]}</AvatarFallback></Avatar>{s.first_name} {s.last_name} · G{s.grade}</button>)}</div>}
                  </div>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  <Button type="submit" className="w-full">Issue</Button>
                </form></CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>Active Issues</CardTitle></CardHeader>
                <CardContent><div className="space-y-2">{activeIssues.map(i => (
                  <div key={i.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div><p className="font-medium">{i.department_equipment?.name}</p><p className="text-xs text-slate-500">{i.students?.first_name} {i.students?.last_name} · Due: {i.due_date}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => returnItem(i.id, i.equipment_id)}>Return</Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => markLost(i.id)}>Lost</Button></div></div>
                ))}</div></CardContent></Card>
            </div>
          )}

          {tab === 'history' && (
            <Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent><div className="space-y-2">{issued.map(i => (
              <div key={i.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div><p className="font-medium">{i.department_equipment?.name}</p><p className="text-xs text-slate-500">{i.students?.first_name} {i.students?.last_name}</p></div><Badge className={i.status === 'returned' ? 'bg-emerald-100' : 'bg-red-100'}>{i.status}</Badge></div>
            ))}</div></CardContent></Card>
          )}
        </>
      )}

      {isClearanceDept && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">{dept.name} is a clearance department.</p>
            <p className="text-slate-400 text-sm mt-1">Use the {dept.name === 'Library' ? 'Library' : dept.name === 'Finance' ? 'Finance' : 'Discipline'} module for detailed management.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

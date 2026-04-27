import { logAction } from "@/lib/audit";
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Building2, ArrowRight, Eye, BookOpen, DollarSign, Scale, Wrench } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  clearance_order: number;
  assigned_officer: string;
  is_active: boolean;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

export default function DepartmentsPage() {
  const supabase = createClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: depts } = await supabase.from('departments').select('*').eq('school_id', userData.school_id).order('clearance_order');
    if (depts) setDepartments(depts);

    const { data: staffData } = await supabase.from('users').select('id, full_name, role').eq('school_id', userData.school_id);
    if (staffData) setStaff(staffData);
  }

  async function addDepartment() {
    if (!newDeptName.trim()) return;
    setIsLoading(true);
    const maxOrder = departments.reduce((max, d) => Math.max(max, d.clearance_order || 0), 0);
    const { error } = await supabase.from('departments').insert({ school_id: schoolId, name: newDeptName.trim(), clearance_order: maxOrder + 1 });
    await logAction(schoolId, "department_added", "department", "", { name: newDeptName });
    if (error) toast.error('Failed'); else { toast.success(`${newDeptName} added`); setNewDeptName(''); loadData(); }
    setIsLoading(false);
  }

  async function deleteDepartment(id: string) {
    await supabase.from('departments').delete().eq('id', id);
    toast.success('Deleted'); loadData();
  }

  async function assignOfficer(deptId: string, officerId: string) {
    await supabase.from('departments').update({ assigned_officer: officerId === 'none' ? null : officerId }).eq('id', deptId);
    toast.success('Officer assigned'); loadData();
  }

  async function moveOrder(deptId: string, direction: 'up' | 'down') {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;
    const swapDept = direction === 'up' ? departments.filter(d => d.clearance_order < dept.clearance_order).pop() : departments.filter(d => d.clearance_order > dept.clearance_order)[0];
    if (!swapDept) return;
    await supabase.from('departments').update({ clearance_order: dept.clearance_order }).eq('id', swapDept.id);
    await supabase.from('departments').update({ clearance_order: swapDept.clearance_order }).eq('id', dept.id);
    loadData();
  }

  function getDeptIcon(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('library') || lower.includes('librar')) return <BookOpen className="h-8 w-8 text-blue-600" />;
    if (lower.includes('finance') || lower.includes('bursar') || lower.includes('account')) return <DollarSign className="h-8 w-8 text-emerald-600" />;
    if (lower.includes('discipline') || lower.includes('disciplin')) return <Scale className="h-8 w-8 text-red-600" />;
    if (lower.includes('game') || lower.includes('sport')) return <Wrench className="h-8 w-8 text-orange-600" />;
    if (lower.includes('music') || lower.includes('drama')) return <Wrench className="h-8 w-8 text-purple-600" />;
    if (lower.includes('lab') || lower.includes('science')) return <Wrench className="h-8 w-8 text-teal-600" />;
    return <Building2 className="h-8 w-8 text-slate-600" />;
  }

  function getDeptColor(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('library')) return 'border-blue-200 bg-blue-50 hover:border-blue-300';
    if (lower.includes('finance')) return 'border-emerald-200 bg-emerald-50 hover:border-emerald-300';
    if (lower.includes('discipline')) return 'border-red-200 bg-red-50 hover:border-red-300';
    if (lower.includes('game') || lower.includes('sport')) return 'border-orange-200 bg-orange-50 hover:border-orange-300';
    if (lower.includes('music') || lower.includes('drama')) return 'border-purple-200 bg-purple-50 hover:border-purple-300';
    if (lower.includes('lab') || lower.includes('science')) return 'border-teal-200 bg-teal-50 hover:border-teal-300';
    return 'border-slate-200 bg-slate-50 hover:border-slate-300';
  }

  const isCustomDept = (name: string) => !['Library', 'Finance', 'Discipline'].includes(name);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
          <p className="text-slate-500 mt-1">{departments.length} departments · Click a department to manage inventory</p>
        </div>
      </div>

      {/* Add Department */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input placeholder="New department name (e.g., Home Science, Swimming)..." value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDepartment()} />
            <Button onClick={addDepartment} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, index) => (
          <Card key={dept.id} className={`border-2 shadow-sm transition-all cursor-pointer ${getDeptColor(dept.name)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDeptIcon(dept.name)}
                  <div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <CardDescription>Step {index + 1} in clearance</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={(e) => { e.stopPropagation(); moveOrder(dept.id, 'up'); }} disabled={index === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs">▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveOrder(dept.id, 'down'); }} disabled={index === departments.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs">▼</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Select value={dept.assigned_officer || 'none'} onValueChange={(v) => assignOfficer(dept.id, v)}>
                  <SelectTrigger className="w-40 text-xs" onClick={(e) => e.stopPropagation()}>
                    <SelectValue placeholder="Assign officer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No officer</SelectItem>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  {/* View/Manage Button */}
                  <Link href={`/departments/${dept.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      {isCustomDept(dept.name) ? 'Manage' : 'View'}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={(e) => { e.stopPropagation(); deleteDepartment(dept.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {departments.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No departments yet. Add your first department above.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Click <strong>Manage</strong> on any department to track equipment & inventory for clearance.
      </p>
    </div>
  );
}

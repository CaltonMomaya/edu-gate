'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { logAction } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Building2, Eye, BookOpen, DollarSign, Scale, Wrench } from 'lucide-react';

interface Department {
  id: string; name: string; clearance_order: number; assigned_officer: string; is_active: boolean;
}
interface StaffMember {
  id: string; full_name: string; role: string;
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
    if (!newDeptName.trim()) { toast.error('Enter a department name'); return; }
    setIsLoading(true);
    const maxOrder = departments.reduce((max, d) => Math.max(max, d.clearance_order || 0), 0);
    const { error } = await supabase.from('departments').insert({
      school_id: schoolId, name: newDeptName.trim(), clearance_order: maxOrder + 1,
    });
    if (error) {
      toast.error('Failed to add department');
    } else {
      toast.success(`${newDeptName} added!`);
      await logAction(schoolId, "department_added", "department", "", { name: newDeptName });
      setNewDeptName('');
      loadData();
    }
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

  function getDeptColor(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('library')) return 'border-blue-200 bg-blue-50 hover:border-blue-300';
    if (lower.includes('finance')) return 'border-emerald-200 bg-emerald-50 hover:border-emerald-300';
    if (lower.includes('discipline')) return 'border-red-200 bg-red-50 hover:border-red-300';
    if (lower.includes('game') || lower.includes('sport')) return 'border-orange-200 bg-orange-50 hover:border-orange-300';
    if (lower.includes('music') || lower.includes('drama')) return 'border-purple-200 bg-purple-50 hover:border-purple-300';
    return 'border-slate-200 bg-slate-50 hover:border-slate-300';
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Departments</h1><p className="text-slate-500">{departments.length} departments · Click Manage to access inventory</p></div>

      {/* Add Department */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input
              placeholder="New department name (e.g., Home Science, Swimming)..."
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
            />
            <Button onClick={addDepartment} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, index) => (
          <Card key={dept.id} className={`border-2 shadow-sm ${getDeptColor(dept.name)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{dept.name}</h3>
                  <p className="text-xs text-slate-500">Step {index + 1} in clearance</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); moveOrder(dept.id, 'up'); }} disabled={index === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs">▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveOrder(dept.id, 'down'); }} disabled={index === departments.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 text-xs">▼</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Select value={dept.assigned_officer || 'none'} onValueChange={(v) => assignOfficer(dept.id, v)}>
                  <SelectTrigger className="w-40 text-xs"><SelectValue placeholder="Assign officer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No officer</SelectItem>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Link href={`/departments/${dept.id}`}>
                    <Button variant="outline" size="sm"><Eye className="h-3 w-3 mr-1" />Manage</Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDepartment(dept.id)}><Trash2 className="h-4 w-4" /></Button>
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
    </div>
  );
}

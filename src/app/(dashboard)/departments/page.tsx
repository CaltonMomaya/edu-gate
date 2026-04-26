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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Loader2, Building2 } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data: depts } = await supabase
      .from('departments')
      .select('*')
      .eq('school_id', userData.school_id)
      .order('clearance_order');
    if (depts) setDepartments(depts);

    const { data: staffData } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('school_id', userData.school_id);
    if (staffData) setStaff(staffData);
  }

  async function addDepartment() {
    if (!newDeptName.trim()) return;
    setIsLoading(true);

    const maxOrder = departments.reduce((max, d) => Math.max(max, d.clearance_order || 0), 0);

    const { error } = await supabase.from('departments').insert({
      school_id: schoolId,
      name: newDeptName.trim(),
      clearance_order: maxOrder + 1,
    });

    if (error) {
      toast.error('Failed to add department');
    } else {
      toast.success(`${newDeptName} added`);
      setNewDeptName('');
      loadData();
    }
    setIsLoading(false);
  }

  async function deleteDepartment(id: string) {
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Department deleted');
      loadData();
    }
  }

  async function assignOfficer(deptId: string, officerId: string) {
    const { error } = await supabase
      .from('departments')
      .update({ assigned_officer: officerId === 'none' ? null : officerId })
      .eq('id', deptId);

    if (error) {
      toast.error('Failed to assign officer');
    } else {
      toast.success('Officer assigned');
      loadData();
    }
  }

  async function moveOrder(deptId: string, direction: 'up' | 'down') {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;

    const swapDept = direction === 'up'
      ? departments.filter(d => d.clearance_order < dept.clearance_order).pop()
      : departments.filter(d => d.clearance_order > dept.clearance_order)[0];

    if (!swapDept) return;

    await supabase.from('departments').update({ clearance_order: dept.clearance_order }).eq('id', swapDept.id);
    await supabase.from('departments').update({ clearance_order: swapDept.clearance_order }).eq('id', dept.id);
    loadData();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
        <p className="text-slate-500 mt-1">Manage clearance departments and assign officers</p>
      </div>

      {/* Add Department */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" /> Add Department
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Department name (e.g., Games & Sports, Music)"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
            />
            <Button onClick={addDepartment} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Department List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" /> Clearance Route Order
          </CardTitle>
          <p className="text-sm text-slate-500">This order determines the clearance sequence for Grade 12 students</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {departments.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No departments created yet.</p>
          ) : (
            departments.map((dept, index) => (
              <div key={dept.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white h-7 w-7 rounded-full flex items-center justify-center p-0">
                    {index + 1}
                  </Badge>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveOrder(dept.id, 'up')}
                      disabled={index === 0}
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveOrder(dept.id, 'down')}
                      disabled={index === departments.length - 1}
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="font-medium">{dept.name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={dept.assigned_officer || 'none'}
                    onValueChange={(v) => assignOfficer(dept.id, v)}
                  >
                    <SelectTrigger className="w-48 text-xs">
                      <SelectValue placeholder="Assign officer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No officer</SelectItem>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name} ({s.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDepartment(dept.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 text-center">
        Example order: Library → Games → Music → Lab → Finance → Discipline
      </p>
    </div>
  );
}

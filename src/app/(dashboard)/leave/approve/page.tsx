'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface LeaveRequest {
  id: string;
  reason: string;
  leave_start: string;
  expected_return: string;
  actual_return: string;
  status: string;
  is_late: boolean;
  students: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  guardians: {
    full_name: string;
    phone_number: string;
  };
}

export default function ApproveLeavePage() {
  const supabase = createClient();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    loadLeaves();
  }, []);

  async function loadLeaves() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!userData?.school_id) return;

    const { data } = await supabase
      .from('leave_requests')
      .select('*, students(first_name, last_name, admission_number), guardians(full_name, phone_number)')
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setLeaves(data);
  }

  async function markReturn(id: string) {
    const now = new Date().toISOString();
    
    // Check if late
    const leave = leaves.find(l => l.id === id);
    const isLate = leave ? new Date() > new Date(leave.expected_return) : false;

    const { error } = await supabase
      .from('leave_requests')
      .update({
        actual_return: now,
        status: 'completed',
        is_late: isLate,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(isLate ? 'Student returned LATE' : 'Student returned on time');
      loadLeaves();
    }
  }

  const statusBadge = (status: string, isLate: boolean) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'completed': return <Badge className={isLate ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
        {isLate ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
        {isLate ? 'Late Return' : 'Completed'}
      </Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Approve Leave & Returns</h1>
        <p className="text-slate-500 mt-1">Track student leave and mark returns</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Leave Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Left</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">No leave records</TableCell>
                </TableRow>
              ) : (
                leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.students?.first_name} {l.students?.last_name}</TableCell>
                    <TableCell className="text-slate-500">{l.guardians?.full_name}</TableCell>
                    <TableCell className="text-slate-500">{new Date(l.leave_start).toLocaleDateString()}</TableCell>
                    <TableCell className="text-slate-500">{new Date(l.expected_return).toLocaleDateString()}</TableCell>
                    <TableCell>{statusBadge(l.status, l.is_late)}</TableCell>
                    <TableCell>
                      {l.status === 'approved' && (
                        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => markReturn(l.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Mark Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

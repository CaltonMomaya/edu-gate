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
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

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
    const now = new Date();
    const leave = leaves.find(l => l.id === id);
    
    if (!leave) return;

    const expectedReturn = new Date(leave.expected_return);
    const isLate = now > expectedReturn;

    const { error } = await supabase
      .from('leave_requests')
      .update({
        actual_return: now.toISOString(),
        status: 'completed',
        is_late: isLate,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      if (isLate) {
        toast.error(`⚠️ LATE RETURN! Expected: ${expectedReturn.toLocaleString()}`);
      } else {
        toast.success(`✅ On time! Student returned before deadline`);
      }
      loadLeaves();
    }
  }

  function getTimeStatus(leave: LeaveRequest) {
    if (leave.status === 'completed') {
      if (leave.is_late) {
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" /> Late</Badge>;
      }
      return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" /> On Time</Badge>;
    }
    if (leave.status === 'approved') {
      const expected = new Date(leave.expected_return);
      const now = new Date();
      if (now > expected) {
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>;
      }
      return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" /> Out</Badge>;
    }
    return <Badge>{leave.status}</Badge>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Track Returns</h1>
        <p className="text-slate-500 mt-1">Mark student returns and check if they returned on time</p>
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
                <TableHead>Expected Return</TableHead>
                <TableHead>Actual Return</TableHead>
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
                    <TableCell className="text-slate-500">
                      {new Date(l.expected_return).toLocaleDateString()} {new Date(l.expected_return).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {l.actual_return 
                        ? `${new Date(l.actual_return).toLocaleDateString()} ${new Date(l.actual_return).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
                        : '-'}
                    </TableCell>
                    <TableCell>{getTimeStatus(l)}</TableCell>
                    <TableCell>
                      {l.status === 'approved' && (
                        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => markReturn(l.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Mark Returned
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

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, History, Filter, Download } from 'lucide-react';

const PAGE_SIZE = 20;

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  users: { full_name: string; role: string } | null;
}

export default function AuditLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => { loadLogs(); }, [page, actionFilter, entityFilter]);

  async function loadLogs() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    let query = supabase.from('audit_logs').select('*, users(full_name, role)', { count: 'exact' }).eq('school_id', userData.school_id);
    if (actionFilter !== 'all') query = query.eq('action', actionFilter);
    if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (data) setLogs(data);
    if (count !== null) setTotal(count);
    setIsLoading(false);
  }

  function getActionBadge(action: string) {
    if (action.includes('registered')) return <Badge className="bg-blue-100 text-blue-700">Registered</Badge>;
    if (action.includes('transferred')) return <Badge className="bg-orange-100 text-orange-700">Transferred</Badge>;
    if (action.includes('payment') || action.includes('fee')) return <Badge className="bg-emerald-100 text-emerald-700">Payment</Badge>;
    if (action.includes('offense') || action.includes('discipline')) return <Badge className="bg-red-100 text-red-700">Discipline</Badge>;
    if (action.includes('leave')) return <Badge className="bg-amber-100 text-amber-700">Leave</Badge>;
    if (action.includes('clearance')) return <Badge className="bg-purple-100 text-purple-700">Clearance</Badge>;
    if (action.includes('promotion')) return <Badge className="bg-indigo-100 text-indigo-700">Promotion</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  }

  function getEntityLabel(type: string) {
    switch (type) {
      case 'student': return '👤';
      case 'payment': return '💰';
      case 'clearance': return '✅';
      case 'offense': return '⚠️';
      case 'leave': return '🏠';
      default: return '📝';
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-slate-500">{total} total records · Track all system activity</p>
        </div>
        <Button variant="outline" onClick={() => {
          const csv = logs.map(l => `${l.created_at},${l.users?.full_name},${l.action},${l.entity_type}`).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'audit-logs.csv'; a.click();
        }}><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search logs..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="school_registered">Registration</SelectItem>
                <SelectItem value="student_transferred">Transfer</SelectItem>
                <SelectItem value="student_registered">Student Added</SelectItem>
                <SelectItem value="payment_recorded">Payment</SelectItem>
                <SelectItem value="offense_recorded">Offense</SelectItem>
                <SelectItem value="leave_approved">Leave</SelectItem>
                <SelectItem value="clearance_cleared">Clearance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="clearance">Clearance</SelectItem>
                <SelectItem value="offense">Offense</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500"><History className="h-12 w-12 mx-auto mb-2 text-slate-300" />No audit logs yet.</TableCell></TableRow>
              ) : (
                logs.filter(l => 
                  (l.users?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                  l.action.toLowerCase().includes(search.toLowerCase())
                ).map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{log.users?.full_name || 'System'}</p>
                      <p className="text-xs text-slate-400">{log.users?.role || 'auto'}</p>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell><span className="text-lg">{getEntityLabel(log.entity_type)}</span></TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {log.new_data ? JSON.stringify(log.new_data).substring(0, 80) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} records</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

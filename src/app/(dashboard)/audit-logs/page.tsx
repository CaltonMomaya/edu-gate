'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Loader2, History, User, FileText, DollarSign, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const PAGE_SIZE = 20;

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  new_data: any;
  created_at: string;
  user_id: string;
  users?: { full_name: string; role: string };
}

export default function AuditLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadLogs(); }, [page, actionFilter]);

  async function loadLogs() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsLoading(false); return; }

    let query = supabase
      .from('audit_logs')
      .select('*, users(full_name, role)', { count: 'exact' })
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false });

    if (actionFilter !== 'all') query = query.eq('action', actionFilter);

    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query.range(from, from + PAGE_SIZE - 1);

    if (data) setLogs(data);
    if (count !== null) setTotal(count);
    setIsLoading(false);
  }

  function getActionIcon(action: string) {
    if (action.includes('student')) return <User className="h-4 w-4 text-blue-600" />;
    if (action.includes('payment') || action.includes('fee')) return <DollarSign className="h-4 w-4 text-emerald-600" />;
    if (action.includes('offense') || action.includes('discipline')) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4 text-slate-600" />;
  }

  function getActionBadge(action: string) {
    if (action.includes('registered') || action.includes('created')) return <Badge className="bg-blue-100 text-blue-700">Created</Badge>;
    if (action.includes('updated') || action.includes('edited')) return <Badge className="bg-amber-100 text-amber-700">Updated</Badge>;
    if (action.includes('deleted') || action.includes('removed')) return <Badge className="bg-red-100 text-red-700">Deleted</Badge>;
    if (action.includes('transferred')) return <Badge className="bg-orange-100 text-orange-700">Transferred</Badge>;
    if (action.includes('promoted')) return <Badge className="bg-purple-100 text-purple-700">Promoted</Badge>;
    if (action.includes('cleared')) return <Badge className="bg-emerald-100 text-emerald-700">Cleared</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  }

  function exportLogs() {
    const headers = ['Date', 'User', 'Action', 'Type', 'Details'];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.users?.full_name || 'System',
      l.action,
      l.entity_type,
      JSON.stringify(l.new_data).substring(0, 100),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported!');
  }

  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.action.toLowerCase().includes(q) || 
           l.entity_type?.toLowerCase().includes(q) ||
           l.users?.full_name?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const actions = ['all', 'student_registered', 'school_registered', 'student_transferred', 'payment_recorded', 'offense_recorded'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1><p className="text-slate-500">{total} total activities tracked</p></div>
        <Button variant="outline" onClick={exportLogs}><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Search logs..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.filter(a => a !== 'all').map(a => <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500"><History className="h-12 w-12 mx-auto mb-2 text-slate-300" />No audit logs found.</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                  <div className="mt-1">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm capitalize">{log.action.replace(/_/g, ' ')}</span>
                      {getActionBadge(log.action)}
                      <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                    </div>
                    {log.new_data && (
                      <p className="text-xs text-slate-500 truncate">{JSON.stringify(log.new_data).substring(0, 100)}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400 flex-shrink-0">
                    <p>{log.users?.full_name || 'System'}</p>
                    <p>{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

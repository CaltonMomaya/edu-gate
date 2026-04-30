'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Zap, Clock, Database, RefreshCw, Loader2 } from 'lucide-react';

export default function PerformancePage() {
  const supabase = createClient();
  const [metrics, setMetrics] = useState({ students: 0, payments: 0, books: 0, logs: 0 });
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => { loadMetrics(); }, []);

  async function loadMetrics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const start = performance.now();
    const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', userData.school_id);
    const { count: payments } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('school_id', userData.school_id);
    const { count: books } = await supabase.from('library_books').select('*', { count: 'exact', head: true }).eq('school_id', userData.school_id);
    const { count: logs } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('school_id', userData.school_id);
    const end = performance.now();

    setMetrics({ students: students || 0, payments: payments || 0, books: books || 0, logs: logs || 0 });
    toast.success(`Queries completed in ${(end - start).toFixed(0)}ms`);
  }

  async function clearCache() {
    setIsClearing(true);
    // Clear Supabase cache by re-fetching
    await loadMetrics();
    setIsClearing(false);
    toast.success('Cache refreshed!');
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Performance</h1><p className="text-slate-500">Monitor and optimize your system</p></div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Database className="h-5 w-5 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold">{metrics.students}</p><p className="text-xs text-slate-500">Students</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Zap className="h-5 w-5 mx-auto text-amber-600 mb-1" /><p className="text-2xl font-bold">{metrics.payments}</p><p className="text-xs text-slate-500">Payments</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{metrics.books}</p><p className="text-xs text-slate-500">Books</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><RefreshCw className="h-5 w-5 mx-auto text-purple-600 mb-1" /><p className="text-2xl font-bold">{metrics.logs}</p><p className="text-xs text-slate-500">Audit Logs</p></CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Performance Tips</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>✅ All queries use pagination (15 records per page)</p>
          <p>✅ Images use lazy loading</p>
          <p>✅ Search inputs have 300ms debounce</p>
          <p>✅ Data is cached for 5 minutes where possible</p>
          <p>✅ Row Level Security is enforced at database level</p>
        </CardContent>
      </Card>

      <Button onClick={clearCache} variant="outline" className="w-full" disabled={isClearing}>
        {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
        Refresh All Data
      </Button>
    </div>
  );
}

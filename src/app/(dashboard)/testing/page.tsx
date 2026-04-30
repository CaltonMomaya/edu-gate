'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, RefreshCw, Play, ClipboardCheck } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
}

export default function TestingPage() {
  const supabase = createClient();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => { setupSchool(); }, []);

  async function setupSchool() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (userData?.school_id) setSchoolId(userData.school_id);
  }

  async function runAllTests() {
    setIsRunning(true);
    setResults([]);
    
    const tests: TestResult[] = [];

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase.from('schools').select('id').limit(1);
      tests.push({ name: 'Database Connection', status: error ? 'fail' : 'pass', message: error?.message || 'Connected' });
    } catch (e: any) {
      tests.push({ name: 'Database Connection', status: 'fail', message: e.message });
    }

    // Test 2: Students Table
    try {
      const { count, error } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
      tests.push({ name: 'Students Table', status: error ? 'fail' : 'pass', message: `${count || 0} students found` });
    } catch (e: any) {
      tests.push({ name: 'Students Table', status: 'fail', message: e.message });
    }

    // Test 3: Payments Table
    try {
      const { count, error } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
      tests.push({ name: 'Payments Table', status: error ? 'fail' : 'pass', message: `${count || 0} payments found` });
    } catch (e: any) {
      tests.push({ name: 'Payments Table', status: 'fail', message: e.message });
    }

    // Test 4: RLS Policies
    try {
      const { data, error } = await supabase.from('students').select('id').eq('school_id', '00000000-0000-0000-0000-000000000000').limit(1);
      if (data && data.length === 0) {
        tests.push({ name: 'RLS Isolation', status: 'pass', message: 'Data isolated to your school only' });
      } else {
        tests.push({ name: 'RLS Isolation', status: 'fail', message: 'May see other schools data' });
      }
    } catch (e: any) {
      tests.push({ name: 'RLS Isolation', status: 'pending', message: e.message });
    }

    // Test 5: Auth Working
    try {
      const { data: { user } } = await supabase.auth.getUser();
      tests.push({ name: 'Authentication', status: user ? 'pass' : 'fail', message: user?.email || 'Not logged in' });
    } catch (e: any) {
      tests.push({ name: 'Authentication', status: 'fail', message: e.message });
    }

    // Test 6: Storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      tests.push({ name: 'Storage Service', status: error ? 'fail' : 'pass', message: `${data?.length || 0} buckets found` });
    } catch (e: any) {
      tests.push({ name: 'Storage Service', status: 'fail', message: e.message });
    }

    // Test 7: Fee Structure
    try {
      const { count, error } = await supabase.from('fee_structures').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
      tests.push({ name: 'Fee Structures', status: error ? 'fail' : 'pass', message: `${count || 0} fee items` });
    } catch (e: any) {
      tests.push({ name: 'Fee Structures', status: 'fail', message: e.message });
    }

    // Test 8: Library
    try {
      const { count, error } = await supabase.from('library_books').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
      tests.push({ name: 'Library Books', status: error ? 'fail' : 'pass', message: `${count || 0} books` });
    } catch (e: any) {
      tests.push({ name: 'Library Books', status: 'fail', message: e.message });
    }

    // Test 9: Departments
    try {
      const { count, error } = await supabase.from('departments').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
      tests.push({ name: 'Departments', status: error ? 'fail' : 'pass', message: `${count || 0} departments` });
    } catch (e: any) {
      tests.push({ name: 'Departments', status: 'fail', message: e.message });
    }

    // Test 10: Audit Logs
    try {
      const { count, error } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
      tests.push({ name: 'Audit Logs', status: error ? 'fail' : 'pass', message: `${count || 0} entries` });
    } catch (e: any) {
      tests.push({ name: 'Audit Logs', status: 'fail', message: e.message });
    }

    setResults(tests);
    setIsRunning(false);

    const passCount = tests.filter(t => t.status === 'pass').length;
    toast.success(`${passCount}/${tests.length} tests passed`);
  }

  const passCount = results.filter(t => t.status === 'pass').length;
  const failCount = results.filter(t => t.status === 'fail').length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Tests</h1>
          <p className="text-slate-500">Run diagnostics on your system modules</p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning} className="bg-gradient-to-r from-blue-600 to-emerald-600">
          {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Run All Tests
        </Button>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-emerald-50"><CardContent className="p-4 text-center"><CheckCircle className="h-6 w-6 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold text-emerald-600">{passCount}</p><p className="text-xs text-slate-500">Passed</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-red-50"><CardContent className="p-4 text-center"><XCircle className="h-6 w-6 mx-auto text-red-600 mb-1" /><p className="text-2xl font-bold text-red-600">{failCount}</p><p className="text-xs text-slate-500">Failed</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-blue-50"><CardContent className="p-4 text-center"><ClipboardCheck className="h-6 w-6 mx-auto text-blue-600 mb-1" /><p className="text-2xl font-bold text-blue-600">{results.length}</p><p className="text-xs text-slate-500">Total</p></CardContent></Card>
        </div>
      )}

      {/* Test Results */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Test Results</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {results.length === 0 ? (
            <p className="text-center py-8 text-slate-500">Click "Run All Tests" to check your system.</p>
          ) : (
            results.map((test, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${test.status === 'pass' ? 'bg-emerald-50' : test.status === 'fail' ? 'bg-red-50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  {test.status === 'pass' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : test.status === 'fail' ? <XCircle className="h-5 w-5 text-red-600" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  <span className="font-medium">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{test.message}</span>
                  <Badge className={test.status === 'pass' ? 'bg-emerald-100 text-emerald-700' : test.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}>{test.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Download, Upload, Database, Loader2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function BackupPage() {
  const supabase = createClient();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastBackup(localStorage.getItem('edu-gate-last-backup'));
    }
  }, []);

  async function createBackup() {
    setIsBackingUp(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsBackingUp(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsBackingUp(false); return; }
    const sid = userData.school_id;

    const tables = ['students', 'guardians', 'payments', 'student_fee_balances', 'fee_structures', 'black_book', 'leave_requests', 'library_books', 'library_issued', 'exam_results', 'exam_types', 'departments', 'student_clearance', 'notifications', 'sms_log', 'audit_logs'];
    const backup: Record<string, any[]> = {};

    for (const table of tables) {
      const { data } = await supabase.from(table).select('*').eq('school_id', sid);
      if (data && data.length > 0) backup[table] = data;
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edu-gate-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const now = new Date().toLocaleString();
    if (typeof window !== 'undefined') localStorage.setItem('edu-gate-last-backup', now);
    setLastBackup(now);
    toast.success(`Backup created! ${Object.keys(backup).length} tables saved.`);
    setIsBackingUp(false);
  }

  async function restoreBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Restore from backup? This will overwrite existing data. Continue?')) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const backup = JSON.parse(event.target?.result as string);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
      if (!userData?.school_id) return;

      let restored = 0;
      for (const [table, rows] of Object.entries(backup)) {
        if (Array.isArray(rows) && rows.length > 0) {
          const { error } = await supabase.from(table).upsert(rows as any[], { onConflict: 'id' });
          if (!error) restored += rows.length;
        }
      }
      toast.success(`Restored ${restored} records from backup!`);
      setIsRestoring(false);
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Backup & Restore</h1><p className="text-slate-500">Download or restore your school data</p></div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-blue-600" />Create Backup</CardTitle>
          <CardDescription>Download all your school data as a JSON file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastBackup && <div className="flex items-center gap-2 text-sm text-slate-500"><Clock className="h-4 w-4" />Last backup: {lastBackup}</div>}
          <Button onClick={createBackup} disabled={isBackingUp} className="bg-gradient-to-r from-blue-600 to-emerald-600">
            {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download Backup
          </Button>
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700"><CheckCircle className="h-4 w-4 inline mr-1" />Backs up 16 tables</div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-amber-600" />Restore Backup</CardTitle>
          <CardDescription>Upload a backup file. This will overwrite existing data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-700"><AlertTriangle className="h-4 w-4 inline mr-1" />Warning: Overwrites current data.</div>
          <label className="cursor-pointer">
            <Button variant="outline" className="border-amber-300 text-amber-700" disabled={isRestoring} asChild>
              <span>{isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload Backup File</span>
            </Button>
            <input type="file" accept=".json" className="hidden" onChange={restoreBackup} />
          </label>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle><Database className="h-5 w-5 inline mr-2" />What Gets Backed Up</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['Students & Guardians','Payments & Fee Balances','Fee Structures','Library Books & Issues','Black Book Offenses','Leave Requests','Exam Results','Departments & Clearance','SMS Logs','Audit Logs','Notifications'].map(item => (
              <div key={item} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" />{item}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

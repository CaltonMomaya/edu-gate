'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react';

export default function ImportStudentsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [imported, setImported] = useState(0);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const data = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
          admission_number: parts[0]?.trim(),
          first_name: parts[1]?.trim(),
          last_name: parts[2]?.trim(),
          gender: parts[3]?.trim()?.toLowerCase() || 'male',
          grade: parts[4]?.trim() || '10',
          stream: parts[5]?.trim() || '',
          house: parts[6]?.trim() || '',
        };
      }).filter(s => s.admission_number && s.first_name);
      setPreview(data.slice(0, 10));
    };
    reader.readAsText(file);
  }

  async function importStudents() {
    if (preview.length === 0) { toast.error('No data'); return; }
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    let count = 0;
    for (const student of preview) {
      const { error } = await supabase.from('students').insert({
        school_id: userData.school_id, ...student,
      });
      if (!error) count++;
    }
    setImported(count);
    toast.success(`${count} imported!`);
    setIsLoading(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Import Students</h1><p className="text-slate-500 mt-1">Bulk import from CSV</p></div>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle><FileSpreadsheet className="h-5 w-5 inline mr-2" />CSV Format</CardTitle><CardDescription>Columns: admission_number,first_name,last_name,gender,grade,stream,house</CardDescription></CardHeader><CardContent><div className="bg-slate-50 p-4 rounded-lg font-mono text-sm">SRN/2026/001,Alice,Otieno,female,10,10 Blue,Elgon House</div></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle><Upload className="h-5 w-5 inline mr-2" />Upload File</CardTitle></CardHeader><CardContent className="space-y-4">
        <Input type="file" accept=".csv" onChange={handleFileUpload} />
        {preview.length > 0 && <div><p className="text-sm mb-2">Preview ({preview.length}):</p><div className="bg-slate-50 p-4 rounded-lg max-h-48 overflow-y-auto">{preview.slice(0, 10).map((s, i) => <div key={i} className="text-sm py-1">{s.first_name} {s.last_name} - {s.admission_number} - Grade {s.grade}</div>)}</div><Button onClick={importStudents} className="mt-4 bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}Import {preview.length} Students</Button></div>}
        {imported > 0 && <div className="bg-emerald-50 p-4 rounded-lg text-emerald-700"><CheckCircle className="h-5 w-5 inline mr-2" />{imported} students imported!</div>}
      </CardContent></Card>
    </div>
  );
}

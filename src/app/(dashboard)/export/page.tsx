'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2, Database, Users, BookOpen, DollarSign, AlertCircle, GraduationCap } from 'lucide-react';

export default function ExportPage() {
  const supabase = createClient();
  const [isExporting, setIsExporting] = useState(false);
  const [selected, setSelected] = useState<string[]>(['students', 'payments', 'fees']);

  const tables = [
    { id: 'students', label: 'Students', icon: Users, color: 'text-blue-600' },
    { id: 'guardians', label: 'Guardians', icon: Users, color: 'text-purple-600' },
    { id: 'payments', label: 'Payments', icon: DollarSign, color: 'text-emerald-600' },
    { id: 'fees', label: 'Fee Balances', icon: DollarSign, color: 'text-amber-600' },
    { id: 'books', label: 'Library Books', icon: BookOpen, color: 'text-teal-600' },
    { id: 'issued', label: 'Issued Books', icon: BookOpen, color: 'text-indigo-600' },
    { id: 'offenses', label: 'Black Book', icon: AlertCircle, color: 'text-red-600' },
    { id: 'clearance', label: 'Clearance', icon: GraduationCap, color: 'text-orange-600' },
  ];

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function toggleAll() {
    if (selected.length === tables.length) setSelected([]);
    else setSelected(tables.map(t => t.id));
  }

  async function exportData() {
    if (selected.length === 0) { toast.error('Select at least one table'); return; }
    setIsExporting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsExporting(false); return; }
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) { setIsExporting(false); return; }
    const sid = userData.school_id;

    let allData: Record<string, any[]> = {};

    for (const tableId of selected) {
      let query;
      switch (tableId) {
        case 'students': query = supabase.from('students').select('*').eq('school_id', sid); break;
        case 'guardians': query = supabase.from('guardians').select('*, students!inner(first_name, last_name)').eq('students.school_id', sid); break;
        case 'payments': query = supabase.from('payments').select('*, students(first_name, last_name)').eq('school_id', sid); break;
        case 'fees': query = supabase.from('student_fee_balances').select('*, students(first_name, last_name, admission_number)').eq('school_id', sid); break;
        case 'books': query = supabase.from('library_books').select('*').eq('school_id', sid); break;
        case 'issued': query = supabase.from('library_issued').select('*, library_books(title), students(first_name, last_name)').eq('school_id', sid); break;
        case 'offenses': query = supabase.from('black_book').select('*, students(first_name, last_name)').eq('school_id', sid); break;
        case 'clearance': query = supabase.from('student_clearance').select('*, departments(name), students(first_name, last_name)').eq('students.school_id', sid); break;
        default: continue;
      }
      const { data } = await query;
      if (data) allData[tableId] = data;
    }

    // Create CSV
    const zipParts: string[] = [];
    for (const [key, rows] of Object.entries(allData)) {
      if (rows.length === 0) continue;
      const headers = Object.keys(rows[0]).join(',');
      const csvRows = rows.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      zipParts.push(`--- ${key} ---\n${headers}\n${csvRows.join('\n')}\n`);
    }

    const blob = new Blob([zipParts.join('\n\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edu-gate-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${Object.keys(allData).length} tables with ${Object.values(allData).reduce((s, r) => s + r.length, 0)} records`);
    setIsExporting(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Data Export</h1><p className="text-slate-500">Download your school data as CSV</p></div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Select Data to Export</CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {selected.length === tables.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {tables.map(t => (
              <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selected.includes(t.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} className="h-4 w-4" />
                <t.icon className={`h-5 w-5 ${t.color}`} />
                <span className="text-sm font-medium">{t.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-emerald-600" onClick={exportData} disabled={isExporting}>
        {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
        Export Selected Data ({selected.length} tables)
      </Button>

      <Card className="border-0 shadow-sm bg-amber-50">
        <CardContent className="p-4 text-sm text-slate-600">
          <p className="font-medium text-amber-700 mb-2">📋 What gets exported:</p>
          <ul className="space-y-1 list-disc pl-5">
            <li>All records from selected tables in CSV format</li>
            <li>Can be opened in Excel, Google Sheets, or any spreadsheet</li>
            <li>Download is saved to your computer</li>
            <li>Multiple tables are combined into one file with section headers</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

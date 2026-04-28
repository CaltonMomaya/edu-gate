'use client';
import { logAction } from "@/lib/audit";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface FeeStructure { id: string; name: string; amount: number; grade: string; term: string; academic_year: string; }
interface GradeTotal { grade: string; items: FeeStructure[]; total: number; }

export default function FeesPage() {
  const supabase = createClient();
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [gradeTotals, setGradeTotals] = useState<GradeTotal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear().toString());
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeGrade, setFeeGrade] = useState('10');
  const [feeTerm, setFeeTerm] = useState('term1');
  const [feeYear, setFeeYear] = useState('');

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    // Load school's configured academic year
    const { data: school } = await supabase.from('schools').select('current_academic_year').eq('id', userData.school_id).single();
    const year = school?.current_academic_year || new Date().getFullYear().toString();
    setDefaultYear(year);
    setFeeYear(year);
    loadFees(userData.school_id);
  }

  async function loadFees(sid: string) {
    const { data } = await supabase.from('fee_structures').select('*').eq('school_id', sid).order('grade');
    if (data) {
      setFees(data);
      const totals: Record<string, GradeTotal> = {};
      data.forEach(fee => {
        if (!totals[fee.grade]) totals[fee.grade] = { grade: fee.grade, items: [], total: 0 };
        totals[fee.grade].items.push(fee);
        totals[fee.grade].total += fee.amount;
      });
      setGradeTotals(Object.values(totals).sort((a, b) => a.grade.localeCompare(b.grade)));
    }
  }

  async function addFee(e: React.FormEvent) {
    e.preventDefault(); if (!feeName || !feeAmount) return;
    setIsLoading(true);
    const { error } = await supabase.from('fee_structures').insert({
      school_id: schoolId, name: feeName, amount: parseFloat(feeAmount),
      grade: feeGrade, term: feeTerm, academic_year: feeYear,
    });
    if (error) toast.error("Failed");
    else { toast.success(`${feeName} added for ${feeYear}`); setFeeName(""); setFeeAmount(""); loadFees(schoolId); }
    setIsLoading(false);
    setIsLoading(false);
  }

  async function deleteFee(id: string) { await supabase.from('fee_structures').delete().eq('id', id); toast.success('Deleted'); loadFees(schoolId); }

  const termLabel = (t: string) => t === 'term1' ? 'Term 1' : t === 'term2' ? 'Term 2' : 'Term 3';

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Fee Structure</h1><p className="text-slate-500">Default year: {defaultYear}</p></div>

      <div className="grid grid-cols-3 gap-4">
        {['10', '11', '12'].map(grade => {
          const gt = gradeTotals.find(g => g.grade === grade);
          return (
            <Card key={grade} className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-emerald-50">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-slate-500">Grade {grade} Total</p>
                <p className="text-3xl font-bold text-blue-700">KES {(gt?.total || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Add Fee Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addFee} className="space-y-3">
              <Input value={feeName} onChange={e => setFeeName(e.target.value)} placeholder="Fee name *" />
              <Input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} placeholder="Amount (KES) *" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={feeGrade} onValueChange={setFeeGrade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">Grade 10</SelectItem><SelectItem value="11">Grade 11</SelectItem><SelectItem value="12">Grade 12</SelectItem></SelectContent></Select>
                <Select value={feeTerm} onValueChange={setFeeTerm}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent></Select>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1"><Label className="text-xs">Year</Label><Input value={feeYear} onChange={e => setFeeYear(e.target.value)} /></div>
                <p className="text-xs text-slate-400 pb-2">Default: {defaultYear}</p>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Fee'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2"><CardHeader><CardTitle>Fee Items</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {gradeTotals.map(gt => (
              <div key={gt.grade}>
                <div className="flex justify-between mb-2"><h3 className="font-bold">Grade {gt.grade}</h3><Badge className="bg-blue-100 text-blue-700">Total: KES {gt.total.toLocaleString()}</Badge></div>
                <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Term</TableHead><TableHead>Year</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>{gt.items.map(f => (
                    <TableRow key={f.id}><TableCell>{f.name}</TableCell><TableCell>KES {f.amount.toLocaleString()}</TableCell><TableCell>{termLabel(f.term)}</TableCell><TableCell>{f.academic_year}</TableCell><TableCell><Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteFee(f.id)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                  ))}</TableBody></Table>
                <Separator className="my-3" />
              </div>
            ))}
          </CardContent></Card>
      </div>
    </div>
  );
}

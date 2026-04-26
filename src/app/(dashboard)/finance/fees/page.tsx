'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, DollarSign, Calculator } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const feeSchema = z.object({
  name: z.string().min(2, 'Fee name required'),
  amount: z.string().min(1, 'Amount required'),
  grade: z.enum(['10', '11', '12'], { required_error: 'Grade required' }),
  term: z.enum(['term1', 'term2', 'term3'], { required_error: 'Term required' }),
  academicYear: z.string().min(4, 'Year required'),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  grade: string;
  term: string;
  academic_year: string;
}

interface GradeTotal {
  grade: string;
  items: FeeStructure[];
  total: number;
}

export default function FeesPage() {
  const supabase = createClient();
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [gradeTotals, setGradeTotals] = useState<GradeTotal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
  });

  useEffect(() => {
    loadFees();
  }, []);

  async function loadFees() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    const { data } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('school_id', userData.school_id)
      .order('grade');

    if (data) {
      setFees(data);
      
      // Calculate totals per grade
      const totals: Record<string, GradeTotal> = {};
      data.forEach(fee => {
        if (!totals[fee.grade]) {
          totals[fee.grade] = { grade: fee.grade, items: [], total: 0 };
        }
        totals[fee.grade].items.push(fee);
        totals[fee.grade].total += fee.amount;
      });
      setGradeTotals(Object.values(totals).sort((a, b) => a.grade.localeCompare(b.grade)));
    }
  }

  async function addFee(data: FeeFormData) {
    setIsLoading(true);
    const { error } = await supabase.from('fee_structures').insert({
      school_id: schoolId,
      name: data.name,
      amount: parseFloat(data.amount),
      grade: data.grade,
      term: data.term,
      academic_year: data.academicYear,
    });

    if (error) {
      toast.error('Failed to add fee');
    } else {
      toast.success(`${data.name} added!`);
      reset();
      loadFees();
    }
    setIsLoading(false);
  }

  async function deleteFee(id: string) {
    const { error } = await supabase.from('fee_structures').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Fee deleted'); loadFees(); }
  }

  const termLabel = (t: string) => t === 'term1' ? 'Term 1' : t === 'term2' ? 'Term 2' : 'Term 3';
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Fee Structure</h1>
        <p className="text-slate-500 mt-1">Set fees per grade. Total per grade is auto-calculated.</p>
      </div>

      {/* Grade Totals */}
      <div className="grid grid-cols-3 gap-4">
        {['10', '11', '12'].map(grade => {
          const gradeTotal = gradeTotals.find(g => g.grade === grade);
          const total = gradeTotal?.total || 0;
          return (
            <Card key={grade} className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-emerald-50">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-slate-500 mb-1">Grade {grade} Total Fees</p>
                <p className="text-3xl font-bold text-blue-700">KES {total.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">{gradeTotal?.items.length || 0} fee items</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Fee Form */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-600" /> Add Fee Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(addFee)} className="space-y-4">
              <div className="space-y-2"><Label>Fee Name *</Label><Input {...register('name')} placeholder="e.g., Tuition, Boarding" />{errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}</div>
              <div className="space-y-2"><Label>Amount (KES) *</Label><Input {...register('amount')} type="number" placeholder="e.g., 25000" />{errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}</div>
              <div className="space-y-2"><Label>Grade *</Label>
                <Select onValueChange={(v) => setValue('grade', v as '10'|'11'|'12')}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent><SelectItem value="10">Grade 10</SelectItem><SelectItem value="11">Grade 11</SelectItem><SelectItem value="12">Grade 12</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Term *</Label>
                <Select onValueChange={(v) => setValue('term', v as 'term1'|'term2'|'term3')}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Academic Year *</Label><Input {...register('academicYear')} defaultValue={currentYear} /></div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Add Fee</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Fee List by Grade */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-600" /> Fee Items by Grade</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {gradeTotals.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No fee items set. Add fees to get started.</p>
            ) : (
              gradeTotals.map(gt => (
                <div key={gt.grade}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">Grade {gt.grade}</h3>
                    <Badge className="bg-blue-100 text-blue-700 text-base">Total: KES {gt.total.toLocaleString()}</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Fee Name</TableHead><TableHead>Amount</TableHead><TableHead>Term</TableHead><TableHead>Year</TableHead><TableHead></TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {gt.items.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.name}</TableCell>
                          <TableCell>KES {fee.amount.toLocaleString()}</TableCell>
                          <TableCell>{termLabel(fee.term)}</TableCell>
                          <TableCell>{fee.academic_year}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteFee(fee.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-3" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  GraduationCap,
} from 'lucide-react';

interface ClearanceItem {
  id: string;
  department_id: string;
  status: string;
  cleared_at: string;
  departments: {
    name: string;
    clearance_order: number;
  };
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade: string;
  profile_picture_url: string;
}

export default function StudentClearancePage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [student, setStudent] = useState<Student | null>(null);
  const [clearanceItems, setClearanceItems] = useState<ClearanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const { data: stud } = await supabase
      .from('students').select('*').eq('id', id).single();
    if (stud) setStudent(stud);

    const { data: items } = await supabase
      .from('student_clearance')
      .select('*, departments(name, clearance_order)')
      .eq('student_id', id)
      .order('departments(clearance_order)');
    if (items) setClearanceItems(items);
  }

  async function toggleStatus(item: ClearanceItem) {
    setIsLoading(true);
    const newStatus = item.status === 'cleared' ? 'blocked' : 'cleared';

    const { error } = await supabase
      .from('student_clearance')
      .update({
        status: newStatus,
        cleared_at: newStatus === 'cleared' ? new Date().toISOString() : null,
      })
      .eq('id', item.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(`${item.departments.name}: ${newStatus}`);
      loadData();
    }
    setIsLoading(false);
  }

  const allCleared = clearanceItems.length > 0 && clearanceItems.every(c => c.status === 'cleared');
  const fullName = student ? `${student.first_name} ${student.last_name}` : '';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clearance" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Clearance</h1>
          <p className="text-slate-500 mt-1">Step-by-step department clearance</p>
        </div>
      </div>

      {/* Student Info */}
      {student && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={student.profile_picture_url || ''} />
              <AvatarFallback className="text-lg">{student.first_name[0]}{student.last_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg">{fullName}</p>
              <p className="text-sm text-slate-500">{student.admission_number} · Grade {student.grade}</p>
            </div>
            <div className="ml-auto">
              {allCleared ? (
                <Badge className="bg-emerald-100 text-emerald-700 text-base px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-1" /> Fully Cleared
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 text-base px-4 py-2">
                  <Clock className="h-4 w-4 mr-1" /> In Progress
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clearance Steps */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Clearance Route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {clearanceItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Clearance not yet initiated.</p>
              <p className="text-sm">Go back and click "Start Clearance" for this student.</p>
            </div>
          ) : (
            clearanceItems.map((item, index) => (
              <div key={item.id}>
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  item.status === 'cleared' ? 'bg-emerald-50 border-emerald-200' :
                  item.status === 'blocked' ? 'bg-red-50 border-red-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.status === 'cleared' ? 'bg-emerald-500 text-white' :
                      item.status === 'blocked' ? 'bg-red-500 text-white' :
                      'bg-slate-300 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.departments.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.status === 'cleared' && `Cleared ${new Date(item.cleared_at).toLocaleDateString()}`}
                        {item.status === 'blocked' && 'Blocked - Has unresolved issues'}
                        {item.status === 'pending' && 'Pending review'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(item)}
                    disabled={isLoading}
                    className={
                      item.status === 'cleared' ? 'text-red-600 hover:text-red-700' :
                      item.status === 'blocked' ? 'text-emerald-600 hover:text-emerald-700' :
                      'text-blue-600 hover:text-blue-700'
                    }
                  >
                    {item.status === 'cleared' && <><XCircle className="h-4 w-4 mr-1" /> Block</>}
                    {item.status === 'blocked' && <><CheckCircle className="h-4 w-4 mr-1" /> Clear</>}
                    {item.status === 'pending' && <><CheckCircle className="h-4 w-4 mr-1" /> Clear</>}
                  </Button>
                </div>
                {index < clearanceItems.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-4 bg-slate-300" />
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Certificate Button */}
      {allCleared && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="font-bold text-lg">🎓 All Clear!</p>
              <p className="text-white/80 text-sm">{fullName} is ready for graduation</p>
            </div>
            <Button className="bg-white text-emerald-600 hover:bg-slate-100">
              <GraduationCap className="mr-2 h-4 w-4" /> Issue Certificate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

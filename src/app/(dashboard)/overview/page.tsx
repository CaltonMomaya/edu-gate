'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/use-translation';
import { Users, DollarSign, BookOpen, GraduationCap, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  const { t } = useTranslation();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    revenue: 0,
    books: 0,
  });

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', userData.school_id).eq('status', 'active');
    const { count: staff } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', userData.school_id);
    const { count: books } = await supabase.from('library_books').select('*', { count: 'exact', head: true }).eq('school_id', userData.school_id);

    setStats({
      students: students || 0,
      staff: staff || 0,
      revenue: 0,
      books: books || 0,
    });
    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t('common.dashboard')}</h1>
        <Button variant="outline" size="sm"><TrendingUp className="h-4 w-4 mr-2" />{t('common.settings')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('students.studentList')}</p>
                <p className="text-2xl font-bold">{stats.students}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('common.staff') || 'Staff'}</p>
                <p className="text-2xl font-bold">{stats.staff}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('finance.revenue') || 'Revenue'}</p>
                <p className="text-2xl font-bold">KES {stats.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('library.books') || 'Books'}</p>
                <p className="text-2xl font-bold">{stats.books}</p>
              </div>
              <BookOpen className="h-8 w-8 text-amber-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>{t('students.recent') || 'Recent Students'}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">{t('common.noData')}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>{t('finance.recentPayments') || 'Recent Payments'}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">{t('common.noData')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

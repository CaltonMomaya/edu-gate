'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History } from 'lucide-react';

export default function ReturnHistoryPage() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Return History</h1><p className="text-slate-500 mt-1">Complete leave history and patterns</p></div>
      <Card className="border-0 shadow-sm"><CardContent className="flex flex-col items-center py-16"><History className="h-16 w-16 text-slate-300 mb-4" /><CardTitle>Coming Soon</CardTitle><CardDescription>Full leave history with analytics</CardDescription></CardContent></Card>
    </div>
  );
}

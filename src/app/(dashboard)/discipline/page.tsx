'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scale, BookOpen, AlertTriangle } from 'lucide-react';

export default function DisciplinePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Discipline</h1>
        <p className="text-slate-500 mt-1">Manage student discipline records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/discipline/black-book">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-red-100 rounded-xl w-fit mb-3">
                <BookOpen className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Black Book</CardTitle>
              <CardDescription>
                Record offenses and punishments. Track which students have pending discipline cases.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/discipline/punishments">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-amber-100 rounded-xl w-fit mb-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Punishments Log</CardTitle>
              <CardDescription>
                View all punishments issued. Filter by status and track completion.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

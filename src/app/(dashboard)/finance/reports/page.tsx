'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-500 mt-1">This module is coming soon</p>
      </div>
      
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Construction className="h-16 w-16 text-amber-500 mb-4" />
          <CardTitle className="text-xl mb-2">Under Development</CardTitle>
          <CardDescription className="text-center max-w-md">
            This feature is being built. We'll notify you when it's ready for use.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

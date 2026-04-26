'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Mic, AlertCircle } from 'lucide-react';

export default function MusicPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Music & Drama</h1>
        <p className="text-slate-500 mt-1">Manage instruments, costumes, and clearance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-purple-100 rounded-xl w-fit mb-3">
              <Music className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Instruments</CardTitle>
            <p className="text-sm text-slate-500">Issued to students</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-xs text-slate-400">currently issued</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-pink-100 rounded-xl w-fit mb-3">
              <Mic className="h-6 w-6 text-pink-600" />
            </div>
            <CardTitle>Costumes</CardTitle>
            <p className="text-sm text-slate-500">Drama costumes out</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-pink-600">0</p>
            <p className="text-xs text-slate-400">items issued</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-amber-100 rounded-xl w-fit mb-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Pending Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">0</p>
            <p className="text-xs text-slate-400">items overdue</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

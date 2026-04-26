'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Search, Loader2, BookPlus, BookCheck, AlertCircle } from 'lucide-react';

// We'll add library_books table later. For now, this is the dashboard placeholder.
export default function LibraryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Library</h1>
        <p className="text-slate-500 mt-1">Manage books, issue/return, and track fines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-blue-100 rounded-xl w-fit mb-3">
              <BookPlus className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Issue Book</CardTitle>
            <p className="text-sm text-slate-500">Issue a book to a student</p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Coming in next update</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-3">
              <BookCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle>Return Book</CardTitle>
            <p className="text-sm text-slate-500">Process book returns</p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Coming in next update</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-amber-100 rounded-xl w-fit mb-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Fines & Overdue</CardTitle>
            <p className="text-sm text-slate-500">Track unpaid library fines</p>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Coming in next update</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Library Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-xs text-slate-500">Books Issued</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">0</p>
              <p className="text-xs text-slate-500">Returned Today</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">0</p>
              <p className="text-xs text-slate-500">Overdue</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">KES 0</p>
              <p className="text-xs text-slate-500">Fines Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DoorOpen, CheckCircle, History } from 'lucide-react';

export default function LeavePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
        <p className="text-slate-500 mt-1">Request student leave and track returns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/leave/apply">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-blue-100 rounded-xl w-fit mb-3">
                <DoorOpen className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Apply Leave</CardTitle>
              <CardDescription>
                Request leave for a student. Search, select guardian, and notify via SMS.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/leave/approve">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Approve & Track</CardTitle>
              <CardDescription>
                View approved leaves and mark student returns. Track late returns.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/leave/return">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-3">
                <History className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Return History</CardTitle>
              <CardDescription>
                View complete leave history. Check late returns and patterns.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

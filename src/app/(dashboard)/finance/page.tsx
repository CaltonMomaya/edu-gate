'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, CreditCard, BarChart3 } from 'lucide-react';

export default function FinancePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Finance</h1>
        <p className="text-slate-500 mt-1">Manage school fees, payments, and financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/finance/fees">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-blue-100 rounded-xl w-fit mb-3"><DollarSign className="h-6 w-6 text-blue-600" /></div>
              <CardTitle>Fee Structure</CardTitle>
              <CardDescription>Set and manage fees per grade and term</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/finance/payments">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-3"><CreditCard className="h-6 w-6 text-emerald-600" /></div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Record payments and track transaction history</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/finance/reports">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-3"><BarChart3 className="h-6 w-6 text-purple-600" /></div>
              <CardTitle>Reports</CardTitle>
              <CardDescription>View balances, outstanding fees, and collections</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}

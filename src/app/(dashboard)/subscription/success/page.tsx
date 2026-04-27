'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg text-center">
        <CardContent className="p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h1>
          <p className="text-slate-500 mb-4">Your subscription has been activated.</p>
          <Badge className="bg-emerald-100 text-emerald-700 mb-6 px-4 py-2">Plan Active</Badge>
          <Link href="/overview">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-600">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

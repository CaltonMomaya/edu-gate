'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CreditCard, Check, Clock, AlertTriangle, Crown, Zap, Shield } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  student_limit: number | null;
  sms_credits: number;
  storage_gb: number;
  features: any;
}

interface School {
  subscription_status: string;
  subscription_expires_at: string;
  subscription_plan_id: string;
  sms_balance: number;
}

export default function SubscriptionPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const { data: schoolData } = await supabase
      .from('schools')
      .select('subscription_status, subscription_expires_at, subscription_plan_id, sms_balance')
      .eq('id', userData.school_id)
      .single();

    if (schoolData) {
      setSchool(schoolData);

      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly');

      if (plansData) {
        setPlans(plansData);
        const current = plansData.find(p => p.id === schoolData.subscription_plan_id);
        if (current) setCurrentPlan(current);
      }
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700"><Check className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'grace_period': return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" /> Grace Period</Badge>;
      case 'suspended': return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="h-3 w-3 mr-1" /> Suspended</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  const daysLeft = school?.subscription_expires_at
    ? Math.ceil((new Date(school.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your plan and billing</p>
      </div>

      {/* Current Plan */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Current Plan</p>
              <p className="text-3xl font-bold">{currentPlan?.display_name || 'Free Trial'}</p>
              <p className="text-white/80 text-sm mt-1">
                {school?.subscription_status === 'active'
                  ? `${daysLeft} days remaining`
                  : 'Expired'}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(school?.subscription_status || 'active')}
              <p className="text-white/80 text-sm mt-2">
                SMS Balance: <span className="font-bold">{school?.sms_balance || 0}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`border-0 shadow-sm relative ${currentPlan?.id === plan.id ? 'ring-2 ring-emerald-500' : ''}`}>
            {currentPlan?.id === plan.id && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white">Current Plan</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.name === 'starter' ? <Shield className="h-5 w-5 text-blue-500" /> :
                 plan.name === 'standard' ? <Zap className="h-5 w-5 text-amber-500" /> :
                 <Crown className="h-5 w-5 text-purple-500" />}
                {plan.display_name}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-slate-800">KES {plan.price_monthly?.toLocaleString()}</span>
                <span className="text-slate-500">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.student_limit ? `${plan.student_limit} students` : 'Unlimited students'}</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.sms_credits} SMS credits</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> {plan.storage_gb}GB storage</p>
                {plan.features?.library && <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Library Module</p>}
                {plan.features?.leave && <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Leave Management</p>}
                {plan.features?.clearance && <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Clearance System</p>}
                {plan.features?.black_book && <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Black Book</p>}
              </div>
              <Separator />
              <Button className="w-full" variant={currentPlan?.id === plan.id ? 'outline' : 'default'} disabled={currentPlan?.id === plan.id}>
                {currentPlan?.id === plan.id ? 'Current Plan' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

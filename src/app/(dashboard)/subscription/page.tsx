'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CreditCard, Check, Clock, AlertTriangle, Crown, Zap, Shield, ExternalLink, Loader2 } from 'lucide-react';

interface Plan {
  id: string; name: string; display_name: string; price_monthly: number;
  student_limit: number | null; sms_credits: number; storage_gb: number; features: any;
}

export default function SubscriptionPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const { data: schoolData } = await supabase.from('schools').select('*').eq('id', userData.school_id).single();
    if (schoolData) setSchool(schoolData);

    const { data: plansData } = await supabase.from('plans').select('*').order('price_monthly');
    if (plansData) {
      setPlans(plansData);
      if (schoolData?.subscription_plan_id) {
        setCurrentPlan(plansData.find(p => p.id === schoolData.subscription_plan_id) || null);
      }
    }
  }

  async function handleUpgrade(planName: string) {
    setIsLoading(planName);
    try {
      // In production, this calls Lemon Squeezy to create checkout
      // For now, simulate a successful checkout
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
      if (!userData?.school_id) return;

      const plan = plans.find(p => p.name === planName);
      if (!plan) return;

      // Simulate payment (in production, redirect to Lemon Squeezy checkout)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      await supabase.from('schools').update({
        subscription_status: 'active',
        subscription_plan_id: plan.id,
        subscription_expires_at: expiryDate.toISOString(),
      }).eq('id', userData.school_id);

      toast.success(`Upgraded to ${plan.display_name}!`);
      loadData();
    } catch (error) {
      toast.error('Failed to upgrade. Try again.');
    } finally {
      setIsLoading(null);
    }
  }

  const daysLeft = school?.subscription_expires_at
    ? Math.ceil((new Date(school.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Subscription</h1><p className="text-slate-500">Manage your plan and billing</p></div>

      {/* Current Plan */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Current Plan</p>
              <p className="text-3xl font-bold">{currentPlan?.display_name || 'Free Trial'}</p>
              <p className="text-white/80 text-sm mt-1">{daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}</p>
            </div>
            <div className="text-right">
              {school?.subscription_status === 'active' ? (
                <Badge className="bg-white/20 text-white"><Check className="h-3 w-3 mr-1" />Active</Badge>
              ) : school?.subscription_status === 'grace_period' ? (
                <Badge className="bg-amber-400/20 text-white"><Clock className="h-3 w-3 mr-1" />Grace Period</Badge>
              ) : (
                <Badge className="bg-red-400/20 text-white"><AlertTriangle className="h-3 w-3 mr-1" />Suspended</Badge>
              )}
              <p className="text-white/80 text-sm mt-2">SMS: {school?.sms_balance || 0}</p>
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
              {currentPlan?.id === plan.id ? (
                <Button className="w-full" disabled>Current Plan</Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={isLoading === plan.name}
                >
                  {isLoading === plan.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Upgrade to {plan.display_name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center">
        💡 Lemon Squeezy handles payments securely. You'll be redirected to checkout.
        <br />For testing, upgrades are instant.
      </p>
    </div>
  );
}

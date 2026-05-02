'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Calendar, MessageSquare, Loader2, Check } from 'lucide-react';

export default function SubscriptionPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: u } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!u?.school_id) return;

    const { data: schoolData } = await supabase.from('schools').select('*').eq('id', u.school_id).single();
    if (schoolData) setSchool(schoolData);

    // 3 packages only - Starter, Standard, Premium
    const { data: planData } = await supabase.from('subscription_plans').select('*').eq('is_active', true);
    if (planData) setPlans(planData);

    setLoading(false);
  }

  async function initiatePayment(planId: string) {
    toast.info(`Paystack: Plan ${planId}`);
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  if (loading) return <div className="p-6"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

  const isLocked = school?.subscription_status === 'not_paid' || 
                   (school?.subscription_status === 'trial' && new Date(school.subscription_expires_at) < new Date());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription</h1>
          <p className="text-slate-500">Manage your subscription and SMS credits</p>
        </div>
        <Badge className={
          school?.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
          school?.subscription_status === 'trial' ? 'bg-amber-100 text-amber-700' :
          school?.subscription_status === 'not_paid' ? 'bg-red-100 text-red-700' :
          'bg-slate-100 text-slate-700'
        }>
          {school?.subscription_status || 'Unknown'}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle><Calendar className="mr-2 h-5 w-5 inline" /> Current Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-sm text-slate-500">Status</p><p className="font-medium">{school?.subscription_status}</p></div>
            <div><p className="text-sm text-slate-500">Expires</p><p className="font-medium">{school?.subscription_expires_at ? formatDate(school.subscription_expires_at) : 'N/A'}</p></div>
            <div><p className="text-sm text-slate-500">SMS Credits</p><p className="font-medium">{school?.sms_balance || 0}</p></div>
          </div>
          {isLocked && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-700 font-medium">⚠️ Your trial has expired. Please subscribe to continue using EDU GATE.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isLocked && (
        <Card>
          <CardHeader><CardTitle><CreditCard className="mr-2 h-5 w-5 inline" /> Subscription Plans</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map(plan => (
                <Card key={plan.id} className="border-2 border-slate-200 hover:border-blue-600 transition-colors">
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">{plan.name}</p>
                    <p className="text-2xl font-bold text-blue-600">KES {plan.price_kes.toLocaleString()}/mo</p>
                    <p className="text-sm text-slate-500 mb-4">{plan.duration_months} month(s) · {plan.sms_credits} SMS</p>
                    <div className="text-left text-sm space-y-1 mb-4">
                      {plan.features && Object.entries(plan.features).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>{key.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => initiatePayment(plan.id)} className="mt-4 w-full bg-blue-600">
                      <CreditCard className="mr-2 h-4 w-4" /> Subscribe
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

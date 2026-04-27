'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Building2, CheckCircle, XCircle, AlertTriangle, Activity,
  Shield, Edit, Save, Lock, LogIn
} from 'lucide-react';

interface School {
  id: string; name: string; email: string; school_code: string;
  subscription_status: string; subscription_plan_id: string;
  subscription_expires_at: string; sms_balance: number; created_at: string;
}

interface Plan {
  id: string; name: string; display_name: string;
  price_monthly: number; price_yearly: number;
  student_limit: number | null; sms_credits: number;
}

interface SmsPackage {
  id: string; name: string; credits: number; price: number; is_active: boolean;
}

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [activeTab, setActiveTab] = useState('schools');

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolStats, setSchoolStats] = useState({ total: 0, active: 0, suspended: 0, trial: 0 });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editYearly, setEditYearly] = useState('');
  const [editStudentLimit, setEditStudentLimit] = useState('');
  const [smsPackages, setSmsPackages] = useState<SmsPackage[]>([]);
  const [editingSms, setEditingSms] = useState<SmsPackage | null>(null);
  const [editSmsPrice, setEditSmsPrice] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passphrase === 'edugate2026super') {
      setIsAuthenticated(true); loadAllData(); toast.success('Super Admin access granted');
    } else { toast.error('Invalid passphrase'); }
  }

  // Use a direct supabase client without auth
  const supabase = createClient();

  async function loadAllData() {
    const { data: schoolsData } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    if (schoolsData) {
      setSchools(schoolsData);
      setSchoolStats({
        total: schoolsData.length,
        active: schoolsData.filter(s => s.subscription_status === 'active').length,
        suspended: schoolsData.filter(s => s.subscription_status === 'suspended').length,
        trial: schoolsData.filter(s => !s.subscription_plan_id).length,
      });
    }
    const { data: plansData } = await supabase.from('plans').select('*').order('price_monthly');
    if (plansData) setPlans(plansData);
    const { data: smsData } = await supabase.from('sms_packages').select('*').order('credits');
    if (smsData) setSmsPackages(smsData);
  }

  async function savePlan(plan: Plan) {
    const { error } = await supabase.from('plans').update({
      price_monthly: parseFloat(editPrice),
      price_yearly: editYearly ? parseFloat(editYearly) : null,
      student_limit: editStudentLimit ? parseInt(editStudentLimit) : null,
    }).eq('id', plan.id);
    if (error) toast.error('Failed'); else { toast.success(`${plan.display_name} updated!`); setEditingPlan(null); loadAllData(); }
  }

  async function saveSmsPackage(pkg: SmsPackage) {
    const { error } = await supabase.from('sms_packages').update({ price: parseFloat(editSmsPrice) }).eq('id', pkg.id);
    if (error) toast.error('Failed'); else { toast.success(`${pkg.name} updated!`); setEditingSms(null); loadAllData(); }
  }

  async function toggleSchoolStatus(school: School) {
    const newStatus = school.subscription_status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('schools').update({ subscription_status: newStatus }).eq('id', school.id);
    if (error) toast.error('Failed'); else { toast.success(`${school.name} ${newStatus}`); loadAllData(); }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3"><div className="bg-gradient-to-br from-red-600 to-purple-600 p-4 rounded-2xl"><Shield className="h-10 w-10 text-white" /></div></div>
            <CardTitle className="text-2xl font-bold">Super Admin</CardTitle>
            <CardDescription>Enter passphrase to access platform control</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium"><Lock className="h-3 w-3 inline mr-1" />Passphrase</label>
                <Input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Enter passphrase" />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-purple-600"><LogIn className="mr-2 h-4 w-4" />Access Dashboard</Button>
              <p className="text-xs text-slate-400 text-center">Passphrase: edugate2026super</p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1><p className="text-slate-400">Platform control center</p></div>
          <Badge className="bg-red-500 text-white text-sm px-3 py-1">🔒 Super Admin</Badge>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-white/10 border-0 text-white"><CardContent className="p-4 text-center"><Building2 className="h-6 w-6 mx-auto text-blue-400 mb-1" /><p className="text-2xl font-bold">{schoolStats.total}</p><p className="text-xs text-slate-300">Total Schools</p></CardContent></Card>
          <Card className="bg-white/10 border-0 text-white"><CardContent className="p-4 text-center"><CheckCircle className="h-6 w-6 mx-auto text-emerald-400 mb-1" /><p className="text-2xl font-bold">{schoolStats.active}</p><p className="text-xs text-slate-300">Active</p></CardContent></Card>
          <Card className="bg-white/10 border-0 text-white"><CardContent className="p-4 text-center"><XCircle className="h-6 w-6 mx-auto text-red-400 mb-1" /><p className="text-2xl font-bold">{schoolStats.suspended}</p><p className="text-xs text-slate-300">Suspended</p></CardContent></Card>
          <Card className="bg-white/10 border-0 text-white"><CardContent className="p-4 text-center"><Activity className="h-6 w-6 mx-auto text-amber-400 mb-1" /><p className="text-2xl font-bold">{schoolStats.trial}</p><p className="text-xs text-slate-300">On Trial</p></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/10 border-0">
            <TabsTrigger value="schools" className="text-white data-[state=active]:bg-blue-600">🏫 Schools</TabsTrigger>
            <TabsTrigger value="pricing" className="text-white data-[state=active]:bg-blue-600">💰 Pricing Plans</TabsTrigger>
            <TabsTrigger value="sms" className="text-white data-[state=active]:bg-blue-600">📱 SMS Packages</TabsTrigger>
          </TabsList>

          <TabsContent value="schools">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>All Schools ({schools.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2">School</th><th className="text-left py-2">Code</th><th className="text-left py-2">Status</th><th className="text-left py-2">SMS</th><th className="text-left py-2">Expires</th><th className="text-left py-2">Action</th></tr></thead>
                    <tbody>{schools.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2"><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></td>
                        <td className="py-2">{s.school_code}</td>
                        <td className="py-2"><Badge className={s.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{s.subscription_status}</Badge></td>
                        <td className="py-2">{s.sms_balance || 0}</td>
                        <td className="py-2 text-xs">{s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-2"><Button size="sm" variant="outline" onClick={() => toggleSchoolStatus(s)}>{s.subscription_status === 'active' ? 'Suspend' : 'Activate'}</Button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="grid grid-cols-3 gap-4">
              {plans.map(plan => (
                <Card key={plan.id} className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="flex justify-between">{plan.display_name}<Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setEditPrice(plan.price_monthly.toString()); setEditYearly(plan.price_yearly?.toString() || ''); setEditStudentLimit(plan.student_limit?.toString() || ''); }}><Edit className="h-4 w-4" /></Button></CardTitle></CardHeader>
                  <CardContent>
                    {editingPlan?.id === plan.id ? (
                      <div className="space-y-2">
                        <div><label className="text-xs">Monthly (KES)</label><Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} /></div>
                        <div><label className="text-xs">Yearly (KES)</label><Input type="number" value={editYearly} onChange={e => setEditYearly(e.target.value)} /></div>
                        <div><label className="text-xs">Student Limit</label><Input type="number" value={editStudentLimit} onChange={e => setEditStudentLimit(e.target.value)} /></div>
                        <div className="flex gap-2"><Button size="sm" onClick={() => savePlan(plan)}><Save className="h-3 w-3 mr-1" />Save</Button><Button size="sm" variant="outline" onClick={() => setEditingPlan(null)}>Cancel</Button></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Monthly</span><span className="font-bold text-xl">KES {plan.price_monthly?.toLocaleString()}</span></div>
                        {plan.price_yearly && <div className="flex justify-between"><span className="text-slate-500">Yearly</span><span className="font-bold">KES {plan.price_yearly?.toLocaleString()}</span></div>}
                        <div className="flex justify-between"><span className="text-slate-500">Students</span><span className="font-bold">{plan.student_limit ? plan.student_limit.toLocaleString() : 'Unlimited'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">SMS Credits</span><span className="font-bold">{plan.sms_credits}</span></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sms">
            <div className="grid grid-cols-4 gap-4">
              {smsPackages.map(pkg => (
                <Card key={pkg.id} className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="flex justify-between text-lg">{pkg.name}<Button variant="ghost" size="icon" onClick={() => { setEditingSms(pkg); setEditSmsPrice(pkg.price.toString()); }}><Edit className="h-4 w-4" /></Button></CardTitle></CardHeader>
                  <CardContent>
                    {editingSms?.id === pkg.id ? (
                      <div className="space-y-2">
                        <div><label className="text-xs">Price (KES)</label><Input type="number" value={editSmsPrice} onChange={e => setEditSmsPrice(e.target.value)} /></div>
                        <div className="flex gap-2"><Button size="sm" onClick={() => saveSmsPackage(pkg)}><Save className="h-3 w-3 mr-1" />Save</Button><Button size="sm" variant="outline" onClick={() => setEditingSms(null)}>Cancel</Button></div>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <p className="text-3xl font-bold text-blue-600">{pkg.credits}</p>
                        <p className="text-xs text-slate-500">SMS Credits</p>
                        <Separator />
                        <p className="text-2xl font-bold text-emerald-600">KES {pkg.price?.toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-0 shadow-sm mt-6 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold mb-2">💰 Your Revenue Engine</h3>
                <p className="text-white/80 text-sm">Schools pay YOU for subscriptions & SMS. Lemon Squeezy takes 5%.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

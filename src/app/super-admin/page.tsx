'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, CreditCard, Lock, LogIn, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface School {
  id: string;
  name: string;
  email: string;
  school_code: string;
  subscription_status: string;
  subscription_expires_at: string;
  created_at: string;
}

export default function SuperAdminPage() {
  const supabase = createClient();
  const [schools, setSchools] = useState<School[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [stats, setStats] = useState({ totalSchools: 0, activeSchools: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      loadData();
    }
  }

  function handleSuperLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passphrase === 'edugate2026super') {
      setIsAuthenticated(true);
      loadData();
      toast.success('Super Admin access granted');
    } else {
      toast.error('Invalid passphrase');
    }
  }

  async function loadData() {
    const { data: schoolsData } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (schoolsData) {
      setSchools(schoolsData);
      setStats({
        totalSchools: schoolsData.length,
        activeSchools: schoolsData.filter(s => s.subscription_status === 'active').length,
      });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-gradient-to-br from-red-600 to-purple-600 p-4 rounded-2xl">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Super Admin</CardTitle>
            <p className="text-slate-500">Enter passphrase to access platform dashboard</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSuperLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  <Lock className="h-3 w-3 inline mr-1" /> Passphrase
                </label>
                <Input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-purple-600">
                <LogIn className="mr-2 h-4 w-4" /> Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-slate-400">Platform overview and management</p>
          </div>
          <Badge className="bg-red-500 text-white text-sm py-1 px-3">🔒 Super Admin</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/10 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-3xl font-bold">{stats.totalSchools}</p>
                  <p className="text-sm text-slate-300">Total Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="text-3xl font-bold">{stats.activeSchools}</p>
                  <p className="text-sm text-slate-300">Active Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>All Registered Schools</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">No schools yet.</TableCell>
                  </TableRow>
                ) : (
                  schools.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </TableCell>
                      <TableCell>{s.school_code}</TableCell>
                      <TableCell>
                        <Badge className={s.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                          {s.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-500">
                        {s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-bold text-lg">Starter</p>
              <p className="text-2xl font-bold text-blue-600">KES 2,900</p>
              <p className="text-xs text-slate-500">/month</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-bold text-lg">Standard</p>
              <p className="text-2xl font-bold text-emerald-600">KES 7,900</p>
              <p className="text-xs text-slate-500">/month</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-bold text-lg">Premium</p>
              <p className="text-2xl font-bold text-purple-600">KES 14,900</p>
              <p className="text-xs text-slate-500">/month</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

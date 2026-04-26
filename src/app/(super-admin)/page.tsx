'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';

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
  const [stats, setStats] = useState({ totalSchools: 0, activeSchools: 0, totalStudents: 0 });

  useEffect(() => {
    loadData();
  }, []);

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
        totalStudents: 0, // Will add count later
      });
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Super Admin Dashboard</h1>
          <p className="text-slate-500">Platform overview and management</p>
        </div>
        <Badge className="bg-red-100 text-red-700 text-sm py-1 px-3">🔒 Super Admin</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-3xl font-bold">{stats.totalSchools}</p>
                <p className="text-sm text-slate-500">Total Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-3xl font-bold">{stats.activeSchools}</p>
                <p className="text-sm text-slate-500">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-slate-500">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Schools</CardTitle>
        </CardHeader>
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
              {schools.map((s) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Pricing Plans</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Starter: KES 2,900/mo</p>
            <p className="text-sm text-slate-500">Standard: KES 7,900/mo</p>
            <p className="text-sm text-slate-500">Premium: KES 14,900/mo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-x-2">
            <Button size="sm" variant="outline">Edit Pricing</Button>
            <Button size="sm" variant="outline">View Reports</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

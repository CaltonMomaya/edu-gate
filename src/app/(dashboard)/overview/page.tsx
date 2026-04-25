'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, DollarSign } from 'lucide-react';

export default function OverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500">No students registered yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500">Across all grades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Fee Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 0</div>
            <p className="text-xs text-slate-500">This term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Library Books</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-500">Currently issued</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to EDU GATE</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Your school management dashboard is ready. Start by adding students, 
            setting up departments, and configuring your fee structures.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

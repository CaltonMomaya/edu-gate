'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Trophy, Users, AlertCircle } from 'lucide-react';

export default function GamesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Games & Sports</h1>
        <p className="text-slate-500 mt-1">Manage sports equipment, teams, and clearance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-blue-100 rounded-xl w-fit mb-3">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Equipment Issued</CardTitle>
            <p className="text-sm text-slate-500">Jerseys, balls, gear</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-xs text-slate-400">items currently issued</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-3">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle>Teams</CardTitle>
            <p className="text-sm text-slate-500">Active sports teams</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">0</p>
            <p className="text-xs text-slate-400">teams registered</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="p-3 bg-amber-100 rounded-xl w-fit mb-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Pending Returns</CardTitle>
            <p className="text-sm text-slate-500">Equipment not returned</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">0</p>
            <p className="text-xs text-slate-400">items overdue</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">No recent equipment transactions.</p>
        </CardContent>
      </Card>
    </div>
  );
}

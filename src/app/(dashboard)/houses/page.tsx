'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Home, Plus, Users } from 'lucide-react';

interface HouseStats {
  house: string;
  count: number;
}

export default function HousesPage() {
  const supabase = createClient();
  const [houses, setHouses] = useState<HouseStats[]>([]);
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    setSchoolId(userData.school_id);

    // Get house stats from students
    const { data } = await supabase
      .from('students')
      .select('house')
      .eq('school_id', userData.school_id)
      .eq('status', 'active')
      .not('house', 'is', null);

    if (data) {
      const houseCounts: Record<string, number> = {};
      data.forEach(s => {
        if (s.house) {
          houseCounts[s.house] = (houseCounts[s.house] || 0) + 1;
        }
      });
      setHouses(Object.entries(houseCounts).map(([house, count]) => ({ house, count })));
    }
  }

  const houseColors: Record<string, string> = {
    'Elgon': 'bg-blue-100 text-blue-700 border-blue-200',
    'Kenya': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Kilimanjaro': 'bg-amber-100 text-amber-700 border-amber-200',
  };

  function getHouseColor(name: string) {
    for (const [key, color] of Object.entries(houseColors)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Boarding Houses</h1>
        <p className="text-slate-500 mt-1">Student distribution by house</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {houses.length === 0 ? (
          <Card className="border-0 shadow-sm col-span-3">
            <CardContent className="text-center py-12">
              <Home className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No boarding houses yet.</p>
              <p className="text-sm text-slate-400">Houses are assigned when registering students.</p>
            </CardContent>
          </Card>
        ) : (
          houses.map((h) => (
            <Card key={h.house} className={`border-2 shadow-sm ${getHouseColor(h.house)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{h.house}</CardTitle>
                  <Home className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{h.count}</p>
                <p className="text-sm mt-1">students</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Common Houses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['Elgon House', 'Kenya House', 'Kilimanjaro House', 'Mt. Kenya House', 'Aberdare House'].map(name => (
              <Badge key={name} variant="outline" className="text-sm py-1 px-3">{name}</Badge>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">These are suggested house names. You can use any name when registering students.</p>
        </CardContent>
      </Card>
    </div>
  );
}

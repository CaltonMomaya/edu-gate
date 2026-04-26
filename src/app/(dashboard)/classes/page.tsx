'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users } from 'lucide-react';

interface StreamStats {
  stream: string;
  grade: string;
  count: number;
}

export default function ClassesPage() {
  const supabase = createClient();
  const [streams, setStreams] = useState<StreamStats[]>([]);
  const [gradeStats, setGradeStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;

    const { data } = await supabase
      .from('students')
      .select('grade, stream')
      .eq('school_id', userData.school_id)
      .eq('status', 'active');

    if (data) {
      // Grade stats
      const grades: Record<string, number> = {};
      data.forEach(s => { grades[s.grade] = (grades[s.grade] || 0) + 1; });
      setGradeStats(grades);

      // Stream stats
      const streamCounts: Record<string, { grade: string; count: number }> = {};
      data.forEach(s => {
        const key = `${s.grade}-${s.stream || 'Unassigned'}`;
        if (!streamCounts[key]) streamCounts[key] = { grade: s.grade, count: 0 };
        streamCounts[key].count++;
      });
      setStreams(Object.entries(streamCounts).map(([key, val]) => ({
        stream: key.split('-')[1],
        grade: val.grade,
        count: val.count,
      })));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Classes & Streams</h1>
        <p className="text-slate-500 mt-1">Student distribution by grade and stream</p>
      </div>

      {/* Grade Summary */}
      <div className="grid grid-cols-3 gap-4">
        {['10', '11', '12'].map(grade => (
          <Card key={grade} className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <GraduationCap className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-3xl font-bold">{gradeStats[grade] || 0}</p>
              <p className="text-sm text-slate-500">Grade {grade}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Streams */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Stream Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {streams.length === 0 ? (
              <p className="text-slate-500">No streams assigned yet.</p>
            ) : (
              streams.map((s, i) => (
                <Badge key={i} variant="outline" className="text-sm py-2 px-4">
                  Grade {s.grade} {s.stream}: <span className="font-bold ml-1">{s.count}</span> students
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

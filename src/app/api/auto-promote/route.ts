import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createServerSupabaseAdminClient();

  const results = {
    promoted: { grade10to11: 0, grade11to12: 0 },
    graduated: 0,
    errors: [] as string[],
  };

  const { data: schools } = await supabase.from('schools').select('id, name');
  if (!schools) {
    return NextResponse.json({ message: 'No schools found' });
  }

  for (const school of schools) {
    // ⚠️ PROCESS IN REVERSE ORDER to avoid double-promotion

    // 1. FIRST: Grade 12 → Alumni (if cleared)
    const { data: grade12 } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', school.id)
      .eq('grade', '12')
      .eq('status', 'active');

    if (grade12) {
      for (const s of grade12) {
        const { data: clearance } = await supabase
          .from('student_clearance')
          .select('status')
          .eq('student_id', s.id);

        const allCleared = clearance && clearance.length > 0 && clearance.every(c => c.status === 'cleared');

        if (allCleared) {
          await supabase
            .from('students')
            .update({
              status: 'alumni',
              graduation_date: new Date().toISOString(),
            })
            .eq('id', s.id)
            .eq('grade', '12'); // Extra safety: still must be grade 12

          await supabase.from('academic_history').insert({
            student_id: s.id,
            school_id: school.id,
            academic_year: new Date().getFullYear().toString(),
            grade: 'Alumni',
            notes: 'Graduated - All departments cleared',
          });

          results.graduated++;
        }
      }
    }

    // 2. SECOND: Grade 11 → Grade 12
    const { data: grade11, error: e2 } = await supabase
      .from('students')
      .update({ grade: '12' })
      .eq('school_id', school.id)
      .eq('grade', '11')
      .eq('status', 'active')
      .select('id');

    if (e2) {
      results.errors.push(`${school.name}: Grade 11 error - ${e2.message}`);
    } else if (grade11) {
      results.promoted.grade11to12 += grade11.length;

      for (const s of grade11) {
        await supabase.from('academic_history').insert({
          student_id: s.id,
          school_id: school.id,
          academic_year: new Date().getFullYear().toString(),
          grade: '12',
          notes: 'Auto-promoted from Grade 11',
        });
      }
    }

    // 3. LAST: Grade 10 → Grade 11
    const { data: grade10, error: e1 } = await supabase
      .from('students')
      .update({ grade: '11' })
      .eq('school_id', school.id)
      .eq('grade', '10')
      .eq('status', 'active')
      .select('id');

    if (e1) {
      results.errors.push(`${school.name}: Grade 10 error - ${e1.message}`);
    } else if (grade10) {
      results.promoted.grade10to11 += grade10.length;

      for (const s of grade10) {
        await supabase.from('academic_history').insert({
          student_id: s.id,
          school_id: school.id,
          academic_year: new Date().getFullYear().toString(),
          grade: '11',
          notes: 'Auto-promoted from Grade 10',
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    message: `Grade 12→Alumni: ${results.graduated}, Grade 11→12: ${results.promoted.grade11to12}, Grade 10→11: ${results.promoted.grade10to11}`,
  });
}

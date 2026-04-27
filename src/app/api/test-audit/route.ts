import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not logged in. Please login first.' }, { status: 401 });
    }

    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    
    // Use a proper UUID format
    const testUuid = '00000000-0000-0000-0000-000000000001';
    
    const { data, error } = await supabase.from('audit_logs').insert({
      school_id: userData?.school_id,
      user_id: user.id,
      action: 'test_log',
      entity_type: 'test',
      entity_id: testUuid,
      new_data: { test: true, time: new Date().toISOString() },
    }).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

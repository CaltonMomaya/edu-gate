import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role, phone, schoolId, tscNumber } = await request.json();

    if (!email || !password || !fullName || !role || !schoolId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createServerSupabaseAdminClient();

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        school_id: schoolId,
        role,
        tsc_number: tscNumber || '',
      },
    });

    if (authError) {
      if (authError.message?.includes('already exists')) {
        return NextResponse.json({ message: 'A user with this email already exists' }, { status: 400 });
      }
      return NextResponse.json({ message: authError.message }, { status: 500 });
    }

    // Create user profile
    const { error: userError } = await supabase.from('users').insert({
      id: authUser.user.id,
      school_id: schoolId,
      full_name: fullName,
      email,
      role,
      phone: phone || null,
    });

    if (userError) {
      return NextResponse.json({ message: userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authUser.user.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

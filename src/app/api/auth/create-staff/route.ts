import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role, phone, schoolId, tscNumber } = await request.json();

    if (!email || !password || !fullName || !role || !schoolId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createServerSupabaseAdminClient();

    // Create auth user with explicit password
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password, // TSC number
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        school_id: schoolId,
        role,
        tsc_number: tscNumber || password,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ 
        message: authError.message?.includes('already exists') 
          ? 'A user with this email already exists' 
          : 'Failed to create account: ' + authError.message 
      }, { status: 400 });
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
      console.error('Profile error:', userError);
      return NextResponse.json({ message: userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: authUser.user.id });
  } catch (error: any) {
    console.error('Staff error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

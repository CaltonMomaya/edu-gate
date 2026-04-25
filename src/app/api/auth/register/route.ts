import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const supabase = await createServerSupabaseAdminClient();

  const schoolName = formData.get('schoolName') as string;
  const poBox = formData.get('poBox') as string;
  const email = formData.get('email') as string;
  const schoolCode = formData.get('schoolCode') as string;
  const adminFullName = formData.get('adminFullName') as string;
  const adminEmail = formData.get('adminEmail') as string;
  const adminPassword = formData.get('adminPassword') as string;

  if (!schoolName || !poBox || !email || !schoolCode || !adminFullName || !adminEmail || !adminPassword) {
    return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
  }

  // 1. Create the school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .insert({
      name: schoolName,
      po_box: poBox,
      email: email,
      school_code: schoolCode,
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single();

  if (schoolError) {
    if (schoolError.code === '23505') {
      return NextResponse.json({ message: 'A school with this email or school code already exists.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create school: ' + schoolError.message }, { status: 500 });
  }

  // 2. Create auth user with admin privileges
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: adminFullName, school_id: school.id },
  });

  if (authError) {
    await supabase.from('schools').delete().eq('id', school.id);
    return NextResponse.json({ message: 'Failed to create admin user: ' + authError.message }, { status: 500 });
  }

  // 3. Create user profile
  const { error: userError } = await supabase.from('users').insert({
    id: authUser.user.id,
    school_id: school.id,
    full_name: adminFullName,
    email: adminEmail,
    role: 'admin',
  });

  if (userError) {
    return NextResponse.json({ message: 'Failed to create user profile: ' + userError.message }, { status: 500 });
  }

  // 4. Create default departments
  await supabase.from('departments').insert([
    { school_id: school.id, name: 'Library', clearance_order: 1 },
    { school_id: school.id, name: 'Finance', clearance_order: 5 },
    { school_id: school.id, name: 'Discipline', clearance_order: 6 },
  ]);

  return NextResponse.redirect(new URL('/login?registered=true', request.url));
}

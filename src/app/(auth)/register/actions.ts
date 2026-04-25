'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { schoolRegistrationSchema } from '@/lib/validators/school';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function registerSchool(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const validatedFields = schoolRegistrationSchema.safeParse({
    schoolName: formData.get('schoolName'),
    poBox: formData.get('poBox'),
    email: formData.get('email'),
    schoolCode: formData.get('schoolCode'),
    adminFullName: formData.get('adminFullName'),
    adminEmail: formData.get('adminEmail'),
    adminPassword: formData.get('adminPassword'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors below.',
    };
  }

  const { schoolName, poBox, email, schoolCode, adminFullName, adminEmail, adminPassword } =
    validatedFields.data;

  // Create school
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
      return { message: 'A school with this email or school code already exists.' };
    }
    return { message: 'Failed to create school.' };
  }

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: adminFullName, school_id: school.id },
  });

  if (authError) {
    await supabase.from('schools').delete().eq('id', school.id);
    return { message: 'Failed to create admin account.' };
  }

  // Create user profile
  await supabase.from('users').insert({
    id: authUser.user.id,
    school_id: school.id,
    full_name: adminFullName,
    email: adminEmail,
    role: 'admin',
  });

  // Default departments
  await supabase.from('departments').insert([
    { school_id: school.id, name: 'Library', clearance_order: 1 },
    { school_id: school.id, name: 'Finance', clearance_order: 5 },
    { school_id: school.id, name: 'Discipline', clearance_order: 6 },
  ]);

  revalidatePath('/login');
  redirect('/login?registered=true');
}

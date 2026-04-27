import { createClient } from '@/lib/supabase/client';

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
  details?: any
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
  if (!userData?.school_id) return;

  await supabase.from('audit_logs').insert({
    school_id: userData.school_id,
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_data: details || {},
  });
}

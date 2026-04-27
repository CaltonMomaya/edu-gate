import { createClient } from '@/lib/supabase/client';

export async function logAction(
  schoolId: string,
  action: string,
  entityType: string,
  entityId: string,
  newData?: any,
  oldData?: any
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('audit_logs').insert({
    school_id: schoolId,
    user_id: user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_data: newData || null,
    old_data: oldData || null,
  });
}

import { createClient } from '@/lib/supabase/client';

export async function logAction(
  schoolId: string,
  action: string,
  entityType: string,
  entityId: string,
  newData?: any,
  oldData?: any
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // entityId must be a valid UUID
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId);
    
    const { error } = await supabase.from('audit_logs').insert({
      school_id: schoolId,
      user_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: isValidUuid ? entityId : null,
      new_data: newData || null,
      old_data: oldData || null,
    });

    if (error) {
      console.error('Audit log error:', error);
    }
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

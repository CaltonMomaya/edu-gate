import { createClient } from '@/lib/supabase/client';

export async function createNotification(
  schoolId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'error' = 'info',
  link?: string,
  userId?: string
) {
  const supabase = createClient();
  await supabase.from('notifications').insert({
    school_id: schoolId,
    user_id: userId || null,
    title,
    message,
    type,
    link: link || null,
  });
}

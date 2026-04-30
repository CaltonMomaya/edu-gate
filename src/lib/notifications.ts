import { createClient } from '@/lib/supabase/client';

export async function shouldSendNotification(
  schoolId: string,
  type: 'payment' | 'leave' | 'overdue' | 'exam',
  channel: 'email' | 'sms'
): Promise<boolean> {
  const supabase = createClient();
  const { data: school } = await supabase.from('schools').select('notification_prefs').eq('id', schoolId).single();
  
  if (!school?.notification_prefs) return true; // Default: send if no prefs set
  
  const key = `${type}${channel === 'email' ? 'Email' : 'Sms'}`;
  const pref = school.notification_prefs[key];
  
  // If preference is not set, default to true
  return pref !== false;
}

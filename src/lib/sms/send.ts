// SMS utility - Africa's Talking integration

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSms(
  to: string,
  message: string,
  schoolId: string,
  supabaseClient: any
): Promise<SmsResult> {
  try {
    const apiKey = process.env.AFRICAS_TALKING_API_KEY;
    const username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';

    // If no API key configured, simulate
    if (!apiKey) {
      console.log('📱 [SIMULATED] To:', to, 'Msg:', message);
      return { success: true, messageId: 'simulated' };
    }

    // Dynamic import to avoid initialization error
    const AfricasTalking = (await import('africastalking')).default;
    const africastalking = AfricasTalking({ apiKey, username });
    const sms = africastalking.SMS;

    let formattedPhone = to.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '+254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('+')) formattedPhone = '+254' + formattedPhone;

    const result = await sms.send({
      to: [formattedPhone],
      message: message,
      from: 'EDU-GATE',
    });

    // Deduct credit
    const { data: school } = await supabaseClient
      .from('schools').select('sms_balance').eq('id', schoolId).single();
    if (school && school.sms_balance > 0) {
      await supabaseClient.from('schools').update({ sms_balance: school.sms_balance - 1 }).eq('id', schoolId);
    }

    // Log
    await supabaseClient.from('sms_log').insert({
      school_id: schoolId, recipient_phone: formattedPhone, message,
      message_type: 'leave_exit', status: 'sent', credits_used: 1,
    });

    return { success: true, messageId: result.SMSMessageData?.Recipients?.[0]?.messageId };
  } catch (error: any) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
}

export function formatLeaveMessage(
  studentName: string, guardianName: string, exitTime: string,
  returnDate: string, returnTime: string, schoolName: string
): string {
  return `${studentName} released from ${schoolName}. Pickup: ${guardianName}. Return: ${returnDate} at ${returnTime}. Exit by: ${exitTime}. - EDU GATE`;
}

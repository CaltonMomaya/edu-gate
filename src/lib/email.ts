interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log('📧 Sending email to:', to);

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Email sent! ID:', result.messageId);
    } else {
      console.error('❌ Failed:', result.error);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

export function paymentReceiptEmail(
  studentName: string, amount: number, balance: number, date: string, schoolName: string
): string {
  return `<div style="font-family:Arial;max-width:600px;margin:0 auto"><div style="background:#059669;padding:20px;text-align:center"><h1 style="color:white;margin:0">Payment Receipt</h1></div><div style="padding:20px;background:#f9fafb"><h2>${schoolName}</h2><table style="width:100%"><tr><td>Student</td><td style="font-weight:bold">${studentName}</td></tr><tr><td>Amount</td><td style="font-weight:bold;color:#059669">KES ${amount.toLocaleString()}</td></tr><tr><td>Date</td><td>${date}</td></tr><tr><td>Balance</td><td style="font-weight:bold;color:${balance > 0 ? '#dc2626' : '#059669'}">KES ${balance.toLocaleString()}</td></tr></table></div></div>`;
}

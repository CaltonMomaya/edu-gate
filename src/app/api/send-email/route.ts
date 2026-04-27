import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { to, subject, html } = await request.json();
  const apiKey = "re_bv1bqFy5_URQpWeEUF9tfpz7j4F1A7jLD";

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to,
        subject,
        html,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

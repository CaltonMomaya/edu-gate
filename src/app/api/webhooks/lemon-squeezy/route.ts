import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json();
  const event = body.meta?.event_name;

  // Verify webhook signature (optional but recommended)
  // const signature = request.headers.get('x-signature');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event) {
      case 'order_created': {
        const orderData = body.data;
        const schoolId = orderData.attributes?.custom_data?.school_id;
        const status = orderData.attributes?.status;
        const total = orderData.attributes?.total;
        const planName = orderData.attributes?.variant_name?.toLowerCase();

        if (status === 'paid' && schoolId) {
          // Calculate expiry (1 month or 1 year)
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 1);

          // Update school subscription
          await supabase.from('schools').update({
            subscription_status: 'active',
            subscription_plan_id: planName,
            subscription_expires_at: expiryDate.toISOString(),
          }).eq('id', schoolId);

          // Create invoice record
          await supabase.from('invoices').insert({
            school_id: schoolId,
            amount: total / 100, // Convert cents to KES
            status: 'paid',
            payment_provider: 'lemon_squeezy',
            provider_invoice_id: orderData.id,
          });

          console.log(`✅ Subscription activated for school ${schoolId}: ${planName}`);
        }
        break;
      }

      case 'subscription_cancelled': {
        const subData = body.data;
        const schoolId = subData.attributes?.custom_data?.school_id;

        if (schoolId) {
          await supabase.from('schools').update({
            subscription_status: 'cancelled',
          }).eq('id', schoolId);

          console.log(`❌ Subscription cancelled for school ${schoolId}`);
        }
        break;
      }

      case 'subscription_expired': {
        const subData = body.data;
        const schoolId = subData.attributes?.custom_data?.school_id;

        if (schoolId) {
          await supabase.from('schools').update({
            subscription_status: 'suspended',
          }).eq('id', schoolId);

          console.log(`⏰ Subscription expired for school ${schoolId}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

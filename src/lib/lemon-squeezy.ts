import { LemonsqueezyClient } from '@lemonsqueezy/lemonsqueezy.js';

const apiKey = process.env.LEMON_SQUEEZY_API_KEY || '';

export function getClient() {
  if (!apiKey) {
    console.warn('Lemon Squeezy API key not configured');
    return null;
  }
  return new LemonsqueezyClient(apiKey);
}

export async function createCheckout(
  storeId: string,
  variantId: string,
  email: string,
  schoolId: string
) {
  const client = getClient();
  if (!client) return null;

  try {
    const checkout = await client.createCheckout({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: { school_id: schoolId },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/overview?subscribed=true`,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    });

    return checkout.data.attributes.url;
  } catch (error) {
    console.error('Checkout error:', error);
    return null;
  }
}

// Plan variant IDs from Lemon Squeezy dashboard
export const PLAN_VARIANTS: Record<string, string> = {
  starter: process.env.LEMON_SQUEEZY_STARTER_VARIANT || '',
  standard: process.env.LEMON_SQUEEZY_STANDARD_VARIANT || '',
  premium: process.env.LEMON_SQUEEZY_PREMIUM_VARIANT || '',
};

export const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID || '';

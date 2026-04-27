// Lemon Squeezy integration (coming when domain is purchased)
// Setup with: lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY! })

export async function createCheckout(planName: string, email: string, schoolId: string) {
  console.log('Checkout disabled - domain not yet configured');
  return null;
}

export const PLAN_VARIANTS: Record<string, string> = {};
export const STORE_ID = '';

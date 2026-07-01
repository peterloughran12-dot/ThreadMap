import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

// Constructed lazily (on first use inside a request) rather than at module
// load, so builds/deploys don't fail when STRIPE_SECRET_KEY isn't set yet.
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeClient;
}

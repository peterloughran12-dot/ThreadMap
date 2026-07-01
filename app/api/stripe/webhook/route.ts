import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';

function planFromPriceId(priceId: string | undefined): 'pro' | 'team' | 'free' {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return 'team';
  return 'free';
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const teamId = session.metadata?.team_id;
      if (teamId && session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const plan = planFromPriceId(subscription.items.data[0]?.price.id);
        await supabase
          .from('teams')
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', teamId);
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      const plan =
        subscription.status === 'active' || subscription.status === 'trialing'
          ? planFromPriceId(subscription.items.data[0]?.price.id)
          : 'free';
      await supabase
        .from('teams')
        .update({ plan, stripe_subscription_id: subscription.id })
        .eq('stripe_customer_id', subscription.customer as string);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('teams')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('stripe_customer_id', subscription.customer as string);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

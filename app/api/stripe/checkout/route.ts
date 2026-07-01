import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Not in the original spec's API list, but required to get a team from
// free -> paid before the Stripe customer portal has anything to manage.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { plan } = await request.json(); // 'pro' | 'team'
  const priceId =
    plan === 'team' ? process.env.STRIPE_TEAM_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id, email')
    .eq('id', user.id)
    .single();

  const { data: team } = await supabase
    .from('teams')
    .select('id, stripe_customer_id')
    .eq('id', profile?.team_id)
    .single();

  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: team.stripe_customer_id ?? undefined,
    customer_email: team.stripe_customer_id ? undefined : profile?.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
    metadata: { team_id: team.id },
  });

  return NextResponse.json({ url: session.url });
}

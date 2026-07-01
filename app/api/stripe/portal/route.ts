import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single();
  const { data: team } = await supabase
    .from('teams')
    .select('stripe_customer_id')
    .eq('id', profile?.team_id)
    .single();

  if (!team?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found for this team.' }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: team.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
  });

  return NextResponse.redirect(session.url);
}

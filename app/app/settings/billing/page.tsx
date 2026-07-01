import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BillingClient from '@/components/BillingClient';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: ['1 user', '3 accounts', 'No AI briefings'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49/mo',
    features: ['1 user', 'Unlimited accounts', 'Unlimited AI briefings'],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$149/mo',
    features: ['Up to 5 users', 'Unlimited accounts', 'Unlimited AI briefings'],
  },
];

export default async function BillingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('team_id').eq('id', user?.id).single();
  const { data: team } = await supabase
    .from('teams')
    .select('plan, stripe_customer_id')
    .eq('id', profile?.team_id)
    .single();

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <Link href="/app/settings" className="text-sm text-text-muted hover:text-text-primary">
        ← Back to settings
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold">Billing</h1>
        <p className="text-sm text-text-muted mt-1">
          You&rsquo;re currently on the <span className="capitalize text-text-primary">{team?.plan}</span>{' '}
          plan.
        </p>
      </div>

      <BillingClient currentPlan={(team?.plan as string) ?? 'free'} hasStripeCustomer={!!team?.stripe_customer_id} plans={PLANS} />
    </div>
  );
}

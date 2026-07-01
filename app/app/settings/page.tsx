import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from '@/components/SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('users').select('team_id, role').eq('id', user?.id).single();
  const { data: team } = await supabase.from('teams').select('*').eq('id', profile?.team_id).single();
  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('team_id', profile?.team_id);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage your team and billing.</p>
      </div>

      <SettingsClient team={team!} members={members ?? []} isOwner={profile?.role === 'owner'} />

      <div className="card p-5">
        <h2 className="font-display text-base font-bold mb-1">Billing</h2>
        <p className="text-sm text-text-muted mb-4">
          You&rsquo;re on the <span className="capitalize text-text-primary">{team?.plan}</span> plan.
        </p>
        <Link href="/app/settings/billing" className="btn-primary inline-flex">
          Manage billing
        </Link>
      </div>
    </div>
  );
}

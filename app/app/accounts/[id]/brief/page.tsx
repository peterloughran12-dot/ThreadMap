import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { READY_FOR_BRIEFING_THRESHOLD } from '@/lib/constants';
import BriefingClient from '@/components/BriefingClient';

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase.from('accounts').select('*').eq('id', id).single();
  if (!account) notFound();

  const { data: functions } = await supabase
    .from('account_functions')
    .select('id, is_dm_node, intel_notes ( is_complete )')
    .eq('account_id', id);

  const nonDm = (functions ?? []).filter((f: any) => !f.is_dm_node);
  const complete = nonDm.filter((f: any) => f.intel_notes?.[0]?.is_complete).length;
  const ready = nonDm.length > 0 && complete / nonDm.length >= READY_FOR_BRIEFING_THRESHOLD;

  const { data: briefings } = await supabase
    .from('briefings')
    .select('*')
    .eq('account_id', id)
    .order('created_at', { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('team_id').eq('id', user?.id).maybeSingle();
  const { data: team } = await supabase.from('teams').select('plan').eq('id', profile?.team_id).maybeSingle();

  return (
    <BriefingClient
      account={account}
      ready={ready}
      progress={nonDm.length ? complete / nonDm.length : 0}
      briefings={briefings ?? []}
      teamPlan={(team?.plan as string) ?? 'free'}
    />
  );
}

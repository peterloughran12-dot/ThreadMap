import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RoadmapClient from '@/components/RoadmapClient';

export default async function AccountRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: account } = await supabase.from('accounts').select('*').eq('id', id).single();
  if (!account) notFound();

  const { data: functions } = await supabase
    .from('account_functions')
    .select(
      `id, account_id, function_name, emoji, sequence_order, is_dm_node,
       contacts ( id, function_id, full_name, job_title, email, phone, linkedin_url, source, status, last_contacted_at,
         pain_point, current_solution, budget, change_driver, quirk, created_at ),
       intel_notes ( id, function_id, content, is_complete, updated_at )`
    )
    .eq('account_id', id)
    .order('sequence_order', { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('team_id').eq('id', user?.id).maybeSingle();
  const { data: team } = await supabase
    .from('teams')
    .select('plan')
    .eq('id', profile?.team_id)
    .maybeSingle();

  return (
    <RoadmapClient
      account={account}
      functions={(functions ?? []) as any}
      teamPlan={(team?.plan as string) ?? 'free'}
    />
  );
}

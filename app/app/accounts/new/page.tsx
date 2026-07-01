'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { INDUSTRIES, FUNCTION_PRESETS, FUNCTION_EMOJI, DM_NODE_EMOJI } from '@/lib/constants';

export default function NewAccountPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState<(typeof INDUSTRIES)[number]>('Manufacturing');
  const [website, setWebsite] = useState('');
  const [dmRole, setDmRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in.');
      setSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single();

    if (!profile?.team_id) {
      setError(
        `Could not find your team. ${profileError ? `(${profileError.code}: ${profileError.message})` : '(no row returned)'}`
      );
      setSubmitting(false);
      return;
    }

    // Enforce free-plan account limit client-side (RLS/webhooks are source of truth server-side).
    const { data: team } = await supabase.from('teams').select('plan').eq('id', profile.team_id).single();
    if (team?.plan === 'free') {
      const { count } = await supabase
        .from('accounts')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', profile.team_id);
      if ((count ?? 0) >= 3) {
        setError('Free plan is limited to 3 accounts. Upgrade in Settings to add more.');
        setSubmitting(false);
        return;
      }
    }

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        team_id: profile.team_id,
        owner_id: user.id,
        company_name: companyName,
        industry,
        website: website || null,
        dm_role: dmRole,
      })
      .select('id')
      .single();

    if (accountError || !account) {
      setError(accountError?.message || 'Failed to create account.');
      setSubmitting(false);
      return;
    }

    const presets = FUNCTION_PRESETS[industry];
    const rows = [
      ...presets.map((name, i) => ({
        account_id: account.id,
        function_name: name,
        emoji: FUNCTION_EMOJI[name] ?? null,
        sequence_order: i,
        is_dm_node: false,
      })),
      {
        account_id: account.id,
        function_name: dmRole || 'Decision Maker',
        emoji: DM_NODE_EMOJI,
        sequence_order: presets.length,
        is_dm_node: true,
      },
    ];

    const { error: functionsError } = await supabase.from('account_functions').insert(rows);
    if (functionsError) {
      setError(functionsError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/app/accounts/${account.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-1">New account</h1>
      <p className="text-sm text-text-muted mb-6">
        We&rsquo;ll map the org into functions based on the industry you pick.
      </p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Company name</label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Manufacturing Co."
            className="input"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as (typeof INDUSTRIES)[number])}
            className="input"
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-faint mt-1.5">
            Maps to: {FUNCTION_PRESETS[industry].join(' · ')} · Decision maker
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Website (optional)</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="acme.com"
            className="input"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Decision-maker role</label>
          <input
            required
            value={dmRole}
            onChange={(e) => setDmRole(e.target.value)}
            placeholder="VP of Operations"
            className="input"
          />
        </div>

        {error && (
          <div className="rounded-control border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

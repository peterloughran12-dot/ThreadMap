'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RELEVANT_FUNCTIONS, HIERARCHY_LEVEL_COUNTS, buildHierarchyLevels } from '@/lib/constants';

export default function NewAccountPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [vertical, setVertical] = useState<(typeof RELEVANT_FUNCTIONS)[number]>('EHS');
  const [customVertical, setCustomVertical] = useState('');
  const [levelCount, setLevelCount] = useState<(typeof HIERARCHY_LEVEL_COUNTS)[number]>(4);
  const [website, setWebsite] = useState('');
  const [dmRole, setDmRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveVertical = vertical === 'Custom' ? customVertical.trim() : vertical;
  const levels = effectiveVertical ? buildHierarchyLevels(effectiveVertical, levelCount, dmRole) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveVertical) {
      setError('Enter the function/vertical you’re selling into.');
      return;
    }
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
        relevant_function: effectiveVertical,
        website: website || null,
        dm_role: levels[levels.length - 1]?.name || dmRole,
      })
      .select('id')
      .single();

    if (accountError || !account) {
      setError(accountError?.message || 'Failed to create account.');
      setSubmitting(false);
      return;
    }

    const rows = levels.map((level, i) => ({
      account_id: account.id,
      function_name: level.name,
      emoji: level.emoji,
      sequence_order: i,
      is_dm_node: level.isDm,
    }));

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
        We&rsquo;ll map the reporting chain for the function you&rsquo;re selling into, bottom-up to the
        decision maker &mdash; not unrelated departments this deal won&rsquo;t touch.
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
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Relevant function (what you&rsquo;re selling into)
          </label>
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value as (typeof RELEVANT_FUNCTIONS)[number])}
            className="input"
          >
            {RELEVANT_FUNCTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {vertical === 'Custom' && (
            <input
              required
              value={customVertical}
              onChange={(e) => setCustomVertical(e.target.value)}
              placeholder="e.g. Sustainability Reporting"
              className="input mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Levels in the chain</label>
          <select
            value={levelCount}
            onChange={(e) => setLevelCount(Number(e.target.value) as (typeof HIERARCHY_LEVEL_COUNTS)[number])}
            className="input"
          >
            {HIERARCHY_LEVEL_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-faint mt-1.5">
            Maps to: {levels.map((l) => l.name).join(' → ')}
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
          <label className="block text-xs font-medium text-text-muted mb-1.5">Decision-maker&rsquo;s exact title</label>
          <input
            value={dmRole}
            onChange={(e) => setDmRole(e.target.value)}
            placeholder={effectiveVertical ? `VP of ${effectiveVertical}` : 'VP of Operations'}
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

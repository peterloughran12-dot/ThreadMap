import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { AccountWithProgress } from '@/lib/types';
import AccountListClient from '@/components/AccountListClient';

export default async function AccountsPage() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from('accounts')
    .select(
      `id, team_id, owner_id, company_name, relevant_function, website, dm_role, status, created_at, updated_at,
       account_functions ( id, is_dm_node, intel_notes ( is_complete ) )`
    )
    .order('updated_at', { ascending: false });

  const withProgress: AccountWithProgress[] = (accounts ?? []).map((a: any) => {
    const nonDmFunctions = (a.account_functions ?? []).filter((f: any) => !f.is_dm_node);
    const complete = nonDmFunctions.filter((f: any) =>
      (f.intel_notes ?? []).some((n: any) => n.is_complete)
    ).length;
    const total = nonDmFunctions.length;
    return {
      id: a.id,
      team_id: a.team_id,
      owner_id: a.owner_id,
      company_name: a.company_name,
      relevant_function: a.relevant_function,
      website: a.website,
      dm_role: a.dm_role,
      status: a.status,
      created_at: a.created_at,
      updated_at: a.updated_at,
      progress: total > 0 ? complete / total : 0,
      totalFunctions: total,
      completeFunctions: complete,
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-text-muted mt-1">Your mapped target companies.</p>
        </div>
        <Link href="/app/accounts/new" className="btn-primary">
          + New account
        </Link>
      </div>

      <AccountListClient accounts={withProgress} />
    </div>
  );
}

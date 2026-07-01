'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import type { AccountWithProgress } from '@/lib/types';

const STATUS_FILTERS = ['all', 'active', 'won', 'lost', 'paused'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-indigo/15 text-indigo',
  won: 'bg-green/15 text-green',
  lost: 'bg-red/15 text-red',
  paused: 'bg-text-faint/20 text-text-muted',
};

type SortKey = 'recent' | 'progress' | 'name';

export default function AccountListClient({ accounts }: { accounts: AccountWithProgress[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('recent');

  const filtered = useMemo(() => {
    let list = accounts;
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((a) => a.company_name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === 'recent') {
      sorted.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    } else if (sort === 'progress') {
      sorted.sort((a, b) => a.progress - b.progress);
    } else {
      sorted.sort((a, b) => a.company_name.localeCompare(b.company_name));
    }
    return sorted;
  }, [accounts, query, statusFilter, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company name…"
          className="input max-w-xs"
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'pill border capitalize transition-colors',
                statusFilter === s
                  ? 'border-indigo bg-indigo/15 text-indigo'
                  : 'border-border text-text-muted hover:text-text-primary'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="input max-w-[200px] ml-auto"
        >
          <option value="recent">Recently updated</option>
          <option value="progress">Progress (needs work)</option>
          <option value="name">Company name</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasAny={accounts.length > 0} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <Link key={a.id} href={`/app/accounts/${a.id}`} className="card-hover p-5 block">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display text-base font-bold truncate pr-2">{a.company_name}</h3>
                <span className={clsx('pill shrink-0', STATUS_COLORS[a.status])}>{a.status}</span>
              </div>
              <p className="text-xs text-text-muted mb-4">{a.industry || 'No industry set'}</p>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Progress</span>
                  <span className="font-mono">{Math.round(a.progress * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-pill bg-surface-elevated overflow-hidden">
                  <div
                    className="h-full rounded-pill bg-indigo transition-all"
                    style={{ width: `${Math.round(a.progress * 100)}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-text-faint truncate">DM: {a.dm_role}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-card border border-dashed border-border p-12 text-center">
      <p className="text-text-muted mb-4">
        {hasAny ? 'No accounts match your filters.' : 'You haven\u2019t mapped any accounts yet.'}
      </p>
      {!hasAny && (
        <Link href="/app/accounts/new" className="btn-primary inline-flex">
          Map your first account
        </Link>
      )}
    </div>
  );
}

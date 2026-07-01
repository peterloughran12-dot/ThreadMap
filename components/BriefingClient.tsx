'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Account, Briefing } from '@/lib/types';

export default function BriefingClient({
  account,
  ready,
  progress,
  briefings,
  teamPlan,
}: {
  account: Account;
  ready: boolean;
  progress: number;
  briefings: Briefing[];
  teamPlan: string;
}) {
  const [history, setHistory] = useState(briefings);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const latest = history[0];

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      setHistory([data.briefing, ...history]);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!latest) return;
    await navigator.clipboard.writeText(latest.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!ready) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link href={`/app/accounts/${account.id}`} className="text-sm text-text-muted hover:text-text-primary">
          ← Back to roadmap
        </Link>
        <div className="card p-10 text-center mt-4">
          <h1 className="font-display text-xl font-bold mb-2">Not ready yet</h1>
          <p className="text-sm text-text-muted mb-4">
            {account.company_name} is {Math.round(progress * 100)}% mapped. Reach 60% function completion to
            unlock the DM briefing.
          </p>
          <Link href={`/app/accounts/${account.id}`} className="btn-primary inline-flex">
            Continue mapping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Link href={`/app/accounts/${account.id}`} className="text-sm text-text-muted hover:text-text-primary">
        ← Back to roadmap
      </Link>

      <div className="flex items-start justify-between mt-4 mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{account.company_name}</h1>
          <p className="text-sm text-text-muted mt-1">
            Briefing for approaching: <span className="text-text-primary">{account.dm_role}</span>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {latest && (
            <button onClick={handleCopy} className="btn-ghost">
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          )}
          <button onClick={handleGenerate} disabled={generating} className="btn-gold">
            {generating ? 'Generating…' : latest ? 'Regenerate' : 'Generate briefing'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-control border border-red/30 bg-red/10 px-4 py-3 text-sm text-red mb-4">
          {error}
          {teamPlan === 'free' && (
            <>
              {' '}
              <Link href="/app/settings/billing" className="underline">
                Upgrade to Pro
              </Link>
            </>
          )}
        </div>
      )}

      {generating && (
        <div className="card p-10 text-center text-text-muted mb-4">Writing the briefing…</div>
      )}

      {!generating && latest && (
        <article className="card p-6 mb-6">
          <p className="text-xs text-text-faint font-mono mb-4">
            Generated {new Date(latest.created_at).toLocaleString()}
          </p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary font-body">
            {latest.content}
          </div>
        </article>
      )}

      {!generating && !latest && (
        <div className="card p-10 text-center text-text-muted mb-6">
          No briefing yet. Generate one from the intel you&rsquo;ve captured.
        </div>
      )}

      {history.length > 1 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
            Previous briefings
          </h2>
          <ul className="space-y-2">
            {history.slice(1).map((b) => (
              <li key={b.id} className="card p-4">
                <p className="text-xs text-text-faint font-mono mb-2">
                  {new Date(b.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-text-muted line-clamp-2">{b.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

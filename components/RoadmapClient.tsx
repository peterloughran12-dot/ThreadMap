'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import type { Account, AccountFunction, Contact, IntelNote } from '@/lib/types';
import { READY_FOR_BRIEFING_THRESHOLD, computeFunctionState } from '@/lib/constants';
import FunctionDetailPanel from '@/components/FunctionDetailPanel';
import ProgressRail from '@/components/ProgressRail';

export type FunctionWithData = AccountFunction & {
  contacts: Contact[];
  intel_notes: IntelNote[];
};

export default function RoadmapClient({
  account,
  functions,
  teamPlan,
}: {
  account: Account;
  functions: FunctionWithData[];
  teamPlan: string;
}) {
  const router = useRouter();
  const nonDm = functions.filter((f) => !f.is_dm_node);
  const dmNode = functions.find((f) => f.is_dm_node);

  const [selectedId, setSelectedId] = useState<string | null>(nonDm[0]?.id ?? dmNode?.id ?? null);
  const selected = functions.find((f) => f.id === selectedId) ?? null;

  const { completeCount, progress, ready } = useMemo(() => {
    const complete = nonDm.filter((f) => f.intel_notes?.[0]?.is_complete).length;
    const total = nonDm.length || 1;
    const p = complete / total;
    return { completeCount: complete, progress: p, ready: p >= READY_FOR_BRIEFING_THRESHOLD };
  }, [nonDm]);

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold">{account.company_name}</h1>
            <span className="pill border border-border text-text-muted">{account.relevant_function}</span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Approaching: <span className="text-text-primary">{account.dm_role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-text-muted mb-1">Progress</div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-28 rounded-pill bg-surface-elevated overflow-hidden">
                <div
                  className="h-full rounded-pill bg-indigo transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-text-muted">{Math.round(progress * 100)}%</span>
            </div>
          </div>
          {ready ? (
            <button
              onClick={() => router.push(`/app/accounts/${account.id}/brief`)}
              className="btn-gold"
            >
              Generate briefing
            </button>
          ) : null}
        </div>
      </div>

      {/* Thread row */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex items-center min-w-max px-1">
          {nonDm.map((f, i) => (
            <div key={f.id} className="flex items-center">
              <FunctionNodeButton
                fn={f}
                selected={f.id === selectedId}
                onClick={() => setSelectedId(f.id)}
              />
              {i < nonDm.length - 1 && <div className="h-px w-8 bg-border shrink-0" />}
            </div>
          ))}
          {dmNode && (
            <>
              <div className="h-px w-8 bg-border shrink-0" />
              <DmNodeButton
                fn={dmNode}
                unlocked={ready}
                selected={dmNode.id === selectedId}
                onClick={() => ready && setSelectedId(dmNode.id)}
              />
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {selected ? (
          <FunctionDetailPanel
            key={selected.id}
            accountId={account.id}
            fn={selected}
            onChanged={() => router.refresh()}
          />
        ) : (
          <div className="card p-12 text-center text-text-muted">Select a function to get started.</div>
        )}

        <ProgressRail
          functions={functions}
          selectedFunctionName={selected?.function_name}
          completeCount={completeCount}
          totalCount={nonDm.length}
          ready={ready}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}

function FunctionNodeButton({
  fn,
  selected,
  onClick,
}: {
  fn: FunctionWithData;
  selected: boolean;
  onClick: () => void;
}) {
  const intel = fn.intel_notes?.[0];
  const state = computeFunctionState((fn.contacts?.length ?? 0) > 0, !!intel?.is_complete);

  const stateStyles: Record<string, string> = {
    empty: 'bg-surface border-border text-text-faint',
    in_progress: 'bg-gold/10 border-gold/50 text-gold',
    complete: 'bg-green/10 border-green/50 text-green',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-card border-2 transition-all',
        stateStyles[state],
        selected && 'outline outline-2 outline-offset-2 outline-indigo'
      )}
    >
      <span className="text-xl leading-none mb-1">{fn.emoji}</span>
      <span className="text-[10px] font-medium text-center leading-tight px-1 text-text-primary">
        {fn.function_name}
      </span>
    </button>
  );
}

function DmNodeButton({
  fn,
  unlocked,
  selected,
  onClick,
}: {
  fn: FunctionWithData;
  unlocked: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
      title={unlocked ? fn.function_name : 'Unlocks at 60% complete'}
      className={clsx(
        'shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-card border-2 transition-all',
        unlocked
          ? 'bg-gold/15 border-gold text-gold animate-pulse-ring'
          : 'bg-surface border-border text-text-faint cursor-not-allowed opacity-60',
        selected && 'outline outline-2 outline-offset-2 outline-indigo'
      )}
    >
      <span className="text-2xl leading-none mb-1">{fn.emoji}</span>
      <span className="text-[10px] font-medium text-center leading-tight px-1">
        {unlocked ? fn.function_name : 'Locked'}
      </span>
    </button>
  );
}

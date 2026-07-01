'use client';

import clsx from 'clsx';
import { QUESTION_BANK, computeFunctionState } from '@/lib/constants';
import type { FunctionWithData } from '@/components/RoadmapClient';

const STATE_DOT: Record<string, string> = {
  empty: 'bg-text-faint',
  in_progress: 'bg-gold',
  complete: 'bg-green',
};

export default function ProgressRail({
  functions,
  selectedFunctionName,
  completeCount,
  totalCount,
  ready,
  onSelect,
}: {
  functions: FunctionWithData[];
  selectedFunctionName?: string;
  completeCount: number;
  totalCount: number;
  ready: boolean;
  onSelect: (id: string) => void;
}) {
  const questions = selectedFunctionName ? QUESTION_BANK[selectedFunctionName] : undefined;
  const remaining = Math.max(0, Math.ceil(totalCount * 0.6) - completeCount);

  return (
    <aside className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>Functions complete</span>
          <span className="font-mono">
            {completeCount}/{totalCount}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-pill bg-surface-elevated overflow-hidden mb-3">
          <div
            className="h-full rounded-pill bg-indigo transition-all"
            style={{ width: `${totalCount ? Math.round((completeCount / totalCount) * 100) : 0}%` }}
          />
        </div>
        <p className="text-xs text-text-muted">
          {ready
            ? 'Briefing unlocked \u2014 you have enough intel to approach the DM.'
            : `${remaining} more function${remaining === 1 ? '' : 's'} to unlock the DM briefing.`}
        </p>
      </div>

      {questions && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
            Questions to ask &mdash; {selectedFunctionName}
          </h3>
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q} className="text-sm text-text-primary leading-snug flex gap-2">
                <span className="text-indigo shrink-0">&bull;</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">Functions</h3>
        <ul className="space-y-1">
          {functions.map((f) => {
            const intel = f.intel_notes;
            const state = f.is_dm_node
              ? ready
                ? 'complete'
                : 'empty'
              : computeFunctionState((f.contacts?.length ?? 0) > 0, !!intel?.is_complete);
            return (
              <li key={f.id}>
                <button
                  onClick={() => onSelect(f.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 rounded-control px-2 py-1.5 text-sm text-left transition-colors',
                    f.function_name === selectedFunctionName
                      ? 'bg-indigo/15 text-indigo'
                      : 'text-text-muted hover:bg-surface-elevated hover:text-text-primary'
                  )}
                >
                  <span className={clsx('h-1.5 w-1.5 rounded-full shrink-0', STATE_DOT[state])} />
                  <span className="truncate">{f.function_name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

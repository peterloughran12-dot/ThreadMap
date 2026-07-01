'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CONTACT_SOURCES, matchSeniorityRank, suggestFunctionIndex } from '@/lib/constants';
import { parseCsv, mapRowsToContacts, type ParsedContactRow } from '@/lib/csv';

type FunctionOption = { id: string; function_name: string; is_dm_node: boolean };

type Row = ParsedContactRow & {
  include: boolean;
  functionId: string; // '' means unassigned / needs manual pick
};

export default function ImportAccountContactsModal({
  functions,
  onClose,
  onImported,
}: {
  // Must be pre-sorted bottom-up: non-DM rungs in order, DM node last.
  functions: FunctionOption[];
  onClose: () => void;
  onImported: () => void;
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState('');
  const [source, setSource] = useState<(typeof CONTACT_SOURCES)[number]>('ZoomInfo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nonDmFunctions = useMemo(() => functions.filter((f) => !f.is_dm_node), [functions]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);
    const text = await file.text();
    const parsed = mapRowsToContacts(parseCsv(text));
    if (parsed.length === 0) {
      setError("Couldn't find a name column in that file. Expected a header row with a Name (or First/Last Name) column.");
    }

    const withLevels = parsed.map((c) => {
      const rank = matchSeniorityRank(c.job_title);
      const index = suggestFunctionIndex(rank, nonDmFunctions.length);
      return {
        ...c,
        include: c.full_name.length > 0,
        functionId: index !== null ? functions[index]?.id ?? '' : '',
      };
    });
    setRows(withLevels);
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const includedCount = rows.filter((r) => r.include).length;
  const unassignedIncludedCount = rows.filter((r) => r.include && !r.functionId).length;

  async function handleImport() {
    const toInsert = rows
      .filter((r) => r.include && r.full_name && r.functionId)
      .map((r) => ({
        function_id: r.functionId,
        full_name: r.full_name,
        job_title: r.job_title || null,
        email: r.email || null,
        phone: r.phone || null,
        linkedin_url: r.linkedin_url || null,
        source,
      }));

    if (toInsert.length === 0) {
      setError('No contacts with a level assigned are selected to import.');
      return;
    }

    setSaving(true);
    setError('');
    const { error } = await supabase.from('contacts').insert(toInsert);
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    onImported();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl p-6 animate-fade-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-1">Import contacts for this account</h3>
        <p className="text-xs text-text-muted mb-4">
          Upload a ZoomInfo or Lusha export. Each contact&rsquo;s job title is matched to a level in
          this account&rsquo;s chain automatically &mdash; review and adjust before importing.
        </p>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">CSV file</label>
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="input" />
          {fileName && <p className="text-xs text-text-faint mt-1">{fileName}</p>}
        </div>

        <div className="mt-3">
          <label className="block text-xs font-medium text-text-muted mb-1.5">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as (typeof CONTACT_SOURCES)[number])}
            className="input"
          >
            {CONTACT_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {rows.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-text-muted mb-2">
              {includedCount} of {rows.length} rows will be imported
              {unassignedIncludedCount > 0 && (
                <span className="text-gold"> &middot; {unassignedIncludedCount} need a level picked</span>
              )}
            </p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-control border border-border bg-surface-elevated px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={() => updateRow(i, { include: !r.include })}
                  />
                  <span className="flex-1 min-w-0 truncate">
                    <span className="font-medium">{r.full_name || '(no name — will be skipped)'}</span>
                    {r.job_title && <span className="text-text-muted"> · {r.job_title}</span>}
                  </span>
                  <select
                    value={r.functionId}
                    onChange={(e) => updateRow(i, { functionId: e.target.value })}
                    className={`input !w-40 !py-1 shrink-0 ${!r.functionId ? 'border-gold' : ''}`}
                  >
                    <option value="">Pick a level…</option>
                    {functions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.function_name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red mt-3">{error}</p>}

        <div className="flex gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={saving || includedCount === 0}
            className="btn-primary flex-1"
          >
            {saving ? 'Importing…' : `Import ${includedCount || ''}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}

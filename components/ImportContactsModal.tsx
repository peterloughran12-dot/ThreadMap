'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CONTACT_SOURCES } from '@/lib/constants';
import { parseCsv, mapRowsToContacts, type ParsedContactRow } from '@/lib/csv';

type ParsedContact = ParsedContactRow & { include: boolean };

export default function ImportContactsModal({
  functionId,
  onClose,
  onImported,
}: {
  functionId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const supabase = createClient();
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [fileName, setFileName] = useState('');
  const [source, setSource] = useState<(typeof CONTACT_SOURCES)[number]>('ZoomInfo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    const parsed = mapRowsToContacts(rows).map((c) => ({ ...c, include: c.full_name.length > 0 }));
    if (parsed.length === 0) {
      setError("Couldn't find a name column in that file. Expected a header row with a Name (or First/Last Name) column.");
    }
    setContacts(parsed);
  }

  function toggleRow(i: number) {
    setContacts((prev) => prev.map((c, idx) => (idx === i ? { ...c, include: !c.include } : c)));
  }

  const includedCount = contacts.filter((c) => c.include).length;

  async function handleImport() {
    const toInsert = contacts
      .filter((c) => c.include && c.full_name)
      .map((c) => ({
        function_id: functionId,
        full_name: c.full_name,
        job_title: c.job_title || null,
        email: c.email || null,
        phone: c.phone || null,
        linkedin_url: c.linkedin_url || null,
        source,
      }));

    if (toInsert.length === 0) {
      setError('No contacts selected to import.');
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
        className="card w-full max-w-lg p-6 animate-fade-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-1">Import contacts</h3>
        <p className="text-xs text-text-muted mb-4">
          Export your search results from ZoomInfo or Lusha as a CSV, then upload it here.
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

        {contacts.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-text-muted mb-2">
              {includedCount} of {contacts.length} rows will be imported
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {contacts.map((c, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 rounded-control border border-border bg-surface-elevated px-3 py-2 text-xs"
                >
                  <input type="checkbox" checked={c.include} onChange={() => toggleRow(i)} />
                  <span className="flex-1 truncate">
                    <span className="font-medium">{c.full_name || '(no name — will be skipped)'}</span>
                    {c.job_title && <span className="text-text-muted"> · {c.job_title}</span>}
                  </span>
                </label>
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

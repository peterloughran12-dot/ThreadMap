'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CONTACT_SOURCES } from '@/lib/constants';

type ParsedContact = {
  full_name: string;
  job_title: string;
  email: string;
  linkedin_url: string;
  include: boolean;
};

// Header aliases seen in real ZoomInfo / Lusha CSV exports (column naming
// varies by export template, so we match loosely rather than requiring an
// exact layout).
const HEADER_ALIASES: Record<keyof Omit<ParsedContact, 'include'>, string[]> = {
  full_name: ['full name', 'name', 'contact name'],
  job_title: ['job title', 'title', 'position', 'job function'],
  email: ['email', 'email address', 'work email', 'business email'],
  linkedin_url: [
    'linkedin url',
    'linkedin',
    'person linkedin url',
    'linkedin contact profile url',
    'linkedin profile',
  ],
};
const FIRST_NAME_ALIASES = ['first name', 'firstname'];
const LAST_NAME_ALIASES = ['last name', 'lastname', 'surname'];

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Minimal CSV line parser: handles quoted fields (with embedded commas and
// escaped "" quotes), which plain split(',') would break on.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function mapRowsToContacts(rows: string[][]): ParsedContact[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);

  function findColumn(aliases: string[]) {
    return headers.findIndex((h) => aliases.includes(h));
  }

  const fullNameCol = findColumn(HEADER_ALIASES.full_name);
  const firstNameCol = findColumn(FIRST_NAME_ALIASES);
  const lastNameCol = findColumn(LAST_NAME_ALIASES);
  const jobTitleCol = findColumn(HEADER_ALIASES.job_title);
  const emailCol = findColumn(HEADER_ALIASES.email);
  const linkedinCol = findColumn(HEADER_ALIASES.linkedin_url);

  return rows.slice(1).map((r) => {
    let fullName = fullNameCol >= 0 ? (r[fullNameCol] ?? '').trim() : '';
    if (!fullName && (firstNameCol >= 0 || lastNameCol >= 0)) {
      fullName = [firstNameCol >= 0 ? r[firstNameCol] : '', lastNameCol >= 0 ? r[lastNameCol] : '']
        .filter(Boolean)
        .join(' ')
        .trim();
    }
    return {
      full_name: fullName,
      job_title: jobTitleCol >= 0 ? (r[jobTitleCol] ?? '').trim() : '',
      email: emailCol >= 0 ? (r[emailCol] ?? '').trim() : '',
      linkedin_url: linkedinCol >= 0 ? (r[linkedinCol] ?? '').trim() : '',
      include: fullName.length > 0,
    };
  });
}

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
    const parsed = mapRowsToContacts(rows);
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

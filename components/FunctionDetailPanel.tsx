'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import {
  CONTACT_CONTEXT_FIELDS,
  CONTACT_STATUS_LABEL,
  INTEL_COMPLETE_MIN_CHARS,
  NEXT_CONTACT_STATUS,
  computeFunctionState,
} from '@/lib/constants';
import type { Contact, ContactStatus } from '@/lib/types';
import type { FunctionWithData } from '@/components/RoadmapClient';
import AddContactModal from '@/components/AddContactModal';
import ImportContactsModal from '@/components/ImportContactsModal';
import ContactContextModal from '@/components/ContactContextModal';

function contextFilledCount(c: Contact) {
  return CONTACT_CONTEXT_FIELDS.filter((f) => (c[f.key] ?? '').trim().length > 0).length;
}

const STATUS_PILL: Record<ContactStatus, string> = {
  new: 'bg-text-faint/20 text-text-muted',
  contacted: 'bg-gold/15 text-gold',
  intel_captured: 'bg-green/15 text-green',
};

export default function FunctionDetailPanel({
  accountId,
  fn,
  onChanged,
}: {
  accountId: string;
  fn: FunctionWithData;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [contextContact, setContextContact] = useState<Contact | null>(null);
  const [note, setNote] = useState(fn.intel_notes?.content ?? '');
  const [savingNote, setSavingNote] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const state = computeFunctionState((fn.contacts?.length ?? 0) > 0, !!fn.intel_notes?.is_complete);
  const isComplete = note.trim().length >= INTEL_COMPLETE_MIN_CHARS;

  async function cycleStatus(contactId: string, current: ContactStatus) {
    const next = NEXT_CONTACT_STATUS[current];
    await supabase.from('contacts').update({ status: next }).eq('id', contactId);
    onChanged();
  }

  async function removeContact(contactId: string) {
    await supabase.from('contacts').delete().eq('id', contactId);
    onChanged();
  }

  async function saveNote() {
    setSavingNote(true);
    await supabase.from('intel_notes').upsert(
      {
        function_id: fn.id,
        content: note,
        is_complete: note.trim().length >= INTEL_COMPLETE_MIN_CHARS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'function_id' }
    );
    setSavingNote(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    onChanged();
  }

  async function handleGenerateSummary() {
    setSummarizing(true);
    setSummaryError('');
    try {
      const res = await fetch('/api/generate-function-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionId: fn.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error || 'Something went wrong.');
        return;
      }
      setNote(data.summary);
    } catch {
      setSummaryError('Network error. Try again.');
    } finally {
      setSummarizing(false);
    }
  }

  const contactsWithContext = (fn.contacts ?? []).filter((c) => contextFilledCount(c) > 0).length;

  const stateLabel: Record<string, { text: string; className: string }> = {
    empty: { text: 'Not started', className: 'bg-text-faint/20 text-text-muted' },
    in_progress: { text: 'In progress', className: 'bg-gold/15 text-gold' },
    complete: { text: 'Complete', className: 'bg-green/15 text-green' },
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{fn.emoji}</span>
          <h2 className="font-display text-lg font-bold">{fn.function_name}</h2>
        </div>
        <span className={clsx('pill', stateLabel[state].className)}>{stateLabel[state].text}</span>
      </div>

      {/* Contacts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Contacts ({fn.contacts?.length ?? 0})
          </h3>
          <div className="flex gap-2">
            <button onClick={() => setImportOpen(true)} className="btn-ghost !px-3 !py-1 text-xs">
              Import CSV
            </button>
            <button onClick={() => setModalOpen(true)} className="btn-ghost !px-3 !py-1 text-xs">
              + Add contact
            </button>
          </div>
        </div>

        {(fn.contacts?.length ?? 0) === 0 ? (
          <div className="rounded-control border border-dashed border-border p-6 text-center text-sm text-text-faint">
            No contacts yet. Pull them from ZoomInfo or Lusha.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fn.contacts.map((c) => (
              <div key={c.id} className="rounded-control border border-border bg-surface-elevated p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{c.full_name}</p>
                  <button
                    onClick={() => removeContact(c.id)}
                    className="text-text-faint hover:text-red text-xs shrink-0"
                    aria-label={`Remove ${c.full_name}`}
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-text-muted truncate mb-1">{c.job_title || 'No title'}</p>
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="block text-xs text-indigo hover:underline truncate mb-2"
                    title="Click to dial"
                  >
                    📞 {c.phone}
                  </a>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-text-faint">{c.source}</span>
                  <button
                    onClick={() => cycleStatus(c.id, c.status)}
                    className={clsx('pill text-[10px]', STATUS_PILL[c.status])}
                    title="Click to advance status"
                  >
                    {CONTACT_STATUS_LABEL[c.status]}
                  </button>
                </div>
                <button
                  onClick={() => setContextContact(c)}
                  className={clsx(
                    'w-full rounded-control border px-2 py-1 text-[11px] font-medium transition-colors',
                    contextFilledCount(c) > 0
                      ? 'border-green/30 bg-green/10 text-green hover:bg-green/15'
                      : 'border-border text-text-muted hover:bg-surface'
                  )}
                >
                  Context {contextFilledCount(c)}/{CONTACT_CONTEXT_FIELDS.length}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intel note */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Intel captured</h3>
          <span className={clsx('text-[11px] font-mono', isComplete ? 'text-green' : 'text-text-faint')}>
            {note.trim().length} chars {isComplete && '\u2713 complete'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs text-text-faint">
            {contactsWithContext > 0
              ? `Builds a summary from ${contactsWithContext} contact${contactsWithContext === 1 ? '' : 's'} with context captured.`
              : 'Fill in a contact’s Context first, then generate a summary from it.'}
          </span>
          <button
            onClick={handleGenerateSummary}
            disabled={summarizing || contactsWithContext === 0}
            className="btn-ghost !px-3 !py-1 text-xs shrink-0"
            title={contactsWithContext === 0 ? 'No contact context captured yet' : undefined}
          >
            {summarizing ? 'Writing…' : '✨ Generate from contacts'}
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          rows={6}
          placeholder="What did you learn from this function? Budget owner, pain points, timing, politics…"
          className="input resize-none font-body"
        />
        {summaryError && <p className="text-xs text-red mt-2">{summaryError}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-faint">
            {isComplete ? 'Marked complete once saved.' : `${INTEL_COMPLETE_MIN_CHARS} chars needed to mark complete.`}
          </span>
          <button onClick={saveNote} disabled={savingNote} className="btn-ghost !px-3 !py-1 text-xs">
            {savingNote ? 'Saving…' : savedFlash ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      {modalOpen && (
        <AddContactModal
          functionId={fn.id}
          onClose={() => setModalOpen(false)}
          onAdded={() => {
            setModalOpen(false);
            onChanged();
          }}
        />
      )}

      {importOpen && (
        <ImportContactsModal
          functionId={fn.id}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            onChanged();
          }}
        />
      )}

      {contextContact && (
        <ContactContextModal
          contact={contextContact}
          onClose={() => setContextContact(null)}
          onSaved={() => {
            setContextContact(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

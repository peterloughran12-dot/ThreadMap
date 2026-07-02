'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CONTACT_CONTEXT_FIELDS } from '@/lib/constants';
import type { Contact } from '@/lib/types';

export default function ContactContextModal({
  contact,
  onClose,
  onSaved,
}: {
  contact: Contact;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(CONTACT_CONTEXT_FIELDS.map((f) => [f.key, contact[f.key] ?? '']))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    const patch = Object.fromEntries(
      CONTACT_CONTEXT_FIELDS.map((f) => [f.key, values[f.key].trim() || null])
    );
    const { error } = await supabase.from('contacts').update(patch).eq('id', contact.id);
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6 animate-fade-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-1">{contact.full_name}</h3>
        <p className="text-xs text-text-muted mb-4">{contact.job_title || 'No title'}</p>

        <div className="space-y-3">
          {CONTACT_CONTEXT_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-text-muted mb-1.5">{f.label}</label>
              <textarea
                value={values[f.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                className="input resize-none font-body"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red mt-3">{error}</p>}

        <div className="flex gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CONTACT_SOURCES } from '@/lib/constants';

export default function AddContactModal({
  functionId,
  onClose,
  onAdded,
}: {
  functionId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [source, setSource] = useState<(typeof CONTACT_SOURCES)[number]>('ZoomInfo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await supabase.from('contacts').insert({
      function_id: functionId,
      full_name: fullName,
      job_title: jobTitle || null,
      email: email || null,
      linkedin_url: linkedinUrl || null,
      source,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    onAdded();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-4">Add contact</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Job title</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">LinkedIn URL (optional)</label>
            <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="input" />
          </div>
          <div>
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

          {error && <p className="text-xs text-red">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding…' : 'Add contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

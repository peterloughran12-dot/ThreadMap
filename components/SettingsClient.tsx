'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Team {
  id: string;
  name: string;
  plan: string;
}
interface Member {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export default function SettingsClient({
  team,
  members,
  isOwner,
}: {
  team: Team;
  members: Member[];
  isOwner: boolean;
}) {
  const supabase = createClient();
  const [teamName, setTeamName] = useState(team.name);
  const [savingName, setSavingName] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  async function saveTeamName() {
    setSavingName(true);
    await supabase.from('teams').update({ name: teamName }).eq('id', team.id);
    setSavingName(false);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteMessage('');
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    setInviteMessage(res.ok ? `Invite sent to ${inviteEmail}.` : data.error || 'Something went wrong.');
    if (res.ok) setInviteEmail('');
    setInviting(false);
  }

  return (
    <>
      <div className="card p-5">
        <h2 className="font-display text-base font-bold mb-3">Team</h2>
        <label className="block text-xs font-medium text-text-muted mb-1.5">Team name</label>
        <div className="flex gap-2">
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="input" />
          <button onClick={saveTeamName} disabled={savingName} className="btn-ghost shrink-0">
            {savingName ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
            Members ({members.length})
          </h3>
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm rounded-control bg-surface-elevated px-3 py-2">
                <span>{m.full_name || m.email}</span>
                <span className="text-xs text-text-faint capitalize">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>

        {isOwner && (
          <form onSubmit={sendInvite} className="mt-5 flex gap-2">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="input"
            />
            <button type="submit" disabled={inviting} className="btn-primary shrink-0">
              {inviting ? 'Sending…' : 'Invite'}
            </button>
          </form>
        )}
        {inviteMessage && <p className="text-xs text-text-muted mt-2">{inviteMessage}</p>}
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    const supabase = createClient();

    // Team + user records are created after the magic link is confirmed,
    // in the auth callback (see app/auth/callback). We pass the intended
    // name/team through as metadata so the callback can create the rows.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          full_name: fullName,
          team_name: teamName,
        },
      },
    });

    if (error) {
      setStatus('error');
      setError(error.message);
      return;
    }
    setStatus('sent');
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <Link href="/" className="block text-center mb-8 font-display text-2xl font-bold text-text-primary">
          Weev
        </Link>
        <div className="card p-6">
          <h1 className="font-display text-xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-text-muted mb-6">Free for up to 3 accounts. No card required.</p>

          {status === 'sent' ? (
            <div className="rounded-control border border-green/30 bg-green/10 px-4 py-3 text-sm text-green">
              Check {email} to confirm and finish setting up your team.
            </div>
          ) : (
            <>
              <button onClick={handleGoogle} className="btn-ghost w-full mb-4">
                Continue with Google
              </button>
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-text-faint">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Your name</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Blake"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Team / company name</label>
                  <input
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Acme Sales Team"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Work email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="input"
                  />
                </div>
                {status === 'error' && <p className="text-xs text-red">{error}</p>}
                <button type="submit" disabled={status === 'sending'} className="btn-primary w-full">
                  {status === 'sending' ? 'Sending link…' : 'Create account'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

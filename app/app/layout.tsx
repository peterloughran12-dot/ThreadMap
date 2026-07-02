import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, teams ( name, plan )')
    .eq('id', user.id)
    .maybeSingle();

  const team = profile?.teams as unknown as { name: string; plan: string } | null;

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/app/accounts" className="font-display text-lg font-bold">
              Weev
            </Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link
                href="/app/accounts"
                className="rounded-control px-3 py-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-primary"
              >
                Accounts
              </Link>
              <Link
                href="/app/settings"
                className="rounded-control px-3 py-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-primary"
              >
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {team && (
              <span className="pill border border-border text-text-muted">{team.plan} plan</span>
            )}
            <span className="hidden sm:inline text-sm text-text-muted">
              {profile?.full_name || profile?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

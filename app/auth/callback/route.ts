import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

// Handles both magic-link and OAuth redirects. On first login for a given
// auth user, creates the `teams` and `users` rows weev needs.
//
// This bootstrap step uses the service-role client (bypasses RLS) because a
// brand-new user isn't linked to a team yet, so the regular session client
// can't read back the team row it just inserted (teams' "select" RLS policy
// requires a users row that links to it, which doesn't exist until the
// insert right after this one).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/accounts';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const admin = createServiceRoleClient();
      const { data: existing } = await admin
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existing) {
        const meta = data.user.user_metadata ?? {};
        const teamName = meta.team_name || `${meta.full_name || data.user.email}'s Team`;

        const { data: team, error: teamError } = await admin
          .from('teams')
          .insert({ name: teamName, plan: 'free' })
          .select('id')
          .single();

        if (teamError || !team) {
          console.error('Failed to create team on signup', teamError);
          return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
        }

        const { error: userError } = await admin.from('users').insert({
          id: data.user.id,
          team_id: team.id,
          full_name: meta.full_name || meta.name || null,
          email: data.user.email,
          role: 'owner',
        });

        if (userError) {
          console.error('Failed to create user row on signup', userError);
          return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

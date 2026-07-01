import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handles both magic-link and OAuth redirects. On first login for a given
// auth user, creates the `teams` and `users` rows ThreadMap needs.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/accounts';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existing) {
        const meta = data.user.user_metadata ?? {};
        const teamName = meta.team_name || `${meta.full_name || data.user.email}'s Team`;

        const { data: team } = await supabase
          .from('teams')
          .insert({ name: teamName, plan: 'free' })
          .select('id')
          .single();

        await supabase.from('users').insert({
          id: data.user.id,
          team_id: team?.id,
          full_name: meta.full_name || meta.name || null,
          email: data.user.email,
          role: 'owner',
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, type Plan } from '@/lib/constants';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single();
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, plan')
    .eq('id', profile?.team_id)
    .single();

  if (!team) {
    return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
  }

  const limits = PLAN_LIMITS[team.plan as Plan] ?? PLAN_LIMITS.free;
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', team.id);

  if ((count ?? 0) >= limits.maxUsers) {
    return NextResponse.json(
      { error: `Your ${team.plan} plan supports up to ${limits.maxUsers} user(s). Upgrade to invite more.` },
      { status: 402 }
    );
  }

  // Supabase sends the actual magic link; Resend sends a friendly heads-up email.
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { team_name: team.name },
    },
  });

  try {
    await resend.emails.send({
      from: 'weev <onboarding@resend.dev>',
      to: email,
      subject: `You've been invited to ${team.name} on weev`,
      html: `<p>You've been invited to join <strong>${team.name}</strong> on weev. Check your inbox for a separate sign-in link to get started.</p>`,
    });
  } catch (err) {
    console.error('Resend invite email failed', err);
    // Non-fatal: the Supabase magic link email still went out.
  }

  return NextResponse.json({ success: true });
}

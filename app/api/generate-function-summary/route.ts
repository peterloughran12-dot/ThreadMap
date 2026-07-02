import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { functionId } = await request.json();
  if (!functionId) {
    return NextResponse.json({ error: 'functionId is required.' }, { status: 400 });
  }

  // Plan / paywall check (RLS scopes everything below to this user's team).
  const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single();
  const { data: team } = await supabase.from('teams').select('plan').eq('id', profile?.team_id).single();
  if (team?.plan === 'free') {
    return NextResponse.json(
      { error: 'AI summaries are a Pro feature. Upgrade your plan to generate one.', paywall: true },
      { status: 402 }
    );
  }

  const { data: fn, error: fnError } = await supabase
    .from('account_functions')
    .select(
      `id, function_name,
       accounts ( company_name ),
       contacts ( full_name, job_title, pain_point, current_solution, budget, change_driver, quirk )`
    )
    .eq('id', functionId)
    .single();

  if (fnError || !fn) {
    return NextResponse.json({ error: 'Function not found.' }, { status: 404 });
  }

  const contacts = ((fn as any).contacts ?? []).filter((c: any) =>
    [c.pain_point, c.current_solution, c.budget, c.change_driver, c.quirk].some((v) => v?.trim())
  );

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: 'No contact context captured yet for this function. Fill in at least one contact’s context first.' },
      { status: 400 }
    );
  }

  const contactBlock = contacts
    .map((c: any) => {
      const lines = [`${c.full_name}${c.job_title ? ` (${c.job_title})` : ''}`];
      if (c.pain_point?.trim()) lines.push(`Pain point: ${c.pain_point.trim()}`);
      if (c.current_solution?.trim()) lines.push(`Current solution: ${c.current_solution.trim()}`);
      if (c.budget?.trim()) lines.push(`Budget: ${c.budget.trim()}`);
      if (c.change_driver?.trim()) lines.push(`Change driver: ${c.change_driver.trim()}`);
      if (c.quirk?.trim()) lines.push(`Personal note: ${c.quirk.trim()}`);
      return lines.join('\n');
    })
    .join('\n\n');

  const companyName = (fn as any).accounts?.company_name ?? 'the account';

  const prompt = `You are a B2B sales strategist summarizing field intel for a rep's own reference.

A rep has been talking to contacts in the "${fn.function_name}" function at ${companyName}, and captured structured notes per contact:

${contactBlock}

---

Write a short narrative summary (3-5 sentences, one paragraph, no headers or bullet points) that synthesizes what's been learned across these contacts into a coherent picture of where this function stands — the real pain point, what's driving change, budget signals, and any tension or disagreement between contacts if their answers differ. Don't just restate each field — tell the story of this function the way you'd brief a colleague in 20 seconds. Be specific, use real detail from the notes, no filler.`;

  let summary: string;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    summary = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
  } catch (err) {
    console.error('Anthropic API error', err);
    return NextResponse.json({ error: 'Failed to generate summary. Try again.' }, { status: 502 });
  }

  return NextResponse.json({ summary });
}

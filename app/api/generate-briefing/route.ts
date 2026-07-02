import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { READY_FOR_BRIEFING_THRESHOLD } from '@/lib/constants';

export async function POST(request: Request) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { accountId } = await request.json();
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required.' }, { status: 400 });
  }

  // Load account (RLS ensures this user's team owns it).
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  // Plan / paywall check.
  const { data: profile } = await supabase.from('users').select('team_id').eq('id', user.id).single();
  const { data: team } = await supabase.from('teams').select('plan').eq('id', profile?.team_id).single();
  if (team?.plan === 'free') {
    return NextResponse.json(
      { error: 'AI briefings are a Pro feature. Upgrade your plan to generate one.', paywall: true },
      { status: 402 }
    );
  }

  // Load functions + contacts + intel.
  const { data: functions } = await supabase
    .from('account_functions')
    .select(
      `id, function_name, is_dm_node, sequence_order,
       contacts ( full_name, job_title, pain_point, current_solution, budget, change_driver, quirk ),
       intel_notes ( content, is_complete )`
    )
    .eq('account_id', accountId)
    .order('sequence_order', { ascending: true });

  const nonDm = (functions ?? []).filter((f: any) => !f.is_dm_node);
  const completeCount = nonDm.filter((f: any) => f.intel_notes?.is_complete).length;
  const ready = nonDm.length > 0 && completeCount / nonDm.length >= READY_FOR_BRIEFING_THRESHOLD;

  if (!ready) {
    return NextResponse.json(
      { error: 'This account is not ready for a briefing yet. Reach 60% function completion first.' },
      { status: 400 }
    );
  }

  const functionsBlock = nonDm
    .map((f: any) => {
      const contacts = f.contacts ?? [];
      const contactDetails = contacts.length
        ? contacts
            .map((c: any) => {
              const lines = [`- ${c.full_name}${c.job_title ? ` (${c.job_title})` : ''}`];
              if (c.pain_point?.trim()) lines.push(`  Pain point: ${c.pain_point.trim()}`);
              if (c.current_solution?.trim()) lines.push(`  Current solution: ${c.current_solution.trim()}`);
              if (c.budget?.trim()) lines.push(`  Budget: ${c.budget.trim()}`);
              if (c.change_driver?.trim()) lines.push(`  Change driver: ${c.change_driver.trim()}`);
              if (c.quirk?.trim()) lines.push(`  Personal/rapport note: ${c.quirk.trim()}`);
              return lines.join('\n');
            })
            .join('\n')
        : 'None logged';
      const intel = f.intel_notes?.content?.trim();
      return `FUNCTION: ${f.function_name}\nContacts spoken to:\n${contactDetails}\nGeneral intel captured for this function:\n${
        intel || 'No intel captured.'
      }`;
    })
    .join('\n\n---\n\n');

  const prompt = `You are an expert B2B enterprise sales strategist.

A salesperson has been mapping the ${account.relevant_function} buying committee at "${account.company_name}" and is preparing to approach the ${account.dm_role}.

Here is the intel they gathered across functions:

${functionsBlock}

---

Write a sharp, practical DM briefing document using exactly this structure:

1. ACCOUNT SNAPSHOT
2-3 sentences on what you now know about this business and their situation. Be specific — reference actual details from the intel.

2. REAL PAIN POINTS
The specific problems uncovered. Use actual detail from the intel, not generic statements. Quote real things contacts said if available.

3. INTERNAL CHAMPIONS
Who is most supportive and why. Who is the likely coach in this deal. Who to keep warm.

4. LIKELY OBJECTIONS
What the ${account.dm_role} will push back on — budget, timing, incumbent vendor, procurement process — and the specific response to each.

5. YOUR OPENING (first 60 seconds)
A specific, informed opening for the first conversation. Reference actual intel gathered. Make it clear you have done your homework. Do not use a generic pitch. Start with something that shows you know their situation.

6. WATCH OUTS
Political or structural risks. Who might block this deal. Timing considerations.

7. RAPPORT NOTES
Per-contact personal/relationship context worth keeping in mind for future conversations with each specific person — timing to avoid or lean into (leave, illness, someone leaving the company), and anything else that helps build a real relationship, not just close this one deal. Only include this section if there is at least one personal/rapport note in the intel above; omit it entirely otherwise.

Be direct, specific, and practical. No filler. This is a working sales document, not a presentation.`;

  let content: string;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    content = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');
  } catch (err) {
    console.error('Anthropic API error', err);
    return NextResponse.json({ error: 'Failed to generate briefing. Try again.' }, { status: 502 });
  }

  const { data: briefing, error: insertError } = await supabase
    .from('briefings')
    .insert({ account_id: accountId, generated_by: user.id, content })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ briefing });
}

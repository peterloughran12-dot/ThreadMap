# Weev

B2B account mapping tool. Map a target company into functions, add contacts,
capture intel per function, and generate an AI briefing once you're ready to
approach the decision maker.

## Stack

Next.js 14 (App Router) · Supabase (Postgres + Auth) · Tailwind CSS · Stripe ·
Anthropic Claude API · Resend

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run everything in `supabase/schema.sql`. This creates
   all tables and Row Level Security policies.
3. Under Authentication → Providers, enable **Email** (magic link) and
   **Google** OAuth if you want Google sign-in.
4. Under Authentication → URL Configuration, add
   `http://localhost:3000/auth/callback` (and your production URL's
   equivalent) as a redirect URL.

## 3. Set up Stripe

1. Create three Products/Prices in the Stripe dashboard: Pro ($49/mo) and
   Team ($149/mo). Copy their price IDs.
2. Create a webhook endpoint pointing at `/api/stripe/webhook` listening for:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
3. For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## 4. Set up Resend

Create an API key at resend.com. Used for team-invite emails (the actual
sign-in link comes from Supabase; Resend just sends a friendly heads-up).

## 5. Environment variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (keep secret, server-only) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks (or `stripe listen` output) |
| `STRIPE_PRO_PRICE_ID` | Stripe → Products → Pro price |
| `STRIPE_TEAM_PRICE_ID` | Stripe → Products → Team price |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |

## 6. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Notes

- The Anthropic API key is only ever used server-side, in
  `app/api/generate-briefing/route.ts`.
- Free-plan accounts are capped at 3 accounts and can't generate briefings —
  both are enforced server-side (RLS-adjacent checks in the API routes),
  not just in the UI.
- `app/api/stripe/checkout` isn't in the original spec's API list but is
  needed to move a team from Free to a paid plan before the Stripe customer
  portal (which only manages *existing* subscriptions) has anything to show.
- Deploy to Vercel: push this repo, import it in Vercel, add the same env
  vars, and point your Stripe webhook and Supabase redirect URL at the
  production domain.

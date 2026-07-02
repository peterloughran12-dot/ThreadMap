-- weev database schema
-- Run this in the Supabase SQL editor.

-- Teams (one per company/subscription)
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free', -- free | pro | team
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Users (belong to a team)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  full_name text,
  email text not null,
  role text not null default 'member', -- owner | admin | member
  created_at timestamptz default now()
);

-- Accounts (target companies)
create table accounts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  owner_id uuid references users(id),
  company_name text not null,
  relevant_function text, -- the vertical being sold into (e.g. "EHS"), not the target company's industry
  website text,
  dm_role text not null default 'Head of Department',
  status text not null default 'active', -- active | won | lost | paused
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Functions (Finance, Operations, EHS etc — nodes on the roadmap)
create table account_functions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  function_name text not null,
  emoji text,
  sequence_order int not null default 0,
  is_dm_node boolean default false,
  created_at timestamptz default now()
);

-- Contacts (people within each function)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  function_id uuid references account_functions(id) on delete cascade,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  linkedin_url text,
  source text, -- ZoomInfo | Lusha | LinkedIn | Referral
  status text not null default 'new', -- new | contacted | intel_captured
  last_contacted_at timestamptz,
  -- Call-context template: the standard questions a BDR builds up on this
  -- specific person over however many calls it takes. One evolving answer
  -- per field, not a per-call log.
  pain_point text,
  current_solution text,
  budget text,
  change_driver text,
  quirk text, -- personal/relationship context - leave coming up, out sick, etc.
  created_at timestamptz default now()
);

-- Intel notes (one per function — what the rep learned)
create table intel_notes (
  id uuid primary key default gen_random_uuid(),
  function_id uuid references account_functions(id) on delete cascade unique,
  content text,
  is_complete boolean default false,
  updated_at timestamptz default now()
);

-- Activity log (calls, emails, LinkedIn messages)
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  user_id uuid references users(id),
  activity_type text not null, -- call | email | linkedin | meeting | note
  notes text,
  occurred_at timestamptz default now()
);

-- Briefings (AI-generated DM approach documents)
create table briefings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  generated_by uuid references users(id),
  content text not null,
  created_at timestamptz default now()
);

-- Row Level Security policies
alter table teams enable row level security;
alter table users enable row level security;
alter table accounts enable row level security;
alter table account_functions enable row level security;
alter table contacts enable row level security;
alter table intel_notes enable row level security;
alter table activity_log enable row level security;
alter table briefings enable row level security;

-- Looks up the current user's team_id. This has to be a SECURITY DEFINER
-- function rather than an inline subquery: every policy below needs "what
-- team is this user on", and a plain subquery like
-- `select team_id from users where id = auth.uid()` re-triggers users'
-- own RLS policies while evaluating itself, which Postgres detects as
-- infinite recursion (error 42P17) and refuses to run at all - for every
-- table below, not just users. SECURITY DEFINER runs this lookup with the
-- function owner's privileges, bypassing RLS for just this one read.
create or replace function public.current_user_team_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select team_id from public.users where id = auth.uid()
$$;

-- Users can only see their own team's data
create policy "team_isolation" on accounts for all using (
  team_id = public.current_user_team_id()
);
create policy "team_isolation" on account_functions for all using (
  account_id in (select id from accounts where team_id = public.current_user_team_id())
);
create policy "team_isolation" on contacts for all using (
  function_id in (select id from account_functions where account_id in (
    select id from accounts where team_id = public.current_user_team_id()
  ))
);
create policy "team_isolation" on intel_notes for all using (
  function_id in (select id from account_functions where account_id in (
    select id from accounts where team_id = public.current_user_team_id()
  ))
);
create policy "team_isolation" on activity_log for all using (
  contact_id in (select id from contacts where function_id in (
    select id from account_functions where account_id in (
      select id from accounts where team_id = public.current_user_team_id()
    )
  ))
);
create policy "team_isolation" on briefings for all using (
  account_id in (select id from accounts where team_id = public.current_user_team_id())
);

-- A user can always read their own row directly (a plain, non-recursive
-- base case - doesn't need the function above).
create policy "own_user_select" on users for select using (id = auth.uid());

-- Users can see other members of their own team (needed for team settings page),
-- and can update their own row.
create policy "own_team_select" on users for select using (
  team_id = public.current_user_team_id()
);
create policy "own_user_update" on users for update using (id = auth.uid());
create policy "own_user_insert" on users for insert with check (id = auth.uid());

-- A user can read/update their own team's row.
create policy "team_select" on teams for select using (
  id = public.current_user_team_id()
);
create policy "team_update" on teams for update using (
  id = public.current_user_team_id()
);
create policy "team_insert" on teams for insert with check (true);

-- Keep updated_at fresh on accounts
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger accounts_set_updated_at
before update on accounts
for each row execute procedure set_updated_at();

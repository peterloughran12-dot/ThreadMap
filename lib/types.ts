export type AccountStatus = 'active' | 'won' | 'lost' | 'paused';
export type ContactStatus = 'new' | 'contacted' | 'intel_captured';

export interface Account {
  id: string;
  team_id: string;
  owner_id: string | null;
  company_name: string;
  relevant_function: string | null;
  website: string | null;
  dm_role: string;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface AccountFunction {
  id: string;
  account_id: string;
  function_name: string;
  emoji: string | null;
  sequence_order: number;
  is_dm_node: boolean;
}

export interface Contact {
  id: string;
  function_id: string;
  full_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  source: string | null;
  status: ContactStatus;
  last_contacted_at: string | null;
  created_at: string;
}

export interface IntelNote {
  id: string;
  function_id: string;
  content: string | null;
  is_complete: boolean;
  updated_at: string;
}

export interface Briefing {
  id: string;
  account_id: string;
  generated_by: string | null;
  content: string;
  created_at: string;
}

export interface AccountWithProgress extends Account {
  progress: number; // 0-1
  totalFunctions: number;
  completeFunctions: number;
}

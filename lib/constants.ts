export const INDUSTRIES = [
  'Manufacturing',
  'SaaS / Tech',
  'Financial Services',
  'Healthcare',
  'Retail',
  'Custom',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const FUNCTION_PRESETS: Record<Industry, string[]> = {
  Manufacturing: ['Finance', 'Operations', 'EHS', 'Procurement', 'IT / Tech', 'HR'],
  'SaaS / Tech': ['Finance', 'IT / Tech', 'Operations', 'Legal', 'Marketing', 'Procurement'],
  'Financial Services': ['Finance', 'Operations', 'Legal', 'IT / Tech', 'HR', 'Risk'],
  Healthcare: ['Operations', 'Finance', 'HR', 'Legal', 'IT / Tech', 'Procurement'],
  Retail: ['Operations', 'Finance', 'Marketing', 'Procurement', 'IT / Tech', 'HR'],
  Custom: ['Finance', 'Operations', 'IT / Tech', 'Procurement', 'HR'],
};

export const FUNCTION_EMOJI: Record<string, string> = {
  Finance: '💰',
  'IT / Tech': '💻',
  Operations: '⚙️',
  Procurement: '📋',
  EHS: '🦺',
  HR: '👥',
  Legal: '⚖️',
  Marketing: '📣',
  Risk: '🛡️',
  'C-Suite': '🏢',
};

export const DM_NODE_EMOJI = '🎯';

export const QUESTION_BANK: Record<string, string[]> = {
  Finance: [
    'Who owns the budget for this?',
    'What does approval look like above $X?',
    'When does the current contract expire?',
    'What is this problem costing you today?',
  ],
  'IT / Tech': [
    'What does the current tech stack look like?',
    'Who needs to sign off on integrations?',
    'How long does procurement typically take?',
    'Any compliance or security requirements?',
  ],
  Operations: [
    'Where is the biggest friction day to day?',
    'What does a bad week look like operationally?',
    'Who owns process improvement?',
    'How many contractors do you manage on site?',
  ],
  Procurement: [
    'Are you running an RFP?',
    'When does the current contract expire?',
    'How many vendors are you evaluating?',
    'What does your approval process look like?',
  ],
  EHS: [
    'How do you manage contractor inductions today?',
    'Who owns compliance reporting?',
    'Have there been any recent incidents or fines?',
    'What is the single biggest on-site risk?',
  ],
  HR: [
    'How many people does this affect?',
    'Who owns the employee experience here?',
    'How are training rollouts handled?',
    'What does change management look like?',
  ],
  Legal: [
    'Any regulatory constraints we should know about?',
    'Who reviews vendor agreements?',
    'What does contract approval look like?',
    'Any upcoming legislation affecting the business?',
  ],
  Marketing: [
    'Who owns the marketing tech stack?',
    'How are agency relationships managed?',
    'What KPIs is the team measured on?',
    'What is the biggest campaign pain point?',
  ],
  Risk: [
    'What keeps the risk team up at night?',
    'How is risk reported to the board?',
    'What was the last significant risk event?',
    'Who owns third-party risk management?',
  ],
};

export const CONTACT_SOURCES = ['ZoomInfo', 'Lusha', 'LinkedIn', 'Referral', 'Cold outreach'] as const;

export const CONTACT_STATUSES = ['new', 'contacted', 'intel_captured'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const NEXT_CONTACT_STATUS: Record<ContactStatus, ContactStatus> = {
  new: 'contacted',
  contacted: 'intel_captured',
  intel_captured: 'new',
};

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  intel_captured: 'Intel captured',
};

export const ACCOUNT_STATUSES = ['active', 'won', 'lost', 'paused'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const INTEL_COMPLETE_MIN_CHARS = 30;
export const READY_FOR_BRIEFING_THRESHOLD = 0.6; // 60%

export const PLAN_LIMITS = {
  free: { maxAccounts: 3, aiBriefings: false, maxUsers: 1 },
  pro: { maxAccounts: Infinity, aiBriefings: true, maxUsers: 1 },
  team: { maxAccounts: Infinity, aiBriefings: true, maxUsers: 5 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

// Function node visual states, derived from contacts + intel note.
export type FunctionState = 'empty' | 'in_progress' | 'complete';

export function computeFunctionState(
  hasContacts: boolean,
  intelComplete: boolean
): FunctionState {
  if (intelComplete) return 'complete';
  if (hasContacts) return 'in_progress';
  return 'empty';
}

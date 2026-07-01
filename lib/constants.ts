// The function/vertical you're actually selling into (e.g. EHS software
// buyers), not the target company's overall industry. A roadmap maps the
// reporting chain within this one vertical, bottom-up to its decision maker
// -- not unrelated departments like Finance or HR that a specific deal may
// never touch.
export const RELEVANT_FUNCTIONS = [
  'EHS',
  'IT & Security',
  'Finance & Accounting',
  'HR & Payroll',
  'Procurement',
  'Legal & Compliance',
  'Marketing',
  'Operations',
  'Custom',
] as const;

export type RelevantFunction = (typeof RELEVANT_FUNCTIONS)[number];

export const RELEVANT_FUNCTION_EMOJI: Record<string, string> = {
  EHS: '🦺',
  'IT & Security': '💻',
  'Finance & Accounting': '💰',
  'HR & Payroll': '👥',
  Procurement: '📋',
  'Legal & Compliance': '⚖️',
  Marketing: '📣',
  Operations: '⚙️',
};
const DEFAULT_VERTICAL_EMOJI = '🏢';

export const DM_NODE_EMOJI = '🎯';

export const HIERARCHY_LEVEL_COUNTS = [2, 3, 4, 5] as const;

// Bottom-up seniority ladder for the levels below the decision maker. Sliced
// from the front for shorter chains, so a 2-level chain is just
// [Coordinator, <DM role>], a 5-level chain uses all four rungs below the DM.
const HIERARCHY_RUNGS = ['Coordinator', 'Supervisor', 'Manager', 'Director'];

export function buildHierarchyLevels(
  vertical: string,
  levelCount: number,
  dmRole: string
): { name: string; emoji: string; isDm: boolean }[] {
  const emoji = RELEVANT_FUNCTION_EMOJI[vertical] ?? DEFAULT_VERTICAL_EMOJI;
  const rungCount = Math.max(0, levelCount - 1);
  const rungs = HIERARCHY_RUNGS.slice(0, rungCount).map((rung) => ({
    name: `${vertical} ${rung}`,
    emoji,
    isDm: false,
  }));
  return [...rungs, { name: dmRole || `VP of ${vertical}`, emoji: DM_NODE_EMOJI, isDm: true }];
}

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

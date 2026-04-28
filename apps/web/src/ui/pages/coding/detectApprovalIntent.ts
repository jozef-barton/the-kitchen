export type ApprovalCategory = 'destructive' | 'modification' | 'install' | 'network' | 'generic';

export interface ApprovalIntent {
  isApprovalRequest: boolean;
  category: ApprovalCategory;
  question: string;
  affirmativeText: string;
  negativeText: string;
}

const DESTRUCTIVE_PATTERNS = [
  /\bdelete\b.{0,40}\b(file|folder|director|repo|database|table|record)/i,
  /\bremove\b.{0,40}\b(file|folder|director|repo|database|table|record)/i,
  /\bdrop\b.{0,20}\btable/i,
  /\btruncate\b.{0,20}\btable/i,
  /\brm\s+-rf?\b/i,
  /\bwipe\b.{0,30}\b(disk|drive|partition|database|data)/i,
  /\bpurge\b.{0,30}\b(data|file|record|database)/i,
  /\bformat\b.{0,20}\b(disk|drive|partition)/i,
  /\bpermanently\s+(delete|remove|destroy)/i,
  /\birreversible/i,
];

const MODIFICATION_PATTERNS = [
  /\bmodify\b/i,
  /\bedit\b/i,
  /\bupdate\b/i,
  /\breplace\b/i,
  /\bchange\b/i,
  /\bpatch\b/i,
  /\brefactor\b/i,
  /\bapply.{0,30}\bedit/i,
  /\bwrite.{0,30}\bfile/i,
];

const INSTALL_PATTERNS = [
  /\binstall\b/i,
  /\bnpm\s+install\b/i,
  /\bpip\s+install\b/i,
  /\byarn\s+add\b/i,
  /\bpnpm\s+add\b/i,
  /\bbrew\s+install\b/i,
  /\bapt.get\s+install\b/i,
  /\bdependenc/i,
  /\bpackage\b/i,
];

const NETWORK_PATTERNS = [
  /\bfetch\b/i,
  /\bdownload\b/i,
  /\brequest\b/i,
  /\bhttp/i,
  /\bapi\s+call/i,
  /\bnetwork/i,
  /\bcurl\b/i,
  /\bwget\b/i,
];

// Patterns that indicate this is actually a yes/no question to the user
const APPROVAL_QUESTION_PATTERNS = [
  /\?\s*$/,
  /\[y\/n\]/i,
  /\(yes\/no\)/i,
  /\bdo you want\b/i,
  /\bshould i\b/i,
  /\bshall i\b/i,
  /\bwould you like\b/i,
  /\bcan i\b/i,
  /\bmay i\b/i,
  /\bproceed\b/i,
  /\bconfirm\b/i,
  /\ballow\b/i,
  /\bpermission\b/i,
  /\bapprove\b/i,
];

function categorize(message: string): ApprovalCategory {
  if (DESTRUCTIVE_PATTERNS.some(p => p.test(message))) return 'destructive';
  if (INSTALL_PATTERNS.some(p => p.test(message))) return 'install';
  if (MODIFICATION_PATTERNS.some(p => p.test(message))) return 'modification';
  if (NETWORK_PATTERNS.some(p => p.test(message))) return 'network';
  return 'generic';
}

function extractQuestion(message: string): string {
  // Try to extract the last sentence that looks like a question
  const sentences = message.split(/(?<=[.!?])\s+/);
  for (let i = sentences.length - 1; i >= 0; i--) {
    const s = sentences[i]!.trim();
    if (s.endsWith('?') || /\[y\/n\]/i.test(s) || /yes\/no/i.test(s)) {
      return s;
    }
  }
  // Fall back to last non-empty line
  const lines = message.split('\n').filter(l => l.trim());
  return lines[lines.length - 1] ?? message;
}

export function detectApprovalIntent(message: string): ApprovalIntent {
  if (!message || message.trim().length === 0) {
    return {
      isApprovalRequest: false,
      category: 'generic',
      question: '',
      affirmativeText: 'Yes',
      negativeText: 'No',
    };
  }

  const isApprovalRequest = APPROVAL_QUESTION_PATTERNS.some(p => p.test(message));

  if (!isApprovalRequest) {
    return {
      isApprovalRequest: false,
      category: 'generic',
      question: '',
      affirmativeText: 'Yes',
      negativeText: 'No',
    };
  }

  const category = categorize(message);
  const question = extractQuestion(message);

  const labels: Record<ApprovalCategory, { affirmativeText: string; negativeText: string }> = {
    destructive: { affirmativeText: 'Delete anyway', negativeText: 'Keep it' },
    modification: { affirmativeText: 'Apply changes', negativeText: 'Skip' },
    install: { affirmativeText: 'Install', negativeText: 'Skip' },
    network: { affirmativeText: 'Allow request', negativeText: 'Block' },
    generic: { affirmativeText: 'Yes', negativeText: 'No' },
  };

  return {
    isApprovalRequest: true,
    category,
    question,
    ...labels[category],
  };
}

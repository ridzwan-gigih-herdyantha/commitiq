export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_NOTES_LENGTH = 5000;
export const MAX_CONVERSATION_TURNS = 20;

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|context)/i,
  /forget\s+(everything|all|previous|above|prior)/i,
  /disregard\s+(the\s+)?(system|previous|above|all\s+prior)/i,
  /override\s+(the\s+)?(system|previous)\s+(prompt|instructions?)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(a|an|if)\s+/i,
  /pretend\s+(to\s+be|you\s+are|that\s+you)/i,
  /new\s+(system\s+)?prompt\s*:/i,
  /\[system\]/i,
  /<\|system\|>/i,
  /<\|im_start\|>/i,
  /###\s*(system|instruction)/i,
  /---+\s*(system|instruction)/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
];

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

// Strip control characters, null bytes — keep printable + newlines/tabs
export function sanitizeInput(text: string, maxLength = MAX_MESSAGE_LENGTH): string {
  return text
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

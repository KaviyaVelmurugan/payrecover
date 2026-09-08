export type FailureCategory = 'payment_method_declined' | 'insufficient_funds' | 'expired_card' | 'technical_error' | 'risk_blocked';

export type RecoveryDecision = {
  eligible: boolean;
  recommendedMethod: 'upi' | 'card' | 'same_method' | null;
  timing: 'now' | 'later' | 'never';
  label: string;
  reason: string;
};

const decisions: Record<FailureCategory, RecoveryDecision> = {
  payment_method_declined: { eligible: true, recommendedMethod: 'upi', timing: 'now', label: 'Offer UPI now', reason: 'A different payment method avoids repeating the same declined card attempt.' },
  insufficient_funds: { eligible: true, recommendedMethod: 'upi', timing: 'later', label: 'Offer UPI or retry later', reason: 'The original account may not have enough funds, so offer another source or wait 24 hours.' },
  expired_card: { eligible: true, recommendedMethod: 'card', timing: 'now', label: 'Request a new card', reason: 'The expired card cannot succeed; collect a different card or offer UPI.' },
  technical_error: { eligible: true, recommendedMethod: 'same_method', timing: 'now', label: 'Retry safely now', reason: 'A temporary processor problem can be retried once with the same payment method.' },
  risk_blocked: { eligible: false, recommendedMethod: null, timing: 'never', label: 'Do not automate a retry', reason: 'Risk-related refusals require review and must not be bypassed with automated retries.' },
};

export function classifyFailure(reason?: string | null): FailureCategory {
  const value = reason?.toLowerCase() ?? '';
  if (/(fraud|risk|stolen|blocked)/.test(value)) return 'risk_blocked';
  if (/(insufficient|not enough|funds)/.test(value)) return 'insufficient_funds';
  if (/(expired|expiry)/.test(value)) return 'expired_card';
  if (/(timeout|technical|unavailable|error|network)/.test(value)) return 'technical_error';
  return 'payment_method_declined';
}

export function recommendRecovery(category: FailureCategory): RecoveryDecision {
  return decisions[category];
}

export const recoveryRules = Object.entries(decisions).map(([category, decision]) => ({ category: category as FailureCategory, ...decision }));

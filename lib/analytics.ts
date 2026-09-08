export const checkoutEventNames = [
  'store_viewed',
  'product_added',
  'checkout_started',
  'order_created',
  'payment_failed',
  'recovery_offered',
  'recovery_started',
  'payment_completed',
] as const;
export type CheckoutEventName = (typeof checkoutEventNames)[number];

export function assignRecoveryVariant(
  sessionId: string,
): 'control' | 'benefit_message' {
  let hash = 2166136261;
  for (const character of sessionId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2 === 0 ? 'control' : 'benefit_message';
}

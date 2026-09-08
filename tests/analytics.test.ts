import assert from 'node:assert/strict';
import test from 'node:test';
import { assignRecoveryVariant, checkoutEventNames } from '../lib/analytics.ts';

void test('assigns the same experiment variant to the same session', () => {
  const first = assignRecoveryVariant('shopper-session-42');
  assert.equal(assignRecoveryVariant('shopper-session-42'), first);
  assert.ok(first === 'control' || first === 'benefit_message');
});

void test('includes the complete measurable checkout journey', () => {
  assert.deepEqual(checkoutEventNames, [
    'store_viewed',
    'product_added',
    'checkout_started',
    'order_created',
    'payment_failed',
    'recovery_offered',
    'recovery_started',
    'payment_completed',
  ]);
});

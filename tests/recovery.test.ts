import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyFailure, recommendRecovery } from '../lib/recovery.ts';

void test('classifies common provider failure reasons', () => {
  assert.equal(classifyFailure('Not enough funds'), 'insufficient_funds');
  assert.equal(classifyFailure('Card expired'), 'expired_card');
  assert.equal(classifyFailure('Processor timeout'), 'technical_error');
  assert.equal(classifyFailure('Risk blocked'), 'risk_blocked');
  assert.equal(classifyFailure('Generic refusal'), 'payment_method_declined');
});

void test('never retries a risk-blocked payment automatically', () => {
  assert.deepEqual(recommendRecovery('risk_blocked'), {
    eligible: false,
    recommendedMethod: null,
    timing: 'never',
    label: 'Do not automate a retry',
    reason:
      'Risk-related refusals require review and must not be bypassed with automated retries.',
  });
});

void test('offers a different method after a normal decline', () => {
  const decision = recommendRecovery('payment_method_declined');
  assert.equal(decision.eligible, true);
  assert.equal(decision.recommendedMethod, 'upi');
  assert.equal(decision.timing, 'now');
});

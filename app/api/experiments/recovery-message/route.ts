import { assignRecoveryVariant } from '@/lib/analytics';

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('sessionId');
  if (!sessionId || sessionId.length > 100)
    return Response.json(
      { error: 'Valid session ID required.' },
      { status: 400 },
    );
  const variant = assignRecoveryVariant(sessionId);
  return Response.json({
    experiment: 'recovery_message_v1',
    variant,
    message:
      variant === 'benefit_message'
        ? 'Complete your order securely with UPI—no need to re-enter card details.'
        : 'Retry with UPI',
  });
}

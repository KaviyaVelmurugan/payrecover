import { getRawDb } from '@/db/raw';
import { checkoutEventNames, type CheckoutEventName } from '@/lib/analytics';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventName?: CheckoutEventName;
      sessionId?: string;
      orderId?: string;
      paymentMethod?: string;
      campaign?: string;
      experimentVariant?: string;
    };
    if (
      !body.eventName ||
      !checkoutEventNames.includes(body.eventName) ||
      !body.sessionId ||
      body.sessionId.length > 100
    )
      return Response.json(
        { error: 'Invalid analytics event.' },
        { status: 400 },
      );
    const clean = (value?: string) => value?.trim().slice(0, 100) || null;
    await getRawDb()
      .prepare(
        'INSERT INTO checkout_events (id, order_id, session_id, event_name, payment_method, campaign, experiment_variant, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        crypto.randomUUID(),
        clean(body.orderId),
        body.sessionId,
        body.eventName,
        clean(body.paymentMethod),
        clean(body.campaign) ?? 'direct',
        clean(body.experimentVariant),
        Math.floor(Date.now() / 1000),
      )
      .run();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('analytics_event_failed', error);
    return Response.json(
      { error: 'Event could not be recorded.' },
      { status: 500 },
    );
  }
}

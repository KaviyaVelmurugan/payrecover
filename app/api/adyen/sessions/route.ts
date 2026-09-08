import { getRawDb } from '@/db/raw';
import { getAdyenConfig } from '@/lib/adyen';

type OrderRow = { id: string; totalMinor: number; currency: string; status: string; customerEmail: string };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderId?: string };
    if (!body.orderId) return Response.json({ error: 'Order ID is required.' }, { status: 400 });
    const config = getAdyenConfig();
    if (!config.checkoutReady) return Response.json({ error: 'Adyen test checkout is not configured yet.', code: 'ADYEN_NOT_CONFIGURED' }, { status: 503 });

    const db = getRawDb();
    const order = await db.prepare('SELECT id, total_minor AS totalMinor, currency, status, customer_email AS customerEmail FROM orders WHERE id = ?').bind(body.orderId).first<OrderRow>();
    if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status === 'paid') return Response.json({ error: 'This order is already paid.' }, { status: 409 });

    const idempotencyKey = crypto.randomUUID();
    const origin = new URL(request.url).origin;
    const response = await fetch('https://checkout-test.adyen.com/v71/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': config.apiKey!, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        merchantAccount: config.merchantAccount,
        reference: order.id,
        returnUrl: `${origin}/?checkoutResult=returned&orderId=${encodeURIComponent(order.id)}`,
        amount: { currency: order.currency, value: order.totalMinor },
        countryCode: 'IN',
        shopperEmail: order.customerEmail,
        shopperReference: `payrecover-${order.id}`,
        channel: 'Web',
      }),
    });
    const session = await response.json() as { id?: string; sessionData?: string; message?: string; errorCode?: string };
    if (!response.ok || !session.id || !session.sessionData) {
      console.error('adyen_session_failed', response.status, session.errorCode);
      return Response.json({ error: session.message || 'Adyen could not create a checkout session.' }, { status: 502 });
    }

    const attemptId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await db.batch([
      db.prepare('INSERT INTO payment_attempts (id, order_id, provider, provider_reference, idempotency_key, method, amount_minor, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(attemptId, order.id, 'adyen', session.id, idempotencyKey, 'dropin', order.totalMinor, 'pending', now, now),
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind('payment_started', now, order.id),
    ]);
    return Response.json({ session: { id: session.id, sessionData: session.sessionData }, clientKey: config.clientKey, environment: 'test', attemptId });
  } catch (error) {
    console.error('adyen_session_error', error);
    return Response.json({ error: 'The Adyen session could not be started.' }, { status: 500 });
  }
}

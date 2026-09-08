import { getRawDb } from '@/db/raw';
import { getAdyenConfig, type AdyenNotification, verifyAdyenHmac } from '@/lib/adyen';

type NotificationEnvelope = { NotificationRequestItem?: AdyenNotification };

export async function POST(request: Request) {
  try {
    const config = getAdyenConfig();
    if (!config.webhookReady) return Response.json({ error: 'Webhook verification is not configured.' }, { status: 503 });
    const payload = await request.json() as { notificationItems?: NotificationEnvelope[] };
    const entries = payload.notificationItems ?? [];
    if (!entries.length) return Response.json({ error: 'No webhook items supplied.' }, { status: 400 });

    const verified: AdyenNotification[] = [];
    for (const envelope of entries) {
      const item = envelope.NotificationRequestItem;
      if (!item || !(await verifyAdyenHmac(item, config.hmacKey!))) return Response.json({ error: 'Invalid HMAC signature.' }, { status: 401 });
      if (!item.pspReference || !item.eventCode || !item.merchantReference) return Response.json({ error: 'Incomplete webhook item.' }, { status: 400 });
      verified.push(item);
    }

    const db = getRawDb();
    const now = Math.floor(Date.now() / 1000);
    for (const item of verified) {
      const existing = await db.prepare('SELECT id FROM webhook_events WHERE event_code = ? AND provider_reference = ?').bind(item.eventCode!, item.pspReference!).first();
      if (existing) continue;
      const authorised = item.eventCode === 'AUTHORISATION' && item.success === 'true';
      const refused = item.eventCode === 'AUTHORISATION' && item.success !== 'true';
      const statements = [
        db.prepare('INSERT INTO webhook_events (id, event_code, provider_reference, payload, hmac_verified, processed_at, received_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), item.eventCode!, item.pspReference!, JSON.stringify(item), 1, now, now),
      ];
      if (authorised || refused) {
        statements.push(db.prepare("UPDATE payment_attempts SET provider_reference = ?, method = COALESCE(?, method), status = ?, failure_category = ?, updated_at = ? WHERE id = (SELECT id FROM payment_attempts WHERE order_id = ? AND provider = 'adyen' ORDER BY created_at DESC LIMIT 1)").bind(item.pspReference!, item.paymentMethod ?? null, authorised ? 'authorised' : 'refused', refused ? 'payment_method_declined' : null, now, item.merchantReference!));
        statements.push(db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind(authorised ? 'paid' : 'failed', now, item.merchantReference!));
      }
      await db.batch(statements);
    }
    return new Response('[accepted]', { status: 202, headers: { 'Content-Type': 'text/plain' } });
  } catch (error) {
    console.error('adyen_webhook_error', error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

import { getRawDb } from '@/db/raw';
import { classifyFailure, type FailureCategory } from '@/lib/recovery';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderId?: string; method?: 'card' | 'upi'; outcome?: 'authorised' | 'refused'; failureCategory?: FailureCategory; recoveredFromAttemptId?: string };
    if (!body.orderId || !['card', 'upi'].includes(body.method ?? '') || !['authorised', 'refused'].includes(body.outcome ?? '')) return Response.json({ error: 'Invalid simulation request.' }, { status: 400 });
    const db = getRawDb();
    const order = await db.prepare('SELECT id, total_minor AS totalMinor, status FROM orders WHERE id = ?').bind(body.orderId).first<{ id: string; totalMinor: number; status: string }>();
    if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });
    if (order.status === 'paid') return Response.json({ error: 'This order is already paid.' }, { status: 409 });

    const attemptId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const orderStatus = body.outcome === 'authorised' ? 'paid' : 'failed';
    const failureCategory = body.outcome === 'refused' ? classifyFailure(body.failureCategory) : null;
    await db.batch([
      db.prepare('INSERT INTO payment_attempts (id, order_id, provider, idempotency_key, method, amount_minor, status, failure_category, recovered_from_attempt_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(attemptId, body.orderId, 'simulator', crypto.randomUUID(), body.method, order.totalMinor, body.outcome, failureCategory, body.recoveredFromAttemptId ?? null, now, now),
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind(orderStatus, now, body.orderId),
    ]);
    return Response.json({ attempt: { id: attemptId, orderId: body.orderId, method: body.method, status: body.outcome, recovered: Boolean(body.recoveredFromAttemptId) } });
  } catch (error) {
    console.error('payment_simulation_failed', error);
    return Response.json({ error: 'The payment simulation could not be completed.' }, { status: 500 });
  }
}

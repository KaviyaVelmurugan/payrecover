import { getRawDb } from '@/db/raw';

export async function GET() {
  try {
    const db = getRawDb();
    const [summary, recent] = await Promise.all([
      db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status = 'paid' THEN total_minor ELSE 0 END), 0) AS revenueMinor, COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failedOrders FROM orders`).first(),
      db.prepare(`SELECT p.id, p.order_id AS orderId, o.customer_name AS customer, p.method, p.amount_minor AS amountMinor, p.status, p.recovered_from_attempt_id AS recoveredFromAttemptId, p.created_at AS createdAt FROM payment_attempts p JOIN orders o ON o.id = p.order_id ORDER BY p.created_at DESC LIMIT 8`).all(),
    ]);
    const recovered = await db.prepare(`SELECT COUNT(*) AS recoveredOrders, COALESCE(SUM(amount_minor), 0) AS recoveredMinor FROM payment_attempts WHERE status = 'authorised' AND recovered_from_attempt_id IS NOT NULL`).first();
    return Response.json({ summary: { ...summary, ...recovered }, attempts: recent.results });
  } catch (error) {
    console.error('dashboard_load_failed', error);
    return Response.json({ error: 'Dashboard data is temporarily unavailable.' }, { status: 500 });
  }
}

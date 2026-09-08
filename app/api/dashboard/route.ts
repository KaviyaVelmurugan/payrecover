import { getRawDb } from '@/db/raw';

export async function GET() {
  try {
    const db = getRawDb();
    const [summary, recent, recovery, failures] = await Promise.all([
      db.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status = 'paid' THEN total_minor ELSE 0 END), 0) AS revenueMinor, COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failedOrders FROM orders`).first(),
      db.prepare(`SELECT p.id, p.order_id AS orderId, o.customer_name AS customer, p.method, p.amount_minor AS amountMinor, p.status, p.failure_category AS failureCategory, p.recovered_from_attempt_id AS recoveredFromAttemptId, p.created_at AS createdAt FROM payment_attempts p JOIN orders o ON o.id = p.order_id ORDER BY p.created_at DESC LIMIT 8`).all(),
      db.prepare(`SELECT COUNT(CASE WHEN recovered_from_attempt_id IS NOT NULL THEN 1 END) AS retryAttempts, COUNT(CASE WHEN recovered_from_attempt_id IS NOT NULL AND status = 'authorised' THEN 1 END) AS successfulRetries, COUNT(CASE WHEN status = 'refused' THEN 1 END) AS failedAttempts FROM payment_attempts`).first(),
      db.prepare(`SELECT failure_category AS category, COUNT(*) AS count FROM payment_attempts WHERE status = 'refused' AND failure_category IS NOT NULL GROUP BY failure_category ORDER BY count DESC`).all(),
    ]);
    const recovered = await db.prepare(`SELECT COUNT(*) AS recoveredOrders, COALESCE(SUM(amount_minor), 0) AS recoveredMinor FROM payment_attempts WHERE status = 'authorised' AND recovered_from_attempt_id IS NOT NULL`).first();
    return Response.json({ summary: { ...summary, ...recovered, ...recovery }, attempts: recent.results, failures: failures.results });
  } catch (error) {
    console.error('dashboard_load_failed', error);
    return Response.json({ error: 'Dashboard data is temporarily unavailable.' }, { status: 500 });
  }
}

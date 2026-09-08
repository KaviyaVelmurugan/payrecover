import { getRawDb } from '@/db/raw';

export async function GET() {
  try {
    const db = getRawDb();
    const [
      summary,
      recent,
      recovery,
      failures,
      funnel,
      campaigns,
      methods,
      experiments,
    ] = await Promise.all([
      db
        .prepare(
          `SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status = 'paid' THEN total_minor ELSE 0 END), 0) AS revenueMinor, COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failedOrders FROM orders`,
        )
        .first(),
      db
        .prepare(
          `SELECT p.id, p.order_id AS orderId, o.customer_name AS customer, p.method, p.amount_minor AS amountMinor, p.status, p.failure_category AS failureCategory, p.recovered_from_attempt_id AS recoveredFromAttemptId, p.created_at AS createdAt FROM payment_attempts p JOIN orders o ON o.id = p.order_id ORDER BY p.created_at DESC LIMIT 8`,
        )
        .all(),
      db
        .prepare(
          `SELECT COUNT(CASE WHEN recovered_from_attempt_id IS NOT NULL THEN 1 END) AS retryAttempts, COUNT(CASE WHEN recovered_from_attempt_id IS NOT NULL AND status = 'authorised' THEN 1 END) AS successfulRetries, COUNT(CASE WHEN status = 'refused' THEN 1 END) AS failedAttempts FROM payment_attempts`,
        )
        .first(),
      db
        .prepare(
          `SELECT failure_category AS category, COUNT(*) AS count FROM payment_attempts WHERE status = 'refused' AND failure_category IS NOT NULL GROUP BY failure_category ORDER BY count DESC`,
        )
        .all(),
      db
        .prepare(
          `SELECT event_name AS eventName, COUNT(DISTINCT session_id) AS sessions FROM checkout_events GROUP BY event_name`,
        )
        .all(),
      db
        .prepare(
          `SELECT COALESCE(campaign, 'direct') AS campaign, COUNT(*) AS orders, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paidOrders, COALESCE(SUM(CASE WHEN status = 'paid' THEN total_minor ELSE 0 END), 0) AS revenueMinor FROM orders GROUP BY COALESCE(campaign, 'direct') ORDER BY revenueMinor DESC LIMIT 6`,
        )
        .all(),
      db
        .prepare(
          `SELECT method, COUNT(*) AS attempts, SUM(CASE WHEN status = 'authorised' THEN 1 ELSE 0 END) AS authorised FROM payment_attempts GROUP BY method ORDER BY attempts DESC`,
        )
        .all(),
      db
        .prepare(
          `SELECT experiment_variant AS variant, COUNT(DISTINCT CASE WHEN event_name = 'recovery_offered' THEN session_id END) AS offered, COUNT(DISTINCT CASE WHEN event_name = 'recovery_started' THEN session_id END) AS started FROM checkout_events WHERE experiment_variant IS NOT NULL GROUP BY experiment_variant`,
        )
        .all(),
    ]);
    const recovered = await db
      .prepare(
        `SELECT COUNT(*) AS recoveredOrders, COALESCE(SUM(amount_minor), 0) AS recoveredMinor FROM payment_attempts WHERE status = 'authorised' AND recovered_from_attempt_id IS NOT NULL`,
      )
      .first();
    return Response.json({
      summary: { ...summary, ...recovered, ...recovery },
      attempts: recent.results,
      failures: failures.results,
      funnel: funnel.results,
      campaigns: campaigns.results,
      methods: methods.results,
      experiments: experiments.results,
    });
  } catch (error) {
    console.error('dashboard_load_failed', error);
    return Response.json(
      { error: 'Dashboard data is temporarily unavailable.' },
      { status: 500 },
    );
  }
}

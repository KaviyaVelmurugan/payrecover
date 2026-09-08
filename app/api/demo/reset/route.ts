import { getRawDb } from '@/db/raw';

export async function DELETE() {
  try {
    const db = getRawDb();
    await db.batch([
      db.prepare('DELETE FROM checkout_events'),
      db.prepare('DELETE FROM webhook_events'),
      db.prepare('DELETE FROM payment_attempts'),
      db.prepare('DELETE FROM order_items'),
      db.prepare('DELETE FROM orders'),
    ]);
    return Response.json({ reset: true });
  } catch (error) {
    console.error('demo_reset_failed', error);
    return Response.json(
      { error: 'Demo data could not be reset.' },
      { status: 500 },
    );
  }
}

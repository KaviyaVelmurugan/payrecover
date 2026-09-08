import { getRawDb } from '@/db/raw';
import { classifyFailure, recommendRecovery } from '@/lib/recovery';

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get('orderId');
  if (!orderId) return Response.json({ error: 'Order ID is required.' }, { status: 400 });
  const latest = await getRawDb().prepare('SELECT method, status, failure_category AS failureCategory FROM payment_attempts WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').bind(orderId).first<{ method: string; status: string; failureCategory: string | null }>();
  if (!latest || latest.status !== 'refused') return Response.json({ eligible: false, timing: 'never', recommendedMethod: null, label: 'No retry needed', reason: 'No recoverable failed attempt was found.' });
  const category = classifyFailure(latest.failureCategory);
  return Response.json({ category, ...recommendRecovery(category) });
}

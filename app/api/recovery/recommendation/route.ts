import { getRawDb } from '@/db/raw';

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get('orderId');
  if (!orderId) return Response.json({ error: 'Order ID is required.' }, { status: 400 });
  const latest = await getRawDb().prepare('SELECT method, status, failure_category AS failureCategory FROM payment_attempts WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').bind(orderId).first<{ method: string; status: string; failureCategory: string | null }>();
  if (!latest || latest.status !== 'refused') return Response.json({ eligible: false, reason: 'No recoverable failed attempt was found.' });
  const method = latest.method === 'upi' ? 'card' : 'upi';
  return Response.json({ eligible: true, recommendedMethod: method, label: method === 'upi' ? 'Retry with UPI' : 'Try a card instead', reason: latest.failureCategory === 'payment_method_declined' ? 'Offer a different payment method instead of repeating the same declined attempt.' : 'A different payment method may complete the order safely.' });
}

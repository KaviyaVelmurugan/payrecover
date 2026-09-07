import { getRawDb } from '@/db/raw';

type RequestedItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { customerName?: string; customerEmail?: string; campaign?: string; items?: RequestedItem[] };
    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim().toLowerCase();
    const items = body.items?.filter((item) => typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10) ?? [];
    if (!customerName || !customerEmail || !customerEmail.includes('@') || items.length === 0) return Response.json({ error: 'Provide customer details and at least one valid item.' }, { status: 400 });

    const db = getRawDb();
    const uniqueIds = [...new Set(items.map((item) => item.productId))];
    const placeholders = uniqueIds.map(() => '?').join(',');
    const productRows = await db.prepare(`SELECT id, name, price_minor AS priceMinor FROM products WHERE active = 1 AND id IN (${placeholders})`).bind(...uniqueIds).all<{ id: string; name: string; priceMinor: number }>();
    if (productRows.results.length !== uniqueIds.length) return Response.json({ error: 'One or more products are unavailable.' }, { status: 409 });

    const byId = new Map(productRows.results.map((product) => [product.id, product]));
    const pricedItems = items.map((item) => ({ ...item, product: byId.get(item.productId)! }));
    const totalMinor = pricedItems.reduce((sum, item) => sum + item.product.priceMinor * item.quantity, 0);
    const orderId = `PR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const now = Math.floor(Date.now() / 1000);
    const statements = [db.prepare('INSERT INTO orders (id, customer_name, customer_email, currency, total_minor, status, campaign, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(orderId, customerName, customerEmail, 'INR', totalMinor, 'created', body.campaign?.trim() || 'direct', now, now)];
    for (const item of pricedItems) statements.push(db.prepare('INSERT INTO order_items (id, order_id, product_id, product_name, unit_price_minor, quantity) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), orderId, item.productId, item.product.name, item.product.priceMinor, item.quantity));
    await db.batch(statements);
    return Response.json({ order: { id: orderId, totalMinor, currency: 'INR', status: 'created' } }, { status: 201 });
  } catch (error) {
    console.error('order_create_failed', error);
    return Response.json({ error: 'The order could not be created.' }, { status: 500 });
  }
}

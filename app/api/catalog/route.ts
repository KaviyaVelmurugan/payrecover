import { getRawDb } from '@/db/raw';

const seedProducts = [
  ['prod_headphones', 'Orbit Wireless Headphones', 'Immersive sound with 32-hour battery life.', 'Audio', 249900],
  ['prod_watch', 'Pulse Active Watch', 'Fitness, sleep and notification tracking.', 'Wearables', 329900],
  ['prod_speaker', 'Echo Mini Speaker', 'Compact room-filling Bluetooth audio.', 'Audio', 189900],
  ['prod_charger', 'Swift 65W Charger', 'Fast USB-C charging for phones and laptops.', 'Accessories', 129900],
  ['prod_earbuds', 'AirBeat Earbuds', 'Pocket-size audio with active noise control.', 'Audio', 219900],
  ['prod_stand', 'Arc Laptop Stand', 'Adjustable aluminium desk stand.', 'Accessories', 79900],
] as const;

export async function GET() {
  try {
    const db = getRawDb();
    const existing = await db.prepare('SELECT id, name, description, category, price_minor AS priceMinor FROM products WHERE active = 1 ORDER BY name').all();
    if (existing.results.length === 0) {
      await db.batch(seedProducts.map((product) => db.prepare('INSERT OR IGNORE INTO products (id, name, description, category, price_minor, active) VALUES (?, ?, ?, ?, ?, 1)').bind(...product)));
      const seeded = await db.prepare('SELECT id, name, description, category, price_minor AS priceMinor FROM products WHERE active = 1 ORDER BY name').all();
      return Response.json({ products: seeded.results });
    }
    return Response.json({ products: existing.results });
  } catch (error) {
    console.error('catalog_load_failed', error);
    return Response.json({ error: 'Catalog is temporarily unavailable.' }, { status: 500 });
  }
}

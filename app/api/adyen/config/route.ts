import { getAdyenConfig } from '@/lib/adyen';

export async function GET() {
  const config = getAdyenConfig();
  return Response.json({ configured: config.checkoutReady, environment: 'test' });
}

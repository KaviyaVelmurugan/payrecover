import { env } from 'cloudflare:workers';

export function getAdyenConfig() {
  const config = {
    apiKey: env.ADYEN_API_KEY?.trim(),
    clientKey: env.ADYEN_CLIENT_KEY?.trim(),
    merchantAccount: env.ADYEN_MERCHANT_ACCOUNT?.trim(),
    hmacKey: env.ADYEN_HMAC_KEY?.trim(),
  };
  return { ...config, checkoutReady: Boolean(config.apiKey && config.clientKey && config.merchantAccount), webhookReady: Boolean(config.hmacKey) };
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) throw new Error('Invalid HMAC key format.');
  return Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

export type AdyenNotification = {
  additionalData?: { hmacSignature?: string };
  amount?: { value?: number; currency?: string };
  eventCode?: string;
  merchantAccountCode?: string;
  merchantReference?: string;
  originalReference?: string;
  paymentMethod?: string;
  pspReference?: string;
  success?: string;
};

export async function verifyAdyenHmac(item: AdyenNotification, hexKey: string) {
  const signature = item.additionalData?.hmacSignature;
  if (!signature) return false;
  const payload = [item.pspReference, item.originalReference, item.merchantAccountCode, item.merchantReference, item.amount?.value, item.amount?.currency, item.eventCode, item.success]
    .map((value) => value ?? '')
    .join(':');
  const key = await crypto.subtle.importKey('raw', hexToBytes(hexKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const supplied = Uint8Array.from(atob(signature), (character) => character.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, supplied, new TextEncoder().encode(payload));
}

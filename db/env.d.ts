declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ADYEN_API_KEY?: string;
    ADYEN_CLIENT_KEY?: string;
    ADYEN_MERCHANT_ACCOUNT?: string;
    ADYEN_HMAC_KEY?: string;
  }
}

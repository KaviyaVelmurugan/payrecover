# PayRecover

PayRecover is a beginner-friendly FinTech + MarTech project for independent online merchants. It demonstrates how a checkout can preserve an order after a failed payment, recommend a safe retry, and measure recovered revenue.

## Current milestone — Phase 3

- Merchant payment-health dashboard
- Persistent six-product demo storefront and quantity-based cart
- Server-priced order creation with customer and campaign context
- Persistent failed-card to UPI recovery journey
- Live dashboard aggregation from orders and payment attempts
- D1/SQLite migrations for products, orders, items, attempts, webhooks, and analytics
- Real Adyen test Sessions endpoint and embedded Web Drop-in
- HMAC-verified, duplicate-safe Adyen Standard webhook endpoint
- Webhook-authoritative order and attempt reconciliation
- Rule-based recovery recommendation after a declined attempt
- Simulator fallback when Adyen test credentials are not configured

All visible numbers are test data. Production payments are intentionally unsupported.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` and add credentials from your Adyen test Customer Area to activate Drop-in. Register the Standard webhook URL as `/api/adyen/webhooks`, enable HMAC signing, and put its hexadecimal HMAC key in `ADYEN_HMAC_KEY`. Without these values, PayRecover stays in its fully working simulator mode.

## Architecture

The React/Vinext interface runs on Cloudflare Workers through Sites. Durable structured data uses D1. Catalog, order, payment, webhook, recommendation, and dashboard APIs run server-side. Only Adyen's public client key reaches the browser; API and HMAC secrets stay in server runtime variables.

See `docs/PROJECT.md` for scope, rules, and the phased implementation plan.

## Security

PayRecover supports Adyen test mode and simulated outcomes; it must not process real money. Do not commit API keys, webhook secrets, payment credentials, or production customer data. Please read [SECURITY.md](SECURITY.md) before reporting a vulnerability.

## License

This project is available under the [MIT License](LICENSE). Copyright © 2026 KaviyaVelmurugan.

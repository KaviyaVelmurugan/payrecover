# PayRecover

PayRecover is a beginner-friendly FinTech + MarTech project for independent online merchants. It demonstrates how a checkout can preserve an order after a failed payment, recommend a safe retry, and measure recovered revenue.

## Current milestone

- Merchant payment-health dashboard
- Customer demo storefront
- Interactive failed-card to UPI recovery simulation
- D1/SQLite schema for orders, payment attempts, webhook events, and checkout analytics
- Adyen-ready architecture with no live credentials required

All visible numbers are clearly marked as demo data. No real payments are processed yet.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

The React/Vinext interface runs on Cloudflare Workers through Sites. Durable structured data uses D1. Payment-provider integration will sit behind server routes so API and HMAC secrets never reach the browser.

See `docs/PROJECT.md` for scope, rules, and the phased implementation plan.

## Security

PayRecover currently simulates payment outcomes and does not process real money. Do not commit API keys, webhook secrets, payment credentials, or production customer data. Please read [SECURITY.md](SECURITY.md) before reporting a vulnerability.

## License

This project is available under the [MIT License](LICENSE). Copyright © 2026 KaviyaVelmurugan.

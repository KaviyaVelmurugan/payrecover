# PayRecover project brief

## Problem

Independent e-commerce merchants can see that payments fail, but often cannot connect the failure, retry, campaign, and final confirmed revenue into one understandable journey.

## Product goal

Help a merchant answer three questions:

1. Where is payment conversion being lost?
2. Which safe recovery action should be offered?
3. How much confirmed revenue did recovery generate?

## Users

- Shopper: completes a purchase and receives a useful recovery path after failure.
- Merchant operator: reviews orders, attempts, failure categories, and recovered revenue.

## Non-negotiable payment rules

- Product prices and totals are calculated on the server.
- Raw card or UPI credentials are never stored.
- A payment attempt owns a stable idempotency key.
- Provider webhooks are authenticated and deduplicated.
- The webhook-backed server state is authoritative; browser callbacks are provisional.
- Every retry stays connected to the original order.

## Delivery phases

### Phase 1 — foundation (current)

Product shell, recovery simulator, domain vocabulary, durable schema, responsive UI, and project documentation.

### Phase 2 — commerce lifecycle

Persist products, carts, orders, and payment attempts. Add server-side totals and order-status APIs.

### Phase 3 — Adyen test integration

Create Sessions, render embedded checkout, validate HMAC webhooks, implement idempotency, and reconcile redirects with final webhook outcomes.

### Phase 4 — recovery intelligence

Classify safe failure categories, recommend eligible alternatives, record retries, and calculate recovered revenue.

### Phase 5 — MarTech analytics

Add campaign attribution, checkout funnel events, method-level conversion, and one controlled experiment.

## Initial success metrics

- Authorization rate
- Failed-attempt rate
- Retry rate
- Retry success rate
- Recovered orders
- Recovered revenue
- Confirmed revenue by campaign

## Out of scope for the first version

Real money, automated refunds, machine learning, multiple payment providers, subscriptions, merchant billing, and production customer authentication.

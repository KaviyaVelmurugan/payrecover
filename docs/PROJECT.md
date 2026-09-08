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

### Phase 1 — foundation (complete)

Product shell, recovery simulator, domain vocabulary, durable schema, responsive UI, and project documentation.

### Phase 2 — commerce lifecycle (complete)

Persist products, orders, order items, and payment attempts. Calculate totals from server-owned product prices and expose dashboard aggregation APIs. The cart remains intentionally browser-local until an order is submitted.

### Phase 3 — Adyen test integration (complete)

Creates server-side Sessions, renders embedded Drop-in, validates HMAC webhooks, keeps idempotency keys per attempt, deduplicates notifications, and treats final webhook outcomes as authoritative. A simulator fallback keeps the learning path usable without credentials.

### Phase 4 — recovery intelligence (started)

The first transparent rule recommends changing payment method after a decline. Next, expand failure classification, eligibility rules, retry tracking, and recovery-performance reporting.

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

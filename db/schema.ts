import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(), customerName: text('customer_name').notNull(), currency: text('currency').notNull().default('INR'), totalMinor: integer('total_minor').notNull(),
  status: text('status', { enum: ['created', 'payment_started', 'paid', 'failed', 'refunded'] }).notNull().default('created'), campaign: text('campaign'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [index('idx_orders_status_created').on(table.status, table.createdAt)]);

export const paymentAttempts = sqliteTable('payment_attempts', {
  id: text('id').primaryKey(), orderId: text('order_id').notNull().references(() => orders.id), provider: text('provider').notNull().default('adyen'), providerReference: text('provider_reference'),
  idempotencyKey: text('idempotency_key').notNull(), method: text('method').notNull(), amountMinor: integer('amount_minor').notNull(),
  status: text('status', { enum: ['created', 'pending', 'authorised', 'refused', 'cancelled'] }).notNull().default('created'), failureCategory: text('failure_category'), recoveredFromAttemptId: text('recovered_from_attempt_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(), updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [uniqueIndex('idx_attempts_idempotency').on(table.idempotencyKey), index('idx_attempts_order_created').on(table.orderId, table.createdAt)]);

export const webhookEvents = sqliteTable('webhook_events', {
  id: text('id').primaryKey(), eventCode: text('event_code').notNull(), providerReference: text('provider_reference').notNull(), payload: text('payload').notNull(),
  hmacVerified: integer('hmac_verified', { mode: 'boolean' }).notNull(), processedAt: integer('processed_at', { mode: 'timestamp' }), receivedAt: integer('received_at', { mode: 'timestamp' }).notNull(),
}, (table) => [uniqueIndex('idx_webhook_event_provider_ref').on(table.eventCode, table.providerReference)]);

export const checkoutEvents = sqliteTable('checkout_events', {
  id: text('id').primaryKey(), orderId: text('order_id').references(() => orders.id), sessionId: text('session_id').notNull(), eventName: text('event_name').notNull(),
  paymentMethod: text('payment_method'), campaign: text('campaign'), occurredAt: integer('occurred_at', { mode: 'timestamp' }).notNull(),
}, (table) => [index('idx_checkout_session_time').on(table.sessionId, table.occurredAt)]);

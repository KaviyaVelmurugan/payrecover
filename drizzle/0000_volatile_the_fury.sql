CREATE TABLE `checkout_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`session_id` text NOT NULL,
	`event_name` text NOT NULL,
	`payment_method` text,
	`campaign` text,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_checkout_session_time` ON `checkout_events` (`session_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`unit_price_minor` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`total_minor` integer NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`campaign` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_status_created` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `payment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text DEFAULT 'adyen' NOT NULL,
	`provider_reference` text,
	`idempotency_key` text NOT NULL,
	`method` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`failure_category` text,
	`recovered_from_attempt_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_attempts_idempotency` ON `payment_attempts` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_attempts_order_created` ON `payment_attempts` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`price_minor` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_code` text NOT NULL,
	`provider_reference` text NOT NULL,
	`payload` text NOT NULL,
	`hmac_verified` integer NOT NULL,
	`processed_at` integer,
	`received_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_webhook_event_provider_ref` ON `webhook_events` (`event_code`,`provider_reference`);
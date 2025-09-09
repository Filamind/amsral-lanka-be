ALTER TABLE "customer_orders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_order_lines" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_order_line_processes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "customer_orders" CASCADE;--> statement-breakpoint
DROP TABLE "customer_order_lines" CASCADE;--> statement-breakpoint
DROP TABLE "customer_order_line_processes" CASCADE;--> statement-breakpoint
DROP INDEX "idx_item_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "item_id";
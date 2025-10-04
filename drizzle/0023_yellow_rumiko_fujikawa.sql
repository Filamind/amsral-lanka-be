ALTER TABLE "order_records" ALTER COLUMN "process_types" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_quantity" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "order_records" ADD COLUMN "damage_count" integer DEFAULT 0;
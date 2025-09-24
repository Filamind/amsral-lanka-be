ALTER TABLE "orders" RENAME COLUMN "is_paid" TO "item_id";--> statement-breakpoint
CREATE INDEX "idx_item_id" ON "orders" USING btree ("item_id");
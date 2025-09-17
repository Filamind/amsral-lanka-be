ALTER TABLE "orders" ADD COLUMN "billing_status" varchar(20) DEFAULT 'pending';--> statement-breakpoint
CREATE INDEX "idx_billing_status" ON "orders" USING btree ("billing_status");
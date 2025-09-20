ALTER TABLE "orders" ADD COLUMN "gp_no" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_no" varchar(100);--> statement-breakpoint
CREATE INDEX "idx_gp_no" ON "orders" USING btree ("gp_no");--> statement-breakpoint
CREATE INDEX "idx_invoice_no" ON "orders" USING btree ("invoice_no");
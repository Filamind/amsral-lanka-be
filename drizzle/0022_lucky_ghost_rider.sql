ALTER TABLE "customers" ADD COLUMN "balance" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment" numeric(10, 2) DEFAULT '0.00';
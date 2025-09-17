CREATE TABLE "item_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"category" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "item_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"order_ids" json NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 4) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payment_terms" integer NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"payment_date" date,
	"payment_method" varchar(50),
	"payment_reference" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"record_id" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_pricing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" varchar(255),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "order_record_pricing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"record_id" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" varchar(255),
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "invoice_records" ADD CONSTRAINT "invoice_records_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invoice_number" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoice_customer_id" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoice_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_invoice_records_invoice_id" ON "invoice_records" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_records_order_id" ON "invoice_records" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_records_record_id" ON "invoice_records" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_history_order_id" ON "order_pricing_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_record_pricing_history_order_id" ON "order_record_pricing_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_record_pricing_history_record_id" ON "order_record_pricing_history" USING btree ("record_id");
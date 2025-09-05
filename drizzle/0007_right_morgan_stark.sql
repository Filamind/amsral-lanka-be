CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"reference_no" varchar(50) NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"item_id" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"delivery_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'Pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_reference_no_unique" UNIQUE("reference_no")
);
--> statement-breakpoint
CREATE TABLE "order_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"wash_type" varchar(50) NOT NULL,
	"process_types" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_records" ADD CONSTRAINT "order_records_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reference_no" ON "orders" USING btree ("reference_no");--> statement-breakpoint
CREATE INDEX "idx_customer_id" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_item_id" ON "orders" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_date" ON "orders" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_delivery_date" ON "orders" USING btree ("delivery_date");--> statement-breakpoint
CREATE INDEX "idx_order_id" ON "order_records" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_wash_type" ON "order_records" USING btree ("wash_type");
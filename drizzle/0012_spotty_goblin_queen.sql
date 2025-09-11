CREATE TABLE "machine_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"assigned_by_id" integer,
	"quantity" integer NOT NULL,
	"washing_machine" varchar(50),
	"drying_machine" varchar(50),
	"assigned_at" timestamp with time zone DEFAULT now(),
	"status" varchar(20) DEFAULT 'In Progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DROP INDEX "idx_order_id";--> statement-breakpoint
DROP INDEX "idx_wash_type";--> statement-breakpoint
ALTER TABLE "order_records" ADD COLUMN "item_id" varchar(50);--> statement-breakpoint
ALTER TABLE "order_records" ADD COLUMN "tracking_number" varchar(20);--> statement-breakpoint
ALTER TABLE "order_records" ADD COLUMN "status" varchar(20) DEFAULT 'Pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "machine_assignments" ADD CONSTRAINT "machine_assignments_record_id_order_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."order_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_assignments" ADD CONSTRAINT "machine_assignments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_assignments" ADD CONSTRAINT "machine_assignments_assigned_by_id_employees_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assignment_record_id" ON "machine_assignments" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "idx_assignment_order_id" ON "machine_assignments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_assignment_assigned_by_id" ON "machine_assignments" USING btree ("assigned_by_id");--> statement-breakpoint
CREATE INDEX "idx_assignment_status" ON "machine_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_order_records_order_id" ON "order_records" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_records_item_id" ON "order_records" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_order_records_wash_type" ON "order_records" USING btree ("wash_type");--> statement-breakpoint
CREATE INDEX "idx_order_records_status" ON "order_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_order_records_tracking_number" ON "order_records" USING btree ("tracking_number");
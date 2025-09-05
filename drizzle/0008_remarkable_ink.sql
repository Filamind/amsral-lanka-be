CREATE TABLE "items" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "items_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "idx_items_name" ON "items" USING btree ("name");